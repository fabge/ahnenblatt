import SwiftUI

enum TreeMode: String, CaseIterable {
    case ancestors   = "Vorfahren"
    case descendants = "Nachfahren"
}

struct TreeCanvasView: View {
    @EnvironmentObject var store: FamilyTreeStore
    let rootId: String

    @State private var mode: TreeMode = .ancestors
    @State private var generations = 4
    @State private var invert = false
    @State private var lastScale: CGFloat = 1.0
    @State private var lastOffset: CGSize = .zero
    @State private var selectedId: String?

    // Pan/zoom state mirrors store-backed values so it survives tab switches.
    private var scale: CGFloat {
        get { store.canvasScale } nonmutating set { store.canvasScale = newValue }
    }
    private var offset: CGSize {
        get { store.canvasOffset } nonmutating set { store.canvasOffset = newValue }
    }
    private var didCenter: Bool {
        get { store.canvasCentered } nonmutating set { store.canvasCentered = newValue }
    }

    // One-finger zoom (Google-Maps style): a quick tap arms the next touch's
    // drag to control scale instead of panning.
    @State private var lastTapAt: Date = .distantPast
    @State private var dragActive = false
    @State private var inZoomDrag = false
    @State private var zoomAnchor: CGPoint = .zero

    private var layout: FamilyTreeStore.TreeLayout {
        let base = mode == .ancestors
            ? store.ancestorLayout(rootId: rootId, generations: generations)
            : store.descendantLayout(rootId: rootId, generations: generations)
        return invert ? flipVertically(base) : base
    }

    private func flipVertically(_ l: FamilyTreeStore.TreeLayout) -> FamilyTreeStore.TreeLayout {
        let h = l.size.height
        return FamilyTreeStore.TreeLayout(
            nodes: l.nodes.map { .init(personId: $0.personId, x: $0.x, y: h - $0.y) },
            links: l.links.map { .init(x1: $0.x1, y1: h - $0.y1, x2: $0.x2, y2: h - $0.y2) },
            size: l.size
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            toolbar
            GeometryReader { geo in
                treeContent(layout: layout, geo: geo)
            }
        }
        .sheet(item: Binding(
            get: { selectedId.flatMap { store.persons[$0] } },
            set: { selectedId = $0?.id }
        )) { person in
            PersonDetailView(person: person)
                .environmentObject(store)
        }
    }

    // MARK: – Toolbar

    private var toolbar: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Picker("Modus", selection: $mode) {
                    ForEach(TreeMode.allCases, id: \.self) {
                        Text($0.rawValue).tag($0)
                    }
                }
                .pickerStyle(.segmented)

                Spacer()

                Menu {
                    Section("Generationen") {
                        ForEach(2...7, id: \.self) { g in
                            Button {
                                generations = g
                            } label: {
                                Label("\(g) Generationen",
                                      systemImage: generations == g ? "checkmark" : "")
                            }
                        }
                        Button {
                            generations = 99
                        } label: {
                            Label("Alle Generationen",
                                  systemImage: generations >= 99 ? "checkmark" : "")
                        }
                    }
                    Section {
                        Button {
                            invert.toggle()
                        } label: {
                            Label("Hierarchie umkehren", systemImage: "arrow.up.arrow.down")
                        }
                    }
                } label: {
                    Image(systemName: "slider.horizontal.3")
                        .font(.subheadline)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)

            Divider()
        }
        .background(.bar)
    }

    // MARK: – Tree content

    private func treeContent(layout: FamilyTreeStore.TreeLayout, geo: GeometryProxy) -> some View {
        ZStack(alignment: .topLeading) {
            Color(.systemGroupedBackground)

            ZStack(alignment: .topLeading) {
                Canvas { ctx, _ in
                    for link in layout.links {
                        var path = Path()
                        path.move(to: CGPoint(x: link.x1, y: link.y1))
                        path.addLine(to: CGPoint(x: link.x2, y: link.y2))
                        ctx.stroke(path, with: .color(.secondary.opacity(0.4)), lineWidth: 1.5)
                    }
                }
                .frame(width: layout.size.width, height: layout.size.height)

                ForEach(layout.nodes) { node in
                    if let person = store.persons[node.personId] {
                        MiniPersonCard(person: person, isRoot: node.personId == rootId)
                            .frame(width: 150, height: 90)
                            .position(x: node.x, y: node.y)
                            .onTapGesture { selectedId = node.personId }
                    }
                }
            }
            .frame(width: layout.size.width, height: layout.size.height)
            .scaleEffect(scale, anchor: .topLeading)
            .offset(offset)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .contentShape(Rectangle())
        .clipped()
        .ignoresSafeArea(edges: .bottom)
        .simultaneousGesture(unifiedDrag(geo: geo, layout: layout))
        .simultaneousGesture(magnifyGesture)
        // GeometryReader's first measure can be 0×0 during the WelcomeView→tab
        // transition; in that case onAppear's center() lands on the wrong spot.
        // Re-center on the first real size we see.
        .onChange(of: geo.size) { _, new in
            if !didCenter && new.width > 100 && new.height > 100 {
                center(geo: geo, layout: layout)
                didCenter = true
            }
        }
        .onAppear {
            if !didCenter && geo.size.width > 100 && geo.size.height > 100 {
                center(geo: geo, layout: layout)
                didCenter = true
            }
        }
        .onChange(of: rootId) { _, _ in center(geo: geo, layout: layout) }
        .onChange(of: mode) { _, _ in center(geo: geo, layout: layout) }
        .onChange(of: invert) { _, _ in center(geo: geo, layout: layout) }
        .onChange(of: generations) { _, _ in center(geo: geo, layout: layout) }
    }

    private func center(geo: GeometryProxy, layout: FamilyTreeStore.TreeLayout) {
        scale = 1.0
        lastScale = 1.0
        // Center on the root person, not the canvas bbox — for ancestor trees the
        // bbox center is roughly the middle generation, which feels off.
        let root = layout.nodes.first(where: { $0.personId == rootId })
        let rx = root?.x ?? layout.size.width  / 2
        let ry = root?.y ?? layout.size.height / 2
        offset = CGSize(width: geo.size.width / 2 - rx,
                        height: geo.size.height / 2 - ry)
        lastOffset = offset
    }

    // Pan, double-tap-to-center, and Google-Maps-style one-finger zoom rolled
    // into one DragGesture. minimumDistance: 0 so touch-down arrives as the
    // first onChanged event — we resolve the gesture's role based on whether a
    // quick tap happened just before.
    private func unifiedDrag(geo: GeometryProxy, layout: FamilyTreeStore.TreeLayout) -> some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { v in
                if !dragActive {
                    dragActive = true
                    // Re-seed from store in case the view was re-created
                    // (e.g. tab switch) and the @State values are stale.
                    lastScale = scale
                    lastOffset = offset
                    if Date().timeIntervalSince(lastTapAt) < 0.35 {
                        inZoomDrag = true
                        zoomAnchor = v.startLocation
                    }
                }
                if inZoomDrag {
                    // Vertical motion ↕ scale; ~200 px per e-fold for a calm feel.
                    let factor = exp(-v.translation.height / 200)
                    let newScale = min(max(lastScale * factor, 0.15), 4)
                    let ratio = newScale / lastScale
                    let p = zoomAnchor
                    offset = CGSize(
                        width:  p.x - (p.x - lastOffset.width)  * ratio,
                        height: p.y - (p.y - lastOffset.height) * ratio
                    )
                    scale = newScale
                } else if v.translation != .zero {
                    offset = CGSize(
                        width:  lastOffset.width  + v.translation.width,
                        height: lastOffset.height + v.translation.height
                    )
                }
            }
            .onEnded { v in
                let dist = hypot(v.translation.width, v.translation.height)
                if dist < 5 {
                    // No real motion → this was a tap.
                    if Date().timeIntervalSince(lastTapAt) < 0.35 {
                        // Second tap of a double tap → center.
                        center(geo: geo, layout: layout)
                        lastTapAt = .distantPast
                    } else {
                        lastTapAt = Date()
                    }
                } else {
                    lastOffset = offset
                    lastScale = scale
                    lastTapAt = .distantPast
                }
                dragActive = false
                inZoomDrag = false
            }
    }

    private var magnifyGesture: some Gesture {
        MagnifyGesture()
            .onChanged { v in
                if v.magnification == 1.0 {
                    // Pinch just started — re-seed in case @State is stale.
                    lastScale = scale
                    lastOffset = offset
                }
                let proposed = lastScale * v.magnification
                let newScale = min(max(proposed, 0.15), 4)
                let factor = newScale / lastScale
                let p = v.startLocation
                offset = CGSize(
                    width:  p.x - (p.x - lastOffset.width)  * factor,
                    height: p.y - (p.y - lastOffset.height) * factor
                )
                scale = newScale
            }
            .onEnded { _ in
                lastScale = scale
                lastOffset = offset
            }
    }
}

// MARK: – Mini card used in the tree

struct MiniPersonCard: View {
    let person: Person
    let isRoot: Bool
    @EnvironmentObject var store: FamilyTreeStore

    var body: some View {
        HStack(spacing: 6) {
            PersonPhotoView(person: person, size: 44)
                .padding(.leading, 6)

            VStack(alignment: .leading, spacing: 2) {
                Text(person.givenName.gedClean.nonEmpty ?? person.fullName)
                    .font(.system(size: 11, weight: .semibold))
                    .lineLimit(1)
                Text(person.surname.gedClean)
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                if !person.shortLife.isEmpty {
                    Text(person.shortLife)
                        .font(.system(size: 9))
                        .foregroundStyle(.tertiary)
                }
            }
            Spacer(minLength: 0)
        }
        .frame(width: 150, height: 90)
        .background(isRoot ? Color.blue.opacity(0.08) : Color(.secondarySystemGroupedBackground))
        .overlay {
            RoundedRectangle(cornerRadius: 10)
                .stroke(isRoot ? Color.blue : Color(.separator), lineWidth: isRoot ? 2 : 0.5)
        }
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(color: .black.opacity(0.06), radius: 3, y: 2)
    }
}
