import { useMemo, useState } from 'react';
import {
  Page, Navbar, NavTitle, NavRight, Link,
  Block, Popover, List, ListItem, Sheet,
} from 'framework7-react';
import { Check, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { useStore } from '../store';
import type { TreeMode, GenerationsPref } from '../store';
import { ancestorLayout, descendantLayout, invertLayoutY } from '../layout';
import { TreeCanvas } from './TreeCanvas';
import { PeopleSidebar } from './PeopleSidebar';
import { PersonDetailContent } from './PersonDetailContent';
import { useMediaQuery } from '../useMediaQuery';

const GEN_OPTIONS: GenerationsPref[] = [1, 2, 3, 4, 5, 6, 7, 'all'];
const GEN_LIMIT = 100;

function PopoverSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[12px] uppercase tracking-wider opacity-50 font-medium">
      {children}
    </div>
  );
}

export function TreeView() {
  const { rootPersonId, persons, families, prefs, setRootPerson } = useStore();
  const [mode, setMode] = useState<TreeMode>(prefs.defaultMode);
  const [generations, setGenerations] = useState<GenerationsPref>(prefs.defaultGenerations);
  const [inverted, setInverted] = useState(false);
  const [sheetPersonId, setSheetPersonId] = useState<string | null>(null);
  const [sheetOpened, setSheetOpened] = useState(false);

  const isWide = useMediaQuery('(min-width: 768px)');

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
    <Page name="tree" pageContent={false}>
      <Navbar>
        <NavTitle>Stammbaum</NavTitle>
        <NavRight>
          <Link
            className="tree-options-link"
            popoverOpen=".popover-tree-options"
            iconOnly
            aria-label="Optionen"
          >
            <SlidersHorizontal size={22} strokeWidth={2} />
          </Link>
        </NavRight>
      </Navbar>

      <div className="page-content !p-0 flex !overflow-hidden">
        {isWide && (
          <PeopleSidebar
            activeId={rootPersonId}
            onSelect={(id) => setRootPerson(id)}
          />
        )}
        <div className="flex-1 relative">
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
        </div>
      </div>

      <Popover className="popover-tree-options">
        <List>
          <ListItem
            link="#"
            noChevron
            popoverClose
            onClick={() => setInverted((v) => !v)}
            title="Hierarchie umkehren"
          >
            <ArrowUpDown slot="media" size={20} strokeWidth={1.8} />
          </ListItem>
        </List>
        <PopoverSectionLabel>Ansicht</PopoverSectionLabel>
        <List>
          {(['Vorfahren', 'Nachfahren'] as TreeMode[]).map((m) => (
            <ListItem
              key={m}
              link="#"
              noChevron
              popoverClose
              onClick={() => setMode(m)}
              title={m}
            >
              {mode === m && <Check slot="after" size={18} strokeWidth={2.5} />}
            </ListItem>
          ))}
        </List>
        <PopoverSectionLabel>Generationen</PopoverSectionLabel>
        <List>
          {GEN_OPTIONS.map((g) => (
            <ListItem
              key={String(g)}
              link="#"
              noChevron
              popoverClose
              onClick={() => setGenerations(g)}
              title={g === 'all' ? 'Alle' : String(g)}
            >
              {generations === g && <Check slot="after" size={18} strokeWidth={2.5} />}
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
              <Link onClick={() => setSheetOpened(false)} iconOnly aria-label="Schließen">
                <X size={22} strokeWidth={2.2} />
              </Link>
            }
            afterOpenInTree={() => setSheetOpened(false)}
          />
        )}
      </Sheet>
    </Page>
  );
}
