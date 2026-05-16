import SwiftUI

/// Async image loaded from the security-scoped folder URL.
struct PersonPhotoView: View {
    let person: Person
    let size: CGFloat
    @EnvironmentObject var store: FamilyTreeStore
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
                    .frame(width: size, height: size)
                    .clipShape(Circle())
            } else {
                Circle()
                    .fill(avatarColor)
                    .frame(width: size, height: size)
                    .overlay {
                        Text(person.initials)
                            .font(.system(size: size * 0.35, weight: .bold))
                            .foregroundStyle(.white)
                    }
            }
        }
        .task(id: person.id) { await loadImage() }
    }

    private var avatarColor: Color {
        switch person.sex {
        case "M": return .blue
        case "F": return .pink
        default:  return .gray
        }
    }

    private func loadImage() async {
        guard let url = store.imageURL(for: person) else { return }
        let folderURL = store.folderURL
        let accessed = folderURL?.startAccessingSecurityScopedResource() ?? false
        defer { if accessed { folderURL?.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url),
              let img = UIImage(data: data) else { return }
        await MainActor.run { image = img }
    }
}

/// Fullscreen, pinch-zoomable image view for a person's photo.
struct PhotoFullscreenView: View {
    let person: Person
    @EnvironmentObject var store: FamilyTreeStore
    @Environment(\.dismiss) private var dismiss
    @State private var image: UIImage?
    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFit()
                    .scaleEffect(scale)
                    .gesture(
                        MagnifyGesture()
                            .onChanged { v in
                                scale = min(max(lastScale * v.magnification, 1), 6)
                            }
                            .onEnded { _ in lastScale = scale }
                    )
                    .onTapGesture(count: 2) {
                        withAnimation { scale = scale > 1 ? 1 : 2 }
                        lastScale = scale
                    }
            } else {
                ProgressView().tint(.white)
            }

            VStack {
                HStack {
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 30))
                            .foregroundStyle(.white.opacity(0.85), .black.opacity(0.4))
                    }
                    .padding()
                }
                Spacer()
            }
        }
        .task {
            guard let url = store.imageURL(for: person) else { return }
            let folderURL = store.folderURL
            let accessed = folderURL?.startAccessingSecurityScopedResource() ?? false
            defer { if accessed { folderURL?.stopAccessingSecurityScopedResource() } }
            if let data = try? Data(contentsOf: url),
               let img = UIImage(data: data) {
                await MainActor.run { image = img }
            }
        }
    }
}
