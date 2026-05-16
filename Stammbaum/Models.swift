import Foundation

// MARK: - Person

struct Person: Identifiable, Hashable {
    let id: String
    var givenName: String = ""
    var surname: String = ""
    var sex: String = "U"   // M | F | U
    var birthDate: String = ""
    var birthPlace: String = ""
    var deathDate: String = ""
    var deathPlace: String = ""
    var burialDate: String = ""
    var burialPlace: String = ""
    var religion: String = ""
    var occupation: String = ""
    var notes: String = ""
    var photoPath: String = ""      // relative path stored in GEDCOM FILE tag
    var familiesAsSpouse: [String] = []
    var familiesAsChild: [String] = []

    var fullName: String {
        [givenName.gedClean, surname.gedClean]
            .filter { !$0.isEmpty }.joined(separator: " ")
            .nonEmpty ?? "Unbekannt"
    }

    var initials: String {
        let g = givenName.gedClean.first.map(String.init) ?? ""
        let s = surname.gedClean.first.map(String.init) ?? ""
        return (g + s).nonEmpty ?? "?"
    }

    var birthYear: String? { yearIn(birthDate) }
    var deathYear: String? { yearIn(deathDate) }

    var shortLife: String {
        switch (birthYear, deathYear) {
        case let (b?, d?): return "\(b)–\(d)"
        case let (b?, nil): return "* \(b)"
        case let (nil, d?): return "† \(d)"
        default: return ""
        }
    }

    static func == (lhs: Person, rhs: Person) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

// MARK: - Family

struct Family: Identifiable {
    let id: String
    var husbandId: String?
    var wifeId: String?
    var childrenIds: [String] = []
    var marriageDate: String = ""
    var marriagePlace: String = ""
}

// MARK: - Helpers

private func yearIn(_ s: String) -> String? {
    guard !s.isEmpty,
          let regex = try? NSRegularExpression(pattern: #"\b(\d{4})\b"#),
          let m = regex.firstMatch(in: s, range: NSRange(s.startIndex..., in: s)),
          let r = Range(m.range(at: 1), in: s) else { return nil }
    return String(s[r])
}

extension String {
    /// Strip GEDCOM placeholder values used when real data is unknown.
    var gedClean: String {
        let placeholders: Set<String> = ["...", "-----", "....."]
        let t = trimmingCharacters(in: .whitespaces)
        return placeholders.contains(t) ? "" : t
    }
    var nonEmpty: String? { isEmpty ? nil : self }
}
