import type { Person, Family } from '../types';

/** Walk up FAMC chains to find the most ancestral person; prefer male. */
export function mostAncestralPerson(
  persons: Record<string, Person>,
  families: Record<string, Family>
): string | null {
  const ids = Object.keys(persons);
  if (ids.length === 0) return null;

  // Pick a root ancestor (no parents in any family), preferring male, with deepest descendant tree.
  const roots = ids.filter((id) => persons[id].familiesAsChild.length === 0);
  if (roots.length === 0) return ids[0];
  const males = roots.filter((id) => persons[id].sex === 'M');
  // Prefer the one with the deepest descendant tree.
  const candidates = males.length > 0 ? males : roots;

  function depthDown(id: string, seen = new Set<string>()): number {
    if (seen.has(id)) return 0;
    seen.add(id);
    const p = persons[id];
    if (!p) return 0;
    let best = 0;
    for (const famId of p.familiesAsSpouse) {
      const f = families[famId];
      if (!f) continue;
      for (const child of f.childrenIds) {
        if (persons[child]) best = Math.max(best, 1 + depthDown(child, seen));
      }
    }
    return best;
  }

  let bestId = candidates[0];
  let bestDepth = -1;
  for (const id of candidates) {
    const d = depthDown(id);
    if (d > bestDepth) {
      bestDepth = d;
      bestId = id;
    }
  }
  return bestId;
}
