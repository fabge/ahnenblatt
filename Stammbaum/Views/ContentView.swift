import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: FamilyTreeStore

    var body: some View {
        if store.isLoaded {
            MainTabView()
        } else {
            WelcomeView()
        }
    }
}
