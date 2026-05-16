import SwiftUI

@main
struct StammbaumApp: App {
    @StateObject private var store = FamilyTreeStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .task { await store.loadBookmarkedFolder() }
        }
    }
}
