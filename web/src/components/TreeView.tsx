import { useMemo, useRef, useState } from 'react';
import {
  Page,
  Navbar,
  Segmented,
  SegmentedButton,
  Block,
  Popover,
  List,
  ListItem,
} from 'konsta/react';
import { Check, SlidersHorizontal, FlipVertical } from 'lucide-react';
import { useStore } from '../store';
import { ancestorLayout, descendantLayout, invertLayoutY } from '../layout';
import { TreeCanvas } from './TreeCanvas';
import { PersonDetailView } from './PersonDetailView';
import { fullName } from '../types';

type Mode = 'Vorfahren' | 'Nachfahren';
type GenerationsValue = number | 'all';

const GEN_OPTIONS: GenerationsValue[] = [1, 2, 3, 4, 5, 6, 7, 'all'];
const GEN_LIMIT = 100;

export function TreeView() {
  const { rootPersonId, persons, families } = useStore();
  const [mode, setMode] = useState<Mode>('Vorfahren');
  const [generations, setGenerations] = useState<GenerationsValue>('all');
  const [inverted, setInverted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTargetRef = useRef<HTMLButtonElement>(null);

  const layout = useMemo(() => {
    if (!rootPersonId || !persons[rootPersonId]) return null;
    const genLimit = generations === 'all' ? GEN_LIMIT : generations;
    const base = mode === 'Vorfahren'
      ? ancestorLayout(persons, families, rootPersonId, genLimit)
      : descendantLayout(persons, families, rootPersonId, genLimit);
    return inverted ? invertLayoutY(base) : base;
  }, [persons, families, rootPersonId, mode, generations, inverted]);

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

  const root = persons[rootPersonId];

  return (
    <Page>
      <Navbar title={fullName(root)} subtitle="Stammbaum" />
      <Block strong inset className="!my-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Segmented strong>
              <SegmentedButton active={mode === 'Vorfahren'} onClick={() => setMode('Vorfahren')}>
                Vorfahren
              </SegmentedButton>
              <SegmentedButton active={mode === 'Nachfahren'} onClick={() => setMode('Nachfahren')}>
                Nachfahren
              </SegmentedButton>
            </Segmented>
          </div>
          <button
            ref={menuTargetRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full text-primary active:opacity-50"
            aria-label="Optionen"
          >
            <SlidersHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </Block>
      <div className="px-4">
        <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 h-[calc(100dvh-180px)]">
          {layout && (
            <TreeCanvas
              layout={layout}
              persons={persons}
              mode={mode}
              onPersonTap={(id) => setSelectedId(id)}
            />
          )}
        </div>
      </div>

      <Popover
        opened={menuOpen}
        target={menuTargetRef.current}
        onBackdropClick={() => setMenuOpen(false)}
        className="w-64"
      >
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
              title={g === 'all' ? 'Alle Generationen' : `${g} Generationen`}
              after={generations === g ? <Check size={18} strokeWidth={2.5} /> : null}
            />
          ))}
          <ListItem
            link
            chevron={false}
            onClick={() => {
              setInverted((v) => !v);
              setMenuOpen(false);
            }}
            media={<FlipVertical size={20} strokeWidth={1.8} />}
            title="Hierarchie umkehren"
          />
        </List>
      </Popover>

      {selectedId && (
        <PersonDetailView personId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Page>
  );
}
