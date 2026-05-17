import { useMemo, useState } from 'react';
import { Searchbar, List, ListGroup, ListItem } from 'konsta/react';
import { useStore } from '../store';
import { fullName, shortLife, gedClean } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';

function sectionKey(p: Person): string {
  const surname = gedClean(p.surname).trim();
  const candidate = surname || fullName(p);
  const ch = candidate.trim().charAt(0).toUpperCase();
  return /[A-ZÄÖÜ]/.test(ch) ? ch : '#';
}

function compareForList(a: Person, b: Person): number {
  const ka = sectionKey(a);
  const kb = sectionKey(b);
  if (ka === '#' && kb !== '#') return 1;
  if (kb === '#' && ka !== '#') return -1;
  if (ka !== kb) return ka.localeCompare(kb, 'de');
  return fullName(a).localeCompare(fullName(b), 'de');
}

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
}

/** Left-hand person list used by both the Personen tab (iPad) and the
 *  Stammbaum tab (iPad). Read-only, no add button. */
export function PeopleSidebar({ activeId, onSelect }: Props) {
  const { persons } = useStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const all = Object.values(persons);
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matched = tokens.length === 0
      ? all
      : all.filter((p) => {
          const hay = (fullName(p) + ' ' + p.birthDate + ' ' + p.deathDate).toLowerCase();
          return tokens.every((t) => hay.includes(t));
        });
    return matched.sort(compareForList);
  }, [persons, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const p of filtered) {
      const k = sectionKey(p);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <aside className="w-[340px] shrink-0 border-r border-black/10 dark:border-white/10 flex flex-col bg-ios-light-surface dark:bg-ios-dark-surface">
      <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] pb-2">
        <h1 className="text-[28px] font-bold tracking-tight">Personen</h1>
        <div className="text-[13px] text-black/55 dark:text-white/55 mt-0.5">
          {filtered.length} {filtered.length === 1 ? 'Eintrag' : 'Einträge'}
        </div>
      </div>
      <div className="px-2 pb-1">
        <Searchbar
          value={query}
          onInput={(e: React.FormEvent<HTMLInputElement>) => setQuery(e.currentTarget.value)}
          onClear={() => setQuery('')}
          disableButton={false}
          placeholder="Suchen…"
        />
      </div>
      <div className="flex-1 overflow-auto pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <List strongIos insetIos>
          {groups.map(([letter, people]) => (
            <ListGroup key={letter}>
              <ListItem title={letter} groupTitle />
              {people.map((p) => {
                const active = p.id === activeId;
                return (
                  <ListItem
                    key={p.id}
                    link
                    chevron={false}
                    onClick={() => onSelect(p.id)}
                    title={
                      <span className={active ? 'text-white' : ''}>{fullName(p)}</span>
                    }
                    after={
                      <span className={active ? 'text-white/80' : ''}>{shortLife(p)}</span>
                    }
                    media={<PersonPhoto person={p} size={40} />}
                    className={active ? 'bg-[#8b6a45]' : ''}
                  />
                );
              })}
            </ListGroup>
          ))}
        </List>
      </div>
    </aside>
  );
}
