import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Page,
  Navbar,
  Block,
  Popover,
  List,
  ListItem,
  Link,
} from 'konsta/react';

function PopoverSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[12px] uppercase tracking-wider text-black/45 dark:text-white/45 font-medium">
      {children}
    </div>
  );
}
import { Check, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useStore } from '../store';
import type { TreeMode, GenerationsPref } from '../store';
import { ancestorLayout, descendantLayout, invertLayoutY } from '../layout';
import { TreeCanvas } from './TreeCanvas';
import { PersonDetailView } from './PersonDetailView';

const GEN_OPTIONS: GenerationsPref[] = [1, 2, 3, 4, 5, 6, 7, 'all'];
const GEN_LIMIT = 100;

export function TreeView() {
  const { rootPersonId, persons, families, prefs } = useStore();
  const [mode, setMode] = useState<TreeMode>(prefs.defaultMode);
  const [generations, setGenerations] = useState<GenerationsPref>(prefs.defaultGenerations);
  const [inverted, setInverted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTargetRef = useRef<HTMLAnchorElement>(null);

  const layout = useMemo(() => {
    if (!rootPersonId || !persons[rootPersonId]) return null;
    const genLimit = generations === 'all' ? GEN_LIMIT : generations;
    const base = mode === 'Vorfahren'
      ? ancestorLayout(persons, families, rootPersonId, genLimit)
      : descendantLayout(persons, families, rootPersonId, genLimit);
    return inverted ? invertLayoutY(base) : base;
  }, [persons, families, rootPersonId, mode, generations, inverted]);

  const menuButton = (
    <Link
      ref={menuTargetRef}
      onClick={() => setMenuOpen(true)}
      aria-label="Optionen"
      iconOnly
    >
      <SlidersHorizontal size={22} strokeWidth={2} />
    </Link>
  );

  if (!rootPersonId || !persons[rootPersonId]) {
    return (
      <Page>
        <Navbar title="Stammbaum" large transparent />
        <Block strong inset className="text-center">
          <p className="opacity-60 text-sm">
            Keine Wurzelperson gewählt. Öffne eine Person in der Personenliste und tippe „Als
            Wurzel“.
          </p>
        </Block>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title="Stammbaum" large transparent right={menuButton} />
      <div className="h-[calc(100dvh-140px)]">
        {layout && (
          <TreeCanvas
            layout={layout}
            persons={persons}
            mode={mode}
            onPersonTap={(id) => setSelectedId(id)}
          />
        )}
      </div>

      <Popover
        opened={menuOpen}
        target={menuTargetRef.current}
        onBackdropClick={() => setMenuOpen(false)}
        className="w-64"
      >
        <List nested>
          <ListItem
            link
            chevron={false}
            onClick={() => {
              setInverted((v) => !v);
              setMenuOpen(false);
            }}
            media={<ArrowUpDown size={20} strokeWidth={1.8} />}
            title="Hierarchie umkehren"
          />
        </List>
        <PopoverSectionLabel>Ansicht</PopoverSectionLabel>
        <List nested>
          {(['Vorfahren', 'Nachfahren'] as TreeMode[]).map((m) => (
            <ListItem
              key={m}
              link
              chevron={false}
              onClick={() => {
                setMode(m);
                setMenuOpen(false);
              }}
              title={m}
              after={mode === m ? <Check size={18} strokeWidth={2.5} /> : null}
            />
          ))}
        </List>
        <PopoverSectionLabel>Generationen</PopoverSectionLabel>
        <List nested>
          {GEN_OPTIONS.map((g) => (
            <ListItem
              key={String(g)}
              link
              chevron={false}
              onClick={() => {
                setGenerations(g);
                setMenuOpen(false);
              }}
              title={g === 'all' ? 'Alle' : String(g)}
              after={generations === g ? <Check size={18} strokeWidth={2.5} /> : null}
            />
          ))}
        </List>
      </Popover>

      {selectedId && (
        <PersonDetailView personId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Page>
  );
}
