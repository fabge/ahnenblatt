import SwiftUI
import UniformTypeIdentifiers

struct WelcomeView: View {
    @EnvironmentObject var store: FamilyTreeStore
    @State private var showPicker = false
    @State private var isLoading = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "tree.fill")
                .font(.system(size: 80))
                .foregroundStyle(.green.gradient)

            VStack(spacing: 8) {
                Text("Stammbaum Viewer")
                    .font(.largeTitle.bold())
                Text("Wähle den Ordner mit deiner GEDCOM-Datei\n(inkl. der Foto-Unterordner)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            // Only surface a load error after an active pick attempt
            // (folderURL set). On a fresh state we stay silent.
            if let error = store.loadError, store.folderURL != nil {
                Text(error)
                    .font(.callout)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            Button {
                showPicker = true
            } label: {
                Label("Ordner öffnen", systemImage: "folder.badge.plus")
                    .font(.headline)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 14)
                    .background(.blue)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
            }
            .disabled(isLoading)

            if isLoading {
                ProgressView("Lade Stammbaum…")
            }

            Spacer()

            Text("Tipp: Verbinde deine Synology NAS in der Dateien-App\n(Netzwerk → SMB), dann erscheint sie hier im Ordner-Browser.")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
                .padding()
        }
        .padding()
        .fileImporter(
            isPresented: $showPicker,
            allowedContentTypes: [.folder],
            allowsMultipleSelection: false
        ) { result in
            guard case .success(let urls) = result, let url = urls.first else { return }
            isLoading = true
            store.saveBookmark(for: url)
            Task {
                await store.load(from: url)
                isLoading = false
            }
        }
    }
}
