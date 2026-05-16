import SwiftUI

struct PeopleListView: View {
    @EnvironmentObject var store: FamilyTreeStore
    @State private var query = ""
    @State private var sexFilter = ""
    @State private var selectedId: String?

    private var filtered: [Person] {
        // Tokenize the query so "geiger fabian" matches a person whose full
        // name contains both tokens regardless of order. Each token must hit
        // somewhere in given+surname combined.
        let tokens = query
            .split(whereSeparator: { $0.isWhitespace })
            .map(String.init)
        return store.persons.values
            .filter { p in
                guard sexFilter.isEmpty || p.sex == sexFilter else { return false }
                guard !tokens.isEmpty else { return true }
                let hay = "\(p.givenName.gedClean) \(p.surname.gedClean)"
                return tokens.allSatisfy { hay.localizedCaseInsensitiveContains($0) }
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
