import { useMemo } from 'react';
import {
  Page, Navbar, NavTitle, Searchbar,
  List, ListGroup, ListItem, BlockTitle,
} from 'framework7-react';
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

export function PeopleListPage() {
  const { persons } = useStore();

  const groups = useMemo(() => {
    const sorted = Object.values(persons).sort(compareForList);
    const map = new Map<string, Person[]>();
    for (const p of sorted) {
      const k = sectionKey(p);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return Array.from(map.entries());
  }, [persons]);

  const total = Object.keys(persons).length;

  return (
    <Page name="people">
      <Navbar>
        <NavTitle>Personen</NavTitle>
      </Navbar>

      <Searchbar
        searchContainer=".people-list"
        searchIn=".item-title, .item-after"
        placeholder="Suchen…"
        disableButton={false}
      />

      <BlockTitle>{total} Personen</BlockTitle>

      <List strong inset mediaList className="people-list">
        {groups.map(([letter, people]) => (
          <ListGroup key={letter}>
            <ListItem title={letter} groupTitle />
            {people.map((p) => (
              <ListItem
                key={p.id}
                link={`/person/${p.id}/`}
                reloadDetail
                title={fullName(p)}
                after={shortLife(p)}
              >
                <PersonPhoto slot="media" person={p} size={44} />
              </ListItem>
            ))}
          </ListGroup>
        ))}
      </List>
    </Page>
  );
}
