import { emptyPerson, emptyFamily } from './types';
import type { Person, Family } from './types';

interface Line {
  level: number;
  xref: string;
  tag: string;
  value: string;
}

function normalizeFilePath(raw: string): string {
  let p = raw.replace(/\\/g, '/');
  if (p.startsWith('./')) p = p.slice(2);
  return p;
}

function decode(buf: ArrayBuffer): string {
  // Try UTF-8 first; fall back to Latin1 if it produces replacement chars.
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (!utf8.includes('�')) return utf8;
  return new TextDecoder('iso-8859-1').decode(buf);
}

export async function parseGedcom(file: File): Promise<{
  persons: Record<string, Person>;
  families: Record<string, Family>;
}> {
  const buf = await file.arrayBuffer();
  const text = decode(buf);

  const lines: Line[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const s = rawLine.trim();
    if (!s) continue;
    const parts = s.split(' ');
    const level = parseInt(parts.shift() ?? '', 10);
    if (Number.isNaN(level)) continue;
    let xref = '';
    if (parts[0]?.startsWith('@') && parts[0]?.endsWith('@')) {
      xref = parts.shift() ?? '';
    }
    const tag = parts.shift() ?? '';
    const value = parts.join(' ');
    lines.push({ level, xref, tag, value });
  }

  const persons: Record<string, Person> = {};
  const families: Record<string, Family> = {};
  let curPerson: Person | null = null;
  let curFamily: Family | null = null;
  let tagStack: string[] = [];

  const flush = () => {
    if (curPerson) persons[curPerson.id] = curPerson;
    if (curFamily) families[curFamily.id] = curFamily;
    curPerson = null;
    curFamily = null;
  };

  for (const line of lines) {
    if (tagStack.length > line.level) tagStack = tagStack.slice(0, line.level);
    tagStack.push(line.tag);
    const parentTag = line.level > 0 ? tagStack[line.level - 1] : '';

    if (line.level === 0) {
      flush();
      tagStack = [line.tag];
      if (line.tag === 'INDI') curPerson = emptyPerson(line.xref);
      else if (line.tag === 'FAM') curFamily = emptyFamily(line.xref);
      continue;
    }

    if (curPerson) {
      const p = curPerson;
      const key = `${line.level}|${parentTag}|${line.tag}`;
      switch (key) {
        case `1||NAME`:
        case `1|INDI|NAME`: {
          const v = line.value;
          if (v.includes('/')) {
            const pieces = v.split('/');
            p.givenName = pieces[0].trim();
            if (pieces.length > 1) p.surname = pieces[1].trim();
          } else {
            const words = v.split(' ').filter(Boolean);
            if (words.length > 1) {
              p.surname = words[words.length - 1];
              p.givenName = words.slice(0, -1).join(' ');
            } else {
              p.givenName = v;
            }
          }
          break;
        }
        case `2|NAME|GIVN`: p.givenName = line.value; break;
        case `2|NAME|SURN`: p.surname = line.value; break;
        case `1|INDI|SEX`:
        case `1||SEX`: {
          const v = line.value.trim().toUpperCase();
          p.sex = v === 'M' || v === 'F' ? v : 'U';
          break;
        }
        case `1|INDI|FAMS`:
        case `1||FAMS`: p.familiesAsSpouse.push(line.value); break;
        case `1|INDI|FAMC`:
        case `1||FAMC`: p.familiesAsChild.push(line.value); break;
        case `2|BIRT|DATE`: p.birthDate = line.value; break;
        case `2|BIRT|PLAC`: p.birthPlace = line.value; break;
        case `2|DEAT|DATE`: p.deathDate = line.value; break;
        case `2|DEAT|PLAC`: p.deathPlace = line.value; break;
        case `2|BURI|DATE`: p.burialDate = line.value; break;
        case `2|BURI|PLAC`: p.burialPlace = line.value; break;
        case `1|INDI|RELI`:
        case `1||RELI`: p.religion = line.value; break;
        case `1|INDI|OCCU`:
        case `1||OCCU`:
        case `1|INDI|_OCCU`:
        case `1||_OCCU`: p.occupation = line.value; break;
        case `1|INDI|NOTE`:
        case `1||NOTE`: p.notes = line.value; break;
        case `2|OBJE|FILE`:
          if (!p.photoPath) p.photoPath = normalizeFilePath(line.value);
          break;
        case `3|FILE|FILE`:
          if (!p.photoPath) p.photoPath = normalizeFilePath(line.value);
          break;
        default:
          if (line.level === 2 && line.tag === 'NOTE') {
            if (p.notes) p.notes += '\n';
            p.notes += line.value;
          }
          break;
      }
    }

    if (curFamily) {
      const f = curFamily;
      switch (`${line.level}|${line.tag}`) {
        case `1|HUSB`: f.husbandId = line.value; break;
        case `1|WIFE`: f.wifeId = line.value; break;
        case `1|CHIL`: f.childrenIds.push(line.value); break;
      }
      if (line.level === 2 && parentTag === 'MARR') {
        if (line.tag === 'DATE') f.marriageDate = line.value;
        if (line.tag === 'PLAC') f.marriagePlace = line.value;
      }
    }
  }
  flush();

  return { persons, families };
}
