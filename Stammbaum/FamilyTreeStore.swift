import SwiftUI
import UIKit

@MainActor
final class FamilyTreeStore: ObservableObject {
    @Published var persons: [String: Person] = [:]
    @Published var families: [String: Family] = [:]
    @Published var isLoaded = false
    @Published var folderURL: URL?
    @Published var rootPersonId: String? {
        didSet {
            if let id = rootPersonId {
                UserDefaults.standard.set(id, forKey: rootPersonIdKey)
            } else {
                UserDefaults.standard.removeObject(forKey: rootPersonIdKey)
            }
            // Changing the root person should re-center the canvas.
            if oldValue != rootPersonId { canvasCentered = false }
        }
    }
    @Published var loadError: String?

    // Canvas state lives in the store so zoom/pan survives tab switches and
    // any view re-creation. Reset on folder load and root change.
    @Published var canvasScale: CGFloat = 1.0
    @Published var canvasOffset: CGSize = .zero
    @Published var canvasCentered: Bool = false

    private let bookmarkKey = "familyFolderBookmark"
    private let rootPersonIdKey = "rootPersonId"

    // MARK: – Loading

    func load(from folderURL: URL) async {
        self.folderURL = folderURL
        canvasCentered = false
        canvasScale = 1.0
        canvasOffset = .zero
        let accessed = folderURL.startAccessingSecurityScopedResource()
        defer { if accessed { folderURL.stopAccessingSecurityScopedResource() } }

        guard let gedURL = findGEDCOM(in: folderURL) else {
            loadError = "Keine GEDCOM-Datei (.ged) im gewählten Ordner gefunden."
            return
        }

        let (p, f) = GEDCOMParser.parse(gedURL: gedURL)
        self.persons = p
        self.families = f
        self.isLoaded = !p.isEmpty

        // Restore persisted root if it still exists in the loaded data,
        // otherwise pick the most-ancestral person.
        if let saved = UserDefaults.standard.string(forKey: rootPersonIdKey),
           persons[saved] != nil {
            rootPersonId = saved
        } else if rootPersonId == nil || persons[rootPersonId!] == nil {
            rootPersonId = mostAncestralPerson()
        }
    }

    private func findGEDCOM(in url: URL) -> URL? {
        guard let contents = try? FileManager.default.contentsOfDirectory(
            at: url, includingPropertiesForKeys: nil) else { return nil }
        return contents.first { $0.pathExtension.lowercased() == "ged" }
    }

    // MARK: – Bookmark

    func saveBookmark(for url: URL) {
        // The picker URL is security-scoped — bookmarkData() must be called
        // while a scope is active or the resulting bookmark can't be resolved
        // back to a usable URL after relaunch. Default options (not
        // .minimalBookmark) keep the security-scope payload.
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? url.bookmarkData(
            options: [],
            includingResourceValuesForKeys: nil,
            relativeTo: nil
        ) else { return }
        UserDefaults.standard.set(data, forKey: bookmarkKey)
    }

    func loadBookmarkedFolder() async {
        guard let data = UserDefaults.standard.data(forKey: bookmarkKey) else { return }
        var stale = false
        guard let url = try? URL(
            resolvingBookmarkData: data,
            options: [],
            relativeTo: nil,
            bookmarkDataIsStale: &stale
        ) else {
            // Truly corrupt bookmark — wipe it.
            UserDefaults.standard.removeObject(forKey: bookmarkKey)
            return
        }
        if stale { saveBookmark(for: url) }
        await load(from: url)
        // Keep the bookmark around even if this load didn't find a .ged —
        // the folder may temporarily lack content (e.g. iCloud not synced),
        // and the user can retry. Just clean up surfaced state.
        if !isLoaded {
            loadError = nil
            folderURL = nil
        }
    }

    func clearFolder() {
        UserDefaults.standard.removeObject(forKey: bookmarkKey)
        UserDefaults.standard.removeObject(forKey: rootPersonIdKey)
        persons = [:]
        families = [:]
        isLoaded = false
        folderURL = nil
        rootPersonId = nil
        loadError = nil
    }

    // MARK: – Photo

    func imageURL(for person: Person) -> URL? {
        guard !person.photoPath.isEmpty, let folder = folderURL else { return nil }
        // The folder URL came from a security-scoped bookmark/picker; we need an
        // active scope to enumerate it. Callers may or may not hold one already
        // (start is reference-counted, so nesting is safe).
        let accessed = folder.startAccessingSecurityScopedResource()
        defer { if accessed { folder.stopAccessingSecurityScopedResource() } }

        let basename = (person.photoPath as NSString).lastPathComponent

        for candidate in [folder.appendingPathComponent(person.photoPath),
                          folder.appendingPathComponent(basename)] {
            if FileManager.default.fileExists(atPath: candidate.path) { return candidate }
        }

        // Fall back to case-insensitive scan of immediate subdirectories
        // (Windows GEDCOMs often embed absolute paths like C:\...\stammbaum Media\foo.jpg).
        let target = basename.lowercased()
        guard let subs = try? FileManager.default.contentsOfDirectory(
            at: folder, includingPropertiesForKeys: [.isDirectoryKey]) else { return nil }
        for sub in subs {
            let isDir = (try? sub.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
            guard isDir,
                  let files = try? FileManager.default.contentsOfDirectory(
                    at: sub, includingPropertiesForKeys: nil) else { continue }
            if let hit = files.first(where: { $0.lastPathComponent.lowercased() == target }) {
                return hit
            }
        }
        return nil
    }

    // MARK: – Family helpers

    func parents(of id: String) -> [Person] {
        guard let p = persons[id] else { return [] }
        var result: [Person] = []
        for fid in p.familiesAsChild {
            guard let fam = families[fid] else { continue }
            if let hid = fam.husbandId, let h = persons[hid] { result.append(h) }
            if let wid = fam.wifeId,   let w = persons[wid] { result.append(w) }
        }
        return result
    }

    func siblings(of id: String) -> [Person] {
        guard let p = persons[id] else { return [] }
        var result: [Person] = []
        for fid in p.familiesAsChild {
            guard let fam = families[fid] else { continue }
            for cid in fam.childrenIds where cid != id {
                if let c = persons[cid] { result.append(c) }
            }
        }
        return result
    }

    struct SpouseFamily {
        let family: Family
        let spouse: Person?
        let children: [Person]
    }

    func spouseFamilies(of id: String) -> [SpouseFamily] {
        guard let p = persons[id] else { return [] }
        return p.familiesAsSpouse.compactMap { fid in
            guard let fam = families[fid] else { return nil }
            let spouseId = (p.id == fam.husbandId) ? fam.wifeId : fam.husbandId
            let spouse = spouseId.flatMap { persons[$0] }
            let children = fam.childrenIds.compactMap { persons[$0] }
            return SpouseFamily(family: fam, spouse: spouse, children: children)
        }
    }

    // MARK: – Tree layout

    struct LayoutNode: Identifiable {
        var id: String { personId }
        let personId: String
        let x: CGFloat
        let y: CGFloat
    }

    struct LayoutLink {
        let x1: CGFloat, y1: CGFloat, x2: CGFloat, y2: CGFloat
    }

    struct TreeLayout {
        var nodes: [LayoutNode]
        var links: [LayoutLink]
        var size: CGSize
    }

    private static let cw: CGFloat = 150   // card width
    private static let ch: CGFloat = 90    // card height
    private static let hg: CGFloat = 18    // horizontal gap
    private static let vg: CGFloat = 60    // vertical gap

    // ── Ancestor pedigree (binary tree going upward) ──────────────────────
    func ancestorLayout(rootId: String, generations: Int) -> TreeLayout {
        let cw = Self.cw, ch = Self.ch, hg = Self.hg, vg = Self.vg

        // Compute number of rows = generations, cols doubles each row
        // Row 0 = root (bottom), row N-1 = oldest ancestor (top)
        var nodes: [LayoutNode] = []
        var links: [LayoutLink] = []

        // Ahnentafel numbering: root=1, father=2n, mother=2n+1
        // Collect all nodes up to max generations using Ahnentafel numbering
        var allItems: [(id: String, ahnNr: Int, gen: Int)] = []
        var bfsQueue: [(id: String, ahnNr: Int, gen: Int)] = [(rootId, 1, 0)]
        while !bfsQueue.isEmpty {
            let item = bfsQueue.removeFirst()
            allItems.append(item)
            if item.gen >= generations - 1 { continue }
            let parentGen = item.gen + 1
            guard let p = persons[item.id] else { continue }
            for fid in p.familiesAsChild {
                guard let fam = families[fid] else { continue }
                if let hid = fam.husbandId, persons[hid] != nil {
                    bfsQueue.append((hid, item.ahnNr * 2, parentGen))
                }
                if let wid = fam.wifeId, persons[wid] != nil {
                    bfsQueue.append((wid, item.ahnNr * 2 + 1, parentGen))
                }
                break
            }
        }

        // Layout: for each generation, evenly space nodes
        let maxGen = allItems.map { $0.gen }.max() ?? 0
        let totalHeight = CGFloat(maxGen) * (ch + vg) + ch

        // Group by generation
        var byGen: [Int: [(id: String, ahnNr: Int)]] = [:]
        for item in allItems {
            byGen[item.gen, default: []].append((item.id, item.ahnNr))
        }

        // Max width is determined by the bottom-most (oldest) generation
        let maxCount = byGen.values.map { $0.count }.max() ?? 1
        let totalWidth = CGFloat(maxCount) * (cw + hg) + hg

        // Position each node
        var nodePos: [Int: CGPoint] = [:]  // ahnNr → center
        for gen in 0...maxGen {
            guard let items = byGen[gen] else { continue }
            let count = items.count
            let y = totalHeight - CGFloat(gen) * (ch + vg) - ch / 2
            // Sort by ahnNr for consistent left-right ordering
            let sorted = items.sorted { $0.ahnNr < $1.ahnNr }
            // Space them evenly in totalWidth
            let spacing = totalWidth / CGFloat(count)
            for (i, item) in sorted.enumerated() {
                let x = spacing * (CGFloat(i) + 0.5)
                nodePos[item.ahnNr] = CGPoint(x: x, y: y)
                nodes.append(LayoutNode(personId: item.id, x: x, y: y))
            }
        }

        // Orthogonal elbow routing (matches the descendant layout):
        // child-top → vertical → midY → horizontal across → midY → parent-bottom.
        for item in allItems {
            guard let childPos = nodePos[item.ahnNr] else { continue }
            let fatherNr = item.ahnNr * 2
            let motherNr = item.ahnNr * 2 + 1
            for parentNr in [fatherNr, motherNr] {
                if let parentPos = nodePos[parentNr] {
                    let childTop = childPos.y - ch / 2
                    let parentBottom = parentPos.y + ch / 2
                    let midY = (childTop + parentBottom) / 2
                    links.append(LayoutLink(x1: childPos.x, y1: childTop,
                                            x2: childPos.x, y2: midY))
                    links.append(LayoutLink(x1: childPos.x, y1: midY,
                                            x2: parentPos.x, y2: midY))
                    links.append(LayoutLink(x1: parentPos.x, y1: midY,
                                            x2: parentPos.x, y2: parentBottom))
                }
            }
        }

        return TreeLayout(
            nodes: nodes,
            links: links,
            size: CGSize(width: max(totalWidth, 400), height: max(totalHeight, 200))
        )
    }

    // ── Descendant tree (top-down) ────────────────────────────────────────
    func descendantLayout(rootId: String, generations: Int) -> TreeLayout {
        let cw = Self.cw, ch = Self.ch, hg = Self.hg, vg = Self.vg

        // Build tree structure first
        class Node {
            let personId: String
            let generation: Int
            var spouseId: String?
            var children: [Node] = []
            var subtreeWidth: CGFloat = 0
            var x: CGFloat = 0
            var y: CGFloat = 0

            init(_ id: String, _ gen: Int) { personId = id; generation = gen }
        }

        var visited = Set<String>()

        func buildNode(_ id: String, gen: Int) -> Node {
            let node = Node(id, gen)
            visited.insert(id)
            guard gen < generations, let p = persons[id] else { return node }

            for fid in p.familiesAsSpouse {
                guard let fam = families[fid] else { continue }
                let spouseId = (p.id == fam.husbandId) ? fam.wifeId : fam.husbandId
                if node.spouseId == nil { node.spouseId = spouseId }
                for cid in fam.childrenIds {
                    guard !visited.contains(cid), persons[cid] != nil else { continue }
                    node.children.append(buildNode(cid, gen: gen + 1))
                }
            }
            return node
        }

        let root = buildNode(rootId, gen: 0)

        // Compute subtree widths
        let coupleWidth = cw * 2 + hg    // paired couple takes this much
        let singleWidth = cw

        func computeWidth(_ n: Node) {
            if n.children.isEmpty {
                n.subtreeWidth = n.spouseId != nil ? coupleWidth + hg : singleWidth + hg
            } else {
                n.children.forEach { computeWidth($0) }
                n.subtreeWidth = n.children.reduce(0) { $0 + $1.subtreeWidth }
            }
        }
        computeWidth(root)

        // Assign positions
        func assignPositions(_ n: Node, leftEdge: CGFloat) {
            let y = CGFloat(n.generation) * (ch + vg) + ch / 2
            n.y = y
            if n.children.isEmpty {
                n.x = leftEdge + (n.spouseId != nil ? coupleWidth : singleWidth) / 2
            } else {
                var cursor = leftEdge
                for child in n.children {
                    assignPositions(child, leftEdge: cursor)
                    cursor += child.subtreeWidth
                }
                let firstX = n.children.first!.x
                let lastX = n.children.last!.x
                n.x = (firstX + lastX) / 2
            }
        }
        assignPositions(root, leftEdge: hg)

        // Flatten
        var nodes: [LayoutNode] = []
        var links: [LayoutLink] = []
        var allNodes: [Node] = []

        func flatten(_ n: Node) {
            allNodes.append(n)
            n.children.forEach { flatten($0) }
        }
        flatten(root)

        for n in allNodes {
            nodes.append(LayoutNode(personId: n.personId, x: n.x, y: n.y))
            // Spouse node (offset to the right)
            if let sid = n.spouseId, persons[sid] != nil {
                nodes.append(LayoutNode(personId: sid, x: n.x + cw + hg, y: n.y))
            }
            // Links to children
            let parentY = n.y + ch / 2
            for child in n.children {
                let childY = child.y - ch / 2
                let midY = (parentY + childY) / 2
                links.append(LayoutLink(x1: n.x, y1: parentY, x2: n.x, y2: midY))
                links.append(LayoutLink(x1: n.x, y1: midY, x2: child.x, y2: midY))
                links.append(LayoutLink(x1: child.x, y1: midY, x2: child.x, y2: childY))
            }
        }

        let maxX = nodes.map { $0.x }.max() ?? 0
        let maxY = nodes.map { $0.y }.max() ?? 0

        return TreeLayout(
            nodes: nodes,
            links: links,
            size: CGSize(width: maxX + cw + hg * 2, height: maxY + ch / 2 + vg)
        )
    }

    // MARK: – Utility

    private func mostAncestralPerson() -> String? {
        // Find the person who appears most as an ancestor
        let childIds = Set(families.values.flatMap { $0.childrenIds })
        // People who are never a child in any family are likely root ancestors
        let roots = persons.keys.filter { !childIds.contains($0) }
        // Return first male root, or any root
        return roots.first { persons[$0]?.sex == "M" } ?? roots.first ?? persons.keys.first
    }
}
