import SwiftUI

struct PeopleListView: View {
    @EnvironmentObject var store: FamilyTreeStore
    @State private var query = ""
    @State private var sexFilter = ""
    @State private var selectedId: String?

    private var filtered: [Person] {
        store.persons.values
            .filter { p in
                (query.isEmpty || p.fullName.localizedCaseInsensitiveContains(query))
                && (sexFilter.isEmpty || p.sex == sexFilter)
            }
            .sorted { $0.surname.gedClean < $1.surname.gedClean ||
                      ($0.surname.gedClean == $1.surname.gedClean && $0.givenName < $1.givenName) }
    }

    var body: some View {
        NavigationStack {
            // Single sheet driven by list-level selection. Per-row sheets
            // inside a .searchable list could swallow the first tap while the
            // search field was first responder — lifting the sheet up fixes it.
            List(filtered) { person in
                Button { selectedId = person.id } label: {
                    PersonRowContent(person: person)
                }
                .buttonStyle(.plain)
            }
            .searchable(text: $query, prompt: "Name suchen…")
            .navigationTitle("Personen")
            .toolbarTitleDisplayMode(.inlineLarge)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Alle") { sexFilter = "" }
                        Button("Männer ♂") { sexFilter = "M" }
                        Button("Frauen ♀") { sexFilter = "F" }
                    } label: {
                        Image(systemName: sexFilter.isEmpty ? "line.3.horizontal.decrease.circle"
                                                            : "line.3.horizontal.decrease.circle.fill")
                    }
                }
            }
            .overlay {
                if filtered.isEmpty {
                    ContentUnavailableView.search(text: query)
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
    }
}
