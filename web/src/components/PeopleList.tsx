import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Page, Navbar, NavTitle, NavTitleLarge, Searchbar, BlockTitle,
  List, ListGroup, ListItem,
} from 'framework7-react';
import { useStore } from '../store';
import { fullName } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';
import { sectionKey, compareForList } from '../lib/peopleSort';

interface Props {
  /** Page name (debug + transition hooks). */
  pageName: string;
  /** Navbar title. */
  title: string;
  /** Unique class on the List for the Searchbar to target. */
  listClass: string;
  /** Render a per-row link (e.g. `/person/${id}/`) or omit to handle taps via onSelect. */
  itemHref?: (p: Person) => string;
  /** Called when a row is tapped. Use either this or itemHref. */
  onSelect?: (p: Person) => void;
  /** Mark a given id as the active row (highlighted). */
  activeId?: string | null;
  /** Optional slot before the searchbar (e.g. extra navbar content). */
  navLeft?: ReactNode;
}

export function PeopleList({
  pageName, title, listClass, itemHref, onSelect, activeId, navLeft,
}: Props) {
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
    <Page name={pageName}>
      <Navbar large>
        {navLeft}
        <NavTitle>{title}</NavTitle>
        <NavTitleLarge>{title}</NavTitleLarge>
      </Navbar>

      <Searchbar
        searchContainer={`.${listClass}`}
        searchIn=".item-title"
        placeholder="Suchen…"
        disableButton={false}
      />

      <BlockTitle>{total} Personen</BlockTitle>

      <List strong mediaList dividers className={listClass}>
        {groups.map(([letter, people]) => (
          <ListGroup key={letter}>
            <ListItem title={letter} groupTitle />
            {people.map((p) => (
              <ListItem
                key={p.id}
                link={itemHref ? itemHref(p) : '#'}
                reloadDetail={!!itemHref}
                onClick={onSelect ? (e: React.MouseEvent) => {
                  e.preventDefault();
                  onSelect(p);
                } : undefined}
                title={fullName(p)}
                selected={p.id === activeId}
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
