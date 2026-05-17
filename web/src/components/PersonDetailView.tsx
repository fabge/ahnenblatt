import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Sheet,
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Link,
} from 'konsta/react';
import { X, GitBranch } from 'lucide-react';
import { useStore } from '../store';
import { fullName, shortLife } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';
import { PhotoFullscreen } from './PhotoFullscreen';

interface ContentProps {
  personId: string;
  onSelectRelation: (id: string) => void;
  leftAction?: ReactNode;
  onOpenInTree?: () => void;
}

/** The body of a person view — Navbar + photo header + facts + relations.
 *  Reused both inside a Sheet (mobile) and inline as a pane (iPad split). */
export function PersonDetailContent({
  personId,
  onSelectRelation,
  leftAction,
  onOpenInTree,
}: ContentProps) {
  const { persons, families, setRootPerson, setSelectedTab, getPhotoUrl } = useStore();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  const person = persons[personId];

  useEffect(() => {
    let cancelled = false;
    if (person?.photoPath) {
      getPhotoUrl(person.photoPath).then((u) => { if (!cancelled) setHasPhoto(!!u); });
    } else {
      setHasPhoto(false);
    }
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
    setSelectedTab(0);
    onOpenInTree?.();
  };

  return (
    <Page>
      <Navbar
        title={fullName(person)}
        left={leftAction}
        right={
          <Link onClick={handleOpenInTree} aria-label="Als Wurzel" iconOnly>
            <GitBranch size={22} strokeWidth={1.8} />
          </Link>
        }
      />

      <Block strong inset className="flex flex-col items-center text-center pt-6">
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

      <FactsSection
        title="Geburt"
        rows={[['Datum', person.birthDate], ['Ort', person.birthPlace]]}
      />
      <FactsSection
        title="Tod"
        rows={[['Datum', person.deathDate], ['Ort', person.deathPlace]]}
      />
      <FactsSection
        title="Bestattung"
        rows={[['Datum', person.burialDate], ['Ort', person.burialPlace]]}
      />
      <FactsSection
        title="Weitere"
        rows={[['Beruf', person.occupation], ['Religion', person.religion]]}
      />

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

/** Mobile / TreeView entry point: presents the content as an iOS-style sheet. */
export function PersonDetailView({
  personId,
  onClose,
}: {
  personId: string;
  onClose: () => void;
}) {
  const [opened, setOpened] = useState(true);
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const close = () => setOpened(false);

  return (
    <Sheet
      opened={opened}
      onBackdropClick={close}
      className="
        h-[calc(100%-env(safe-area-inset-top)-12px)]
        shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)]
      "
      onTransitionEnd={(e: React.TransitionEvent<HTMLElement>) => {
        if (!opened && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        aria-hidden
        className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-black/20 dark:bg-white/25 z-10 pointer-events-none"
      />
      <PersonDetailContent
        personId={personId}
        onSelectRelation={setDrilldown}
        leftAction={
          <Link onClick={close} aria-label="Schließen" iconOnly>
            <X size={22} strokeWidth={2.2} />
          </Link>
        }
        onOpenInTree={close}
      />

      {drilldown && (
        <PersonDetailView personId={drilldown} onClose={() => setDrilldown(null)} />
      )}
    </Sheet>
  );
}

function FactsSection({ title, rows }: { title: string; rows: [string, string][] }) {
  const visible = rows.filter(([, v]) => v && v.trim());
  if (visible.length === 0) return null;
  return (
    <>
      <BlockTitle>{title}</BlockTitle>
      <List strongIos insetIos>
        {visible.map(([k, v]) => (
          <ListItem key={k} title={k} after={v} />
        ))}
      </List>
    </>
  );
}

function PeopleSection({
  title,
  people,
  onTap,
}: {
  title: string;
  people: Person[];
  onTap: (id: string) => void;
}) {
  if (people.length === 0) return null;
  return (
    <>
      <BlockTitle>{title}</BlockTitle>
      <List strongIos insetIos>
        {people.map((p) => (
          <ListItem
            key={p.id}
            link
            chevron
            onClick={() => onTap(p.id)}
            title={fullName(p)}
            after={shortLife(p)}
            media={<PersonPhoto person={p} size={36} />}
          />
        ))}
      </List>
    </>
  );
}
