import Foundation

enum GEDCOMParser {

    static func parse(gedURL: URL) -> (persons: [String: Person], families: [String: Family]) {
        guard let raw = try? Data(contentsOf: gedURL),
              let text = String(data: raw, encoding: .utf8)
                      ?? String(data: raw, encoding: .isoLatin1) else {
            return ([:], [:])
        }

        var persons: [String: Person] = [:]
        var families: [String: Family] = [:]

        struct Line {
            let level: Int
            let xref: String   // e.g. "@I1@" or ""
            let tag: String
            let value: String  // everything after tag
        }

        // Parse all lines first
        var lines: [Line] = []
        for rawLine in text.components(separatedBy: .newlines) {
            let s = rawLine.trimmingCharacters(in: .whitespaces)
            guard !s.isEmpty else { continue }
            var parts = s.components(separatedBy: " ")
            guard let lvlStr = parts.first, let level = Int(lvlStr) else { continue }
            parts.removeFirst()

            var xref = ""
            if let first = parts.first, first.hasPrefix("@"), first.hasSuffix("@") {
                xref = first; parts.removeFirst()
            }
            let tag = parts.first ?? ""; if !parts.isEmpty { parts.removeFirst() }
            let value = parts.joined(separator: " ")
            lines.append(Line(level: level, xref: xref, tag: tag, value: value))
        }

        // State machine
        var currentPerson: Person?
        var currentFamily: Family?
        // Track the current tag path by level (index = level)
        var tagStack: [String] = []

        func flush() {
            if let p = currentPerson { persons[p.id] = p }
            if let f = currentFamily { families[f.id] = f }
            currentPerson = nil
            currentFamily = nil
        }

        for line in lines {
            // Maintain tag stack (trim to current level, then push)
            if tagStack.count > line.level {
                tagStack = Array(tagStack.prefix(line.level))
            }
            tagStack.append(line.tag)

            let parentTag = line.level > 0 ? tagStack[line.level - 1] : ""

            // Level 0: new record
            if line.level == 0 {
                flush()
                tagStack = [line.tag]
                if line.tag == "INDI" {
                    currentPerson = Person(id: line.xref)
                } else if line.tag == "FAM" {
                    currentFamily = Family(id: line.xref)
                }
                continue
            }

            // ── Individual fields ─────────────────────────────────────────
            if var p = currentPerson {
                switch (line.level, parentTag, line.tag) {
                // Name
                case (1, _, "NAME"):
                    // "First /Surname/ suffix" — extract parts
                    let v = line.value
                    if v.contains("/") {
                        let pieces = v.components(separatedBy: "/")
                        p.givenName = pieces[0].trimmingCharacters(in: .whitespaces)
                        if pieces.count > 1 { p.surname = pieces[1].trimmingCharacters(in: .whitespaces) }
                    } else {
                        // Plain name: last word = surname, rest = given
                        let words = v.components(separatedBy: " ").filter { !$0.isEmpty }
                        if words.count > 1 {
                            p.surname = words.last ?? ""
                            p.givenName = words.dropLast().joined(separator: " ")
                        } else {
                            p.givenName = v
                        }
                    }
                case (2, "NAME", "GIVN"): p.givenName = line.value
                case (2, "NAME", "SURN"): p.surname = line.value
                // Sex
                case (1, _, "SEX"): p.sex = line.value
                // Family links
                case (1, _, "FAMS"): p.familiesAsSpouse.append(line.value)
                case (1, _, "FAMC"): p.familiesAsChild.append(line.value)
                // Birth
                case (2, "BIRT", "DATE"): p.birthDate = line.value
                case (2, "BIRT", "PLAC"): p.birthPlace = line.value
                // Death
                case (2, "DEAT", "DATE"): p.deathDate = line.value
                case (2, "DEAT", "PLAC"): p.deathPlace = line.value
                // Burial
                case (2, "BURI", "DATE"): p.burialDate = line.value
                case (2, "BURI", "PLAC"): p.burialPlace = line.value
                // Other
                case (1, _, "RELI"): p.religion = line.value
                case (1, _, "OCCU"), (1, _, "_OCCU"): p.occupation = line.value
                case (1, _, "NOTE"): p.notes = line.value
                case (2, _, "NOTE"): if !p.notes.isEmpty { p.notes += "\n" }; p.notes += line.value
                // Photo: FILE tag under OBJE
                case (2, "OBJE", "FILE"):
                    if p.photoPath.isEmpty { p.photoPath = normalizeFilePath(line.value) }
                case (3, "FILE", "FILE"):   // sometimes nested differently
                    if p.photoPath.isEmpty { p.photoPath = normalizeFilePath(line.value) }
                default: break
                }
                currentPerson = p
            }

            // ── Family fields ─────────────────────────────────────────────
            if var f = currentFamily {
                switch (line.level, parentTag, line.tag) {
                case (1, _, "HUSB"): f.husbandId = line.value
                case (1, _, "WIFE"): f.wifeId = line.value
                case (1, _, "CHIL"): f.childrenIds.append(line.value)
                case (2, "MARR", "DATE"): f.marriageDate = line.value
                case (2, "MARR", "PLAC"): f.marriagePlace = line.value
                default: break
                }
                currentFamily = f
            }
        }
        flush()

        return (persons, families)
    }

    /// Convert Windows-style relative paths to forward-slash paths.
    private static func normalizeFilePath(_ raw: String) -> String {
        var p = raw.replacingOccurrences(of: "\\", with: "/")
        if p.hasPrefix("./") { p = String(p.dropFirst(2)) }
        if p.hasPrefix(".\\") { p = String(p.dropFirst(2)) }
        return p
    }
}
