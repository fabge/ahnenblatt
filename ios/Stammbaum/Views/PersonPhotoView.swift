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
