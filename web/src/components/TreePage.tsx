import { useMemo, useState } from 'react';
import {
  Page, Link, Icon,
  Block, Popover, List, ListItem, Sheet,
} from 'framework7-react';
import { useStore } from '../store';
import type { TreeMode, GenerationsPref } from '../store';
import { ancestorLayout, descendantLayout, invertLayoutY } from '../layout';
import { fullName } from '../types';
import { TreeCanvas } from './TreeCanvas';
import { PersonDetailContent } from './PersonDetailContent';

const GEN_OPTIONS: GenerationsPref[] = [1, 2, 3, 4, 5, 6, 7, 'all'];
const GEN_LIMIT = 100;

function PopoverSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[12px] uppercase tracking-wider opacity-50 font-medium">
      {children}
    </div>
  );
}

export function TreePage() {
  const { rootPersonId, persons, families, prefs } = useStore();
  const [mode, setMode] = useState<TreeMode>(prefs.defaultMode);
  const [generations, setGenerations] = useState<GenerationsPref>(prefs.defaultGenerations);
  const [inverted, setInverted] = useState(false);
  const [sheetPersonId, setSheetPersonId] = useState<string | null>(null);
  const [sheetOpened, setSheetOpened] = useState(false);

  const rootPerson = rootPersonId ? persons[rootPersonId] : null;

  const layout = useMemo(() => {
    if (!rootPersonId || !persons[rootPersonId]) return null;
    const genLimit = generations === 'all' ? GEN_LIMIT : generations;
    const base = mode === 'Vorfahren'
      ? ancestorLayout(persons, families, rootPersonId, genLimit)
      : descendantLayout(persons, families, rootPersonId, genLimit);
    return inverted ? invertLayoutY(base) : base;
  }, [persons, families, rootPersonId, mode, generations, inverted]);

  const openSheet = (id: string) => {
    setSheetPersonId(id);
    setSheetOpened(true);
  };

  return (
    <Page name="tree">
      <header className="tree-header">
        <div className="tree-header-text">
          <div className="tree-header-label">Stammbaum</div>
          <div className="tree-header-title">{rootPerson ? fullName(rootPerson) : '—'}</div>
        </div>
        <Link popoverOpen=".popover-tree-options" iconOnly aria-label="Optionen" className="tree-header-button">
          <Icon f7="slider_horizontal_3" size={22} />
        </Link>
      </header>

      {layout ? (
        <TreeCanvas
          layout={layout}
          persons={persons}
          mode={mode}
          onPersonTap={openSheet}
        />
      ) : (
        <Block strong inset className="text-center">
          <p className="opacity-60 text-sm">
            Keine Wurzelperson gewählt. Öffne eine Person in der Personenliste und tippe „Als Wurzel".
          </p>
        </Block>
      )}

      <Popover className="popover-tree-options">
        <List dividers>
          <ListItem
            link="#"
            noChevron
            popoverClose
            onClick={() => setInverted((v) => !v)}
            title="Hierarchie umkehren"
          >
            <Icon slot="media" f7="arrow_up_arrow_down" size={20} />
          </ListItem>
        </List>
        <PopoverSectionLabel>Ansicht</PopoverSectionLabel>
        <List dividers>
          {(['Vorfahren', 'Nachfahren'] as TreeMode[]).map((m) => (
            <ListItem
              key={m}
              link="#"
              noChevron
              popoverClose
              onClick={() => setMode(m)}
              title={m}
            >
              {mode === m && <Icon slot="after" f7="checkmark" size={18} />}
            </ListItem>
          ))}
        </List>
        <PopoverSectionLabel>Generationen</PopoverSectionLabel>
        <List dividers>
          {GEN_OPTIONS.map((g) => (
            <ListItem
              key={String(g)}
              link="#"
              noChevron
              popoverClose
              onClick={() => setGenerations(g)}
              title={g === 'all' ? 'Alle' : String(g)}
            >
              {generations === g && <Icon slot="after" f7="checkmark" size={18} />}
            </ListItem>
          ))}
        </List>
      </Popover>

      <Sheet
        className="person-sheet"
        opened={sheetOpened}
        backdrop
        swipeToClose
        onSheetClosed={() => setSheetPersonId(null)}
        onSheetClose={() => setSheetOpened(false)}
        style={{ height: 'calc(100% - env(safe-area-inset-top) - 12px)' }}
      >
        {sheetPersonId && (
          <PersonDetailContent
            personId={sheetPersonId}
            onSelectRelation={(id) => setSheetPersonId(id)}
            navLeft={
              <Link sheetClose iconOnly aria-label="Schließen">
                <Icon f7="multiply" size={22} />
              </Link>
            }
            afterOpenInTree={() => setSheetOpened(false)}
          />
        )}
      </Sheet>
    </Page>
  );
}
