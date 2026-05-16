import SwiftUI

struct PeopleListView: View {
    @EnvironmentObject var store: FamilyTreeStore
    @State private var query = ""
    @State private var sexFilter = ""

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
            List(filtered) { person in
                PersonRow(person: person)
            }
            .searchable(text: $query, prompt: "Name suchen…")
            .navigationTitle("Personen")
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
        }
    }
}
