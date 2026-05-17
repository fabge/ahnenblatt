import { fullName, gedClean } from '../types';
import type { Person } from '../types';

export function sectionKey(p: Person): string {
  const surname = gedClean(p.surname).trim();
  const candidate = surname || fullName(p);
  const ch = candidate.trim().charAt(0).toUpperCase();
  return /[A-ZÄÖÜ]/.test(ch) ? ch : '#';
}

export function compareForList(a: Person, b: Person): number {
  const ka = sectionKey(a);
  const kb = sectionKey(b);
  if (ka === '#' && kb !== '#') return 1;
  if (kb === '#' && ka !== '#') return -1;
  if (ka !== kb) return ka.localeCompare(kb, 'de');
  return fullName(a).localeCompare(fullName(b), 'de');
}
