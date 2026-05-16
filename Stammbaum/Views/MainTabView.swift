import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var store: FamilyTreeStore

    var body: some View {
        TabView(selection: $store.selectedTab) {
            // ── Tree ──
            Group {
                if let rid = store.rootPersonId {
                    NavigationStack {
                        TreeCanvasView(rootId: rid)
                            .navigationTitle("Stammbaum")
                            .toolbarTitleDisplayMode(.inlineLarge)
                    }
                } else {
                    Text("Keine Person als Wurzel gewählt")
                        .foregroundStyle(.secondary)
                }
            }
            .tabItem { Label("Stammbaum", systemImage: "arrow.triangle.branch") }
            .tag(0)

            // ── People ──
            PeopleListView()
                .tabItem { Label("Personen", systemImage: "person.2") }
                .tag(1)

            // ── Settings ──
            SettingsView()
                .tabItem { Label("Einstellungen", systemImage: "gearshape") }
                .tag(2)
        }
    }

}

struct SettingsView: View {
    @EnvironmentObject var store: FamilyTreeStore

    var body: some View {
        NavigationStack {
            List {
                Section("Stammbaum") {
                    if let url = store.folderURL {
                        LabeledContent("Ordner") {
                            Text(url.lastPathComponent)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                    LabeledContent("Personen") { Text("\(store.persons.count)") }
                    LabeledContent("Familien") { Text("\(store.families.count)") }
                }

                Section {
                    Button(role: .destructive) {
                        store.clearFolder()
                    } label: {
                        Label("Anderen Ordner wählen", systemImage: "folder.badge.minus")
                    }
                }

                Section("Info") {
                    LabeledContent("Version") { Text("1.0") }
                    LabeledContent("Format") { Text("GEDCOM 5.5.1") }
                }
            }
            .navigationTitle("Einstellungen")
            .toolbarTitleDisplayMode(.inlineLarge)
        }
    }
}
