import { useMemo } from 'react';
import {
  Page, Navbar, NavTitle, Searchbar, BlockTitle,
  List, ListGroup, ListItem,
} from 'framework7-react';
import { useStore } from '../store';
import { fullName } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';
import { sectionKey, compareForList } from '../lib/peopleSort';

interface F7Router {
  navigate: (url: string, opts?: Record<string, unknown>) => void;
}

export function PeoplePickerPage({ f7router }: { f7router?: F7Router }) {
  const { persons, rootPersonId, setRootPerson } = useStore();

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

  const handleSelect = (id: string) => {
    setRootPerson(id);
    f7router?.navigate('/tree/');
  };

  return (
    <Page name="people-picker">
      <Navbar>
        <NavTitle>Personen</NavTitle>
      </Navbar>

      <Searchbar
        searchContainer=".picker-list"
        searchIn=".item-title"
        placeholder="Suchen…"
        disableButton={false}
      />

      <BlockTitle>{total} Personen</BlockTitle>

      <List strong mediaList className="picker-list">
        {groups.map(([letter, people]) => (
          <ListGroup key={letter}>
            <ListItem title={letter} groupTitle />
            {people.map((p) => (
              <ListItem
                key={p.id}
                link="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); handleSelect(p.id); }}
                title={fullName(p)}
                className={p.id === rootPersonId ? 'picker-active' : ''}
              >
                <PersonPhoto slot="media" person={p} size={40} />
              </ListItem>
            ))}
          </ListGroup>
        ))}
      </List>
    </Page>
  );
}
