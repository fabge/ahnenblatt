import { useMemo, useState } from 'react';
import { Page, Navbar, Searchbar, List, ListGroup, ListItem, BlockTitle } from 'konsta/react';
import { useStore } from '../store';
import { fullName, shortLife, gedClean } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';
import { PersonDetailView } from './PersonDetailView';

function sectionKey(p: Person): string {
  const surname = gedClean(p.surname).trim();
  const candidate = surname || fullName(p);
  const ch = candidate.trim().charAt(0).toUpperCase();
  return /[A-ZÄÖÜ]/.test(ch) ? ch : '#';
}

function compareForList(a: Person, b: Person): number {
  const ka = sectionKey(a);
  const kb = sectionKey(b);
  // '#' bucket always at the end
  if (ka === '#' && kb !== '#') return 1;
  if (kb === '#' && ka !== '#') return -1;
  if (ka !== kb) return ka.localeCompare(kb, 'de');
  return fullName(a).localeCompare(fullName(b), 'de');
}

export function PeopleListView() {
  const { persons } = useStore();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    <Page className="pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <Navbar
        title="Personen"
        large
        transparent
        subnavbar={
          <Searchbar
            value={query}
            onInput={(e: React.FormEvent<HTMLInputElement>) => setQuery(e.currentTarget.value)}
            onClear={() => setQuery('')}
            disableButton
            placeholder="Suchen…"
          />
        }
      />
      <BlockTitle>{filtered.length} Personen</BlockTitle>
      <List strongIos insetIos>
        {groups.map(([letter, people]) => (
          <ListGroup key={letter}>
            <ListItem title={letter} groupTitle />
            {people.map((p) => (
              <ListItem
                key={p.id}
                link
                chevron={false}
                onClick={() => setSelectedId(p.id)}
                title={fullName(p)}
                after={shortLife(p)}
                media={<PersonPhoto person={p} size={44} />}
              />
            ))}
          </ListGroup>
        ))}
      </List>
      {selectedId && (
        <PersonDetailView personId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Page>
  );
}
