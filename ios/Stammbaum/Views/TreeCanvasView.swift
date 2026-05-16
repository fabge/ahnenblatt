import SwiftUI

enum TreeMode: String, CaseIterable {
    case ancestors   = "Vorfahren"
    case descendants = "Nachfahren"
}

struct TreeCanvasView: View {
    @EnvironmentObject var store: FamilyTreeStore
    let rootId: String

    @State private var mode: TreeMode = .descendants
    @State private var generations = 4
    @State private var scale: CGFloat = 1.0
    @State private var selectedId: String?

    private var layout: FamilyTreeStore.TreeLayout {
        mode == .ancestors
            ? store.ancestorLayout(rootId: rootId, generations: generations)
            : store.descendantLayout(rootId: rootId, generations: generations)
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
                    ForEach(2...7, id: \.self) { g in
                        Button("\(g) Generationen") { generations = g }
                    }
                } label: {
                    Label("\(generations) Gen.", systemImage: "chart.bar")
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
        ScrollView([.horizontal, .vertical], showsIndicators: true) {
            ZStack(alignment: .topLeading) {
                // Connector lines
                Canvas { ctx, _ in
                    for link in layout.links {
                        var path = Path()
                        path.move(to: CGPoint(x: link.x1 * scale, y: link.y1 * scale))
                        path.addLine(to: CGPoint(x: link.x2 * scale, y: link.y2 * scale))
                        ctx.stroke(path, with: .color(.secondary.opacity(0.4)), lineWidth: 1.5)
                    }
                }
                .frame(width: layout.size.width * scale, height: layout.size.height * scale)

                // Person cards
                ForEach(layout.nodes) { node in
                    if let person = store.persons[node.personId] {
                        MiniPersonCard(person: person, isRoot: node.personId == rootId)
                            .frame(width: 150 * scale, height: 90 * scale)
                            .position(x: node.x * scale, y: node.y * scale)
                            .onTapGesture { selectedId = node.personId }
                    }
                }
            }
            .frame(width: layout.size.width * scale, height: layout.size.height * scale)
        }
        .background(Color(.systemGroupedBackground))
        .overlay(alignment: .bottomTrailing) { zoomControls }
    }

    private var zoomControls: some View {
        VStack(spacing: 0) {
            Button { scale = min(scale * 1.3, 3) } label: {
                Image(systemName: "plus").frame(width: 44, height: 44)
            }
            Divider()
            Button { scale = max(scale / 1.3, 0.25) } label: {
                Image(systemName: "minus").frame(width: 44, height: 44)
            }
        }
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding()
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
