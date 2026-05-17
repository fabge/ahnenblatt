import { useMemo, useState } from 'react';
import { Page, Navbar, Searchbar, List, ListItem, BlockTitle } from 'konsta/react';
import { useStore } from '../store';
import { fullName, shortLife } from '../types';
import { PersonPhoto } from './PersonPhoto';
import { PersonDetailView } from './PersonDetailView';

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
    return matched.sort((a, b) => fullName(a).localeCompare(fullName(b), 'de'));
  }, [persons, query]);

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
        {filtered.map((p) => (
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
      </List>
      {selectedId && (
        <PersonDetailView personId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Page>
  );
}
