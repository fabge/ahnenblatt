import SwiftUI

struct PersonDetailView: View {
    let person: Person
    @EnvironmentObject var store: FamilyTreeStore
    @Environment(\.dismiss) private var dismiss
    @State private var showTree = false

    var body: some View {
        NavigationStack {
            List {
                // ── Header ──────────────────────────────────────────────────
                Section {
                    HStack(spacing: 16) {
                        PersonPhotoView(person: person, size: 80)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(person.fullName)
                                .font(.title2.bold())
                            if !person.shortLife.isEmpty {
                                Text(person.shortLife)
                                    .foregroundStyle(.secondary)
                            }
                            sexBadge
                        }
                    }
                    .padding(.vertical, 4)
                }

                // ── Vital data ───────────────────────────────────────────────
                Section("Lebensdaten") {
                    if !person.birthDate.isEmpty || !person.birthPlace.isEmpty {
                        DataRow(label: "Geburt",
                                value: [person.birthDate, person.birthPlace].filter { !$0.isEmpty }.joined(separator: ", "))
                    }
                    if !person.deathDate.isEmpty || !person.deathPlace.isEmpty {
                        DataRow(label: "Tod",
                                value: [person.deathDate, person.deathPlace].filter { !$0.isEmpty }.joined(separator: ", "))
                    }
                    if !person.burialDate.isEmpty || !person.burialPlace.isEmpty {
                        DataRow(label: "Beerdigung",
                                value: [person.burialDate, person.burialPlace].filter { !$0.isEmpty }.joined(separator: ", "))
                    }
                    if !person.religion.isEmpty   { DataRow(label: "Religion", value: person.religion) }
                    if !person.occupation.isEmpty { DataRow(label: "Beruf",    value: person.occupation) }
                }

                // ── Parents ──────────────────────────────────────────────────
                let parents = store.parents(of: person.id)
                if !parents.isEmpty {
                    Section("Eltern") {
                        ForEach(parents) { parent in
                            PersonRow(person: parent)
                        }
                    }
                }

                // ── Siblings ────────────────────────────────────────────────
                let siblings = store.siblings(of: person.id)
                if !siblings.isEmpty {
                    Section("Geschwister") {
                        ForEach(siblings) { sibling in
                            PersonRow(person: sibling)
                        }
                    }
                }

                // ── Spouse families ──────────────────────────────────────────
                let sfs = store.spouseFamilies(of: person.id)
                ForEach(sfs, id: \.family.id) { sf in
                    if let spouse = sf.spouse {
                        Section {
                            PersonRow(person: spouse)
                            if !sf.family.marriageDate.isEmpty || !sf.family.marriagePlace.isEmpty {
                                DataRow(label: "Heirat",
                                        value: [sf.family.marriageDate, sf.family.marriagePlace].filter { !$0.isEmpty }.joined(separator: ", "))
                            }
                            ForEach(sf.children) { child in
                                PersonRow(person: child)
                            }
                        } header: {
                            Text("Familie mit \(spouse.fullName)")
                        }
                    } else if !sf.children.isEmpty {
                        Section("Kinder") {
                            ForEach(sf.children) { child in
                                PersonRow(person: child)
                            }
                        }
                    }
                }

                // ── Notes ────────────────────────────────────────────────────
                if !person.notes.isEmpty {
                    Section("Notizen") {
                        Text(person.notes)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    }
                }

                // ── Tree action ───────────────────────────────────────────────
                Section {
                    Button {
                        showTree = true
                    } label: {
                        Label("Stammbaum dieser Person", systemImage: "arrow.triangle.branch")
                    }
                }
            }
            .navigationTitle(person.fullName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Schließen") { dismiss() }
                }
            }
            .navigationDestination(isPresented: $showTree) {
                TreeCanvasView(rootId: person.id)
                    .navigationTitle("Stammbaum")
                    .environmentObject(store)
            }
        }
    }

    @ViewBuilder private var sexBadge: some View {
        switch person.sex {
        case "M":
            Text("♂ Männlich")
                .font(.caption.bold())
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(.blue.opacity(0.12))
                .foregroundStyle(.blue)
                .clipShape(Capsule())
        case "F":
            Text("♀ Weiblich")
                .font(.caption.bold())
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(.pink.opacity(0.12))
                .foregroundStyle(.pink)
                .clipShape(Capsule())
        default:
            EmptyView()
        }
    }
}

// MARK: – Helpers

private struct DataRow: View {
    let label: String
    let value: String
    var body: some View {
        LabeledContent(label) { Text(value).foregroundStyle(.primary) }
    }
}

struct PersonRow: View {
    let person: Person
    @EnvironmentObject var store: FamilyTreeStore
    @State private var showDetail = false

    var body: some View {
        Button { showDetail = true } label: {
            HStack(spacing: 12) {
                PersonPhotoView(person: person, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(person.fullName).font(.body).foregroundStyle(.primary)
                    if !person.shortLife.isEmpty {
                        Text(person.shortLife).font(.caption).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.tertiary).font(.caption)
            }
        }
        .sheet(isPresented: $showDetail) {
            PersonDetailView(person: person).environmentObject(store)
        }
    }
}
