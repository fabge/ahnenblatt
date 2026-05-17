import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Page, Navbar, NavLeft, NavTitle, NavRight, Link, Icon,
  Block, BlockTitle, List, ListItem, f7,
} from 'framework7-react';
import { useStore } from '../store';
import { fullName, shortLife } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';
import { PhotoFullscreen } from './PhotoFullscreen';

interface F7Router {
  navigate: (url: string, opts?: Record<string, unknown>) => void;
  back: (url?: string, opts?: Record<string, unknown>) => void;
}

interface Props {
  personId: string;
  /** Tap handler for relation rows. If omitted, the row pushes /person/:id via Link's href. */
  onSelectRelation?: (id: string) => void;
  /** Optional left-slot element (e.g. close button when shown inside a sheet). */
  navLeft?: ReactNode;
  /** Called after "Als Wurzel" — e.g. close the containing sheet. */
  afterOpenInTree?: () => void;
  /** Router from F7 route component, used to close the detail view. */
  f7router?: F7Router;
}

export function PersonDetailContent({
  personId, onSelectRelation, navLeft, afterOpenInTree, f7router,
}: Props) {
  const { persons, families, setRootPerson, getPhotoUrl } = useStore();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  const person = persons[personId];

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(person?.photoPath ?? '').then((u) => { if (!cancelled) setHasPhoto(!!u); });
    return () => { cancelled = true; };
  }, [person?.photoPath, getPhotoUrl]);

  if (!person) return null;

  const parents: Person[] = [];
  for (const famId of person.familiesAsChild) {
    const f = families[famId];
    if (!f) continue;
    if (f.husbandId && persons[f.husbandId]) parents.push(persons[f.husbandId]);
    if (f.wifeId && persons[f.wifeId]) parents.push(persons[f.wifeId]);
  }

  const spouses: Person[] = [];
  const children: Person[] = [];
  for (const famId of person.familiesAsSpouse) {
    const f = families[famId];
    if (!f) continue;
    for (const sid of [f.husbandId, f.wifeId]) {
      if (sid && sid !== personId && persons[sid]) spouses.push(persons[sid]);
    }
    for (const cid of f.childrenIds) {
      if (persons[cid]) children.push(persons[cid]);
    }
  }

  const handleOpenInTree = () => {
    setRootPerson(personId);
    f7.tab.show('#view-tree');
    const treeRouter = f7.views.get('#view-tree')?.router;
    treeRouter?.navigate('/tree/');
    afterOpenInTree?.();
  };

  const handleClose = () => {
    if (f7router) f7router.back('/');
  };

  return (
    <Page>
      <Navbar>
        <NavLeft>
          {navLeft ?? (
            <Link onClick={handleClose} iconOnly aria-label="Schließen">
              <Icon f7="multiply" size={22} />
            </Link>
          )}
        </NavLeft>
        <NavTitle>{fullName(person)}</NavTitle>
        <NavRight>
          <Link onClick={handleOpenInTree} iconOnly aria-label="Als Wurzel">
            <Icon f7="square_stack_3d_up_fill" size={22} />
          </Link>
        </NavRight>
      </Navbar>

      <Block strong inset className="flex flex-col items-center text-center !pt-6">
        <PersonPhoto
          person={person}
          size={120}
          onClick={hasPhoto ? () => setPhotoOpen(true) : undefined}
        />
        <div className="mt-3 text-xl font-semibold">{fullName(person)}</div>
        {shortLife(person) && (
          <div className="text-sm opacity-60 mt-1">{shortLife(person)}</div>
        )}
      </Block>

      <FactsSection title="Geburt" rows={[['Datum', person.birthDate], ['Ort', person.birthPlace]]} />
      <FactsSection title="Tod" rows={[['Datum', person.deathDate], ['Ort', person.deathPlace]]} />
      <FactsSection title="Bestattung" rows={[['Datum', person.burialDate], ['Ort', person.burialPlace]]} />
      <FactsSection title="Weitere" rows={[['Beruf', person.occupation], ['Religion', person.religion]]} />

      {person.notes && (
        <>
          <BlockTitle>Notizen</BlockTitle>
          <Block strong inset>
            <p className="whitespace-pre-wrap leading-relaxed">{person.notes}</p>
          </Block>
        </>
      )}

      <PeopleSection title="Eltern" people={parents} onTap={onSelectRelation} />
      <PeopleSection
        title={spouses.length > 1 ? 'Partner' : 'Partner/in'}
        people={spouses}
        onTap={onSelectRelation}
      />
      <PeopleSection title="Kinder" people={children} onTap={onSelectRelation} />

      <Block />

      {photoOpen && person.photoPath && (
        <PhotoFullscreen photoPath={person.photoPath} onClose={() => setPhotoOpen(false)} />
      )}
    </Page>
  );
}

function FactsSection({ title, rows }: { title: string; rows: [string, string][] }) {
  const visible = rows.filter(([, v]) => v && v.trim());
  if (visible.length === 0) return null;
  return (
    <>
      <BlockTitle>{title}</BlockTitle>
      <List strong inset>
        {visible.map(([k, v]) => <ListItem key={k} title={k} after={v} />)}
      </List>
    </>
  );
}

function PeopleSection({
  title, people, onTap,
}: { title: string; people: Person[]; onTap?: (id: string) => void }) {
  if (people.length === 0) return null;
  return (
    <>
      <BlockTitle>{title}</BlockTitle>
      <List strong inset mediaList>
        {people.map((p) => (
          <ListItem
            key={p.id}
            link={onTap ? '#' : `/person/${p.id}/`}
            reloadDetail={!onTap}
            onClick={onTap ? (e: React.MouseEvent) => { e.preventDefault(); onTap(p.id); } : undefined}
            title={fullName(p)}
            after={shortLife(p)}
          >
            <PersonPhoto slot="media" person={p} size={36} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
