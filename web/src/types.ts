export interface Person {
  id: string;
  givenName: string;
  surname: string;
  sex: 'M' | 'F' | 'U';
  birthDate: string;
  birthPlace: string;
  deathDate: string;
  deathPlace: string;
  burialDate: string;
  burialPlace: string;
  religion: string;
  occupation: string;
  notes: string;
  photoPath: string;
  familiesAsSpouse: string[];
  familiesAsChild: string[];
}

export interface Family {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childrenIds: string[];
  marriageDate: string;
  marriagePlace: string;
}

export function emptyPerson(id: string): Person {
  return {
    id,
    givenName: '',
    surname: '',
    sex: 'U',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    burialDate: '',
    burialPlace: '',
    religion: '',
    occupation: '',
    notes: '',
    photoPath: '',
    familiesAsSpouse: [],
    familiesAsChild: [],
  };
}

export function emptyFamily(id: string): Family {
  return { id, childrenIds: [], marriageDate: '', marriagePlace: '' };
}

const PLACEHOLDERS = new Set(['...', '-----', '.....']);

export function gedClean(s: string): string {
  const t = s.trim();
  return PLACEHOLDERS.has(t) ? '' : t;
}

export function fullName(p: Person): string {
  const parts = [gedClean(p.givenName), gedClean(p.surname)].filter(Boolean);
  return parts.join(' ') || 'Unbekannt';
}

export function initials(p: Person): string {
  const g = gedClean(p.givenName).charAt(0);
  const s = gedClean(p.surname).charAt(0);
  return (g + s) || '?';
}

export function yearIn(s: string): string | null {
  const m = s.match(/\b(\d{4})\b/);
  return m ? m[1] : null;
}

export function shortLife(p: Person): string {
  const b = yearIn(p.birthDate);
  const d = yearIn(p.deathDate);
  if (b && d) return `${b}–${d}`;
  if (b) return `* ${b}`;
  if (d) return `† ${d}`;
  return '';
}
