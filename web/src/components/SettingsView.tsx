import { useRef, useState } from 'react';
import {
  Page,
  Navbar,
  BlockTitle,
  List,
  ListItem,
  Toggle,
  Popover,
} from 'konsta/react';
import { Folder, Layers, ChevronsDown, FileText, Check } from 'lucide-react';
import { useStore } from '../store';
import type { TreeMode, GenerationsPref } from '../store';

const APP_VERSION = '1.0';
const GEDCOM_FORMAT = 'GEDCOM 5.5.1';
const GEN_OPTIONS: GenerationsPref[] = [1, 2, 3, 4, 5, 6, 7, 'all'];

const genLabel = (g: GenerationsPref) => (g === 'all' ? 'Alle' : String(g));

export function SettingsView() {
  const { folderName, persons, families, prefs, setPrefs, reset } = useStore();

  const modeRowRef = useRef<HTMLLIElement>(null);
  const genRowRef = useRef<HTMLLIElement>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  return (
    <Page className="pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <Navbar title="Einstellungen" large transparent />

      <div className="mx-4 mt-2 rounded-2xl bg-white dark:bg-zinc-900 px-4 py-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#f4ede2] dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Folder size={24} strokeWidth={1.8} className="text-[#8b6a45]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-black/45 dark:text-white/45 font-medium">
            Geöffneter Ordner
          </div>
          <div className="text-[15px] font-semibold truncate">{folderName || '–'}</div>
          <div className="text-[13px] text-black/55 dark:text-white/55">
            {Object.keys(persons).length} Personen · {Object.keys(families).length} Familien
          </div>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="shrink-0 px-3 h-8 rounded-full bg-black/5 dark:bg-white/10 text-[14px] font-medium text-[#8b6a45] active:opacity-60"
        >
          Wechseln
        </button>
      </div>

      <BlockTitle>Baumansicht</BlockTitle>
      <List strongIos insetIos>
        <ListItem
          ref={modeRowRef}
          link
          chevron
          onClick={() => setModeOpen(true)}
          media={<IconBadge color="bg-emerald-500"><Layers size={18} strokeWidth={2} /></IconBadge>}
          title="Standardmodus"
          after={prefs.defaultMode}
        />
        <ListItem
          ref={genRowRef}
          link
          chevron
          onClick={() => setGenOpen(true)}
          media={<IconBadge color="bg-blue-500"><ChevronsDown size={18} strokeWidth={2} /></IconBadge>}
          title="Generationen"
          after={genLabel(prefs.defaultGenerations)}
        />
        <ListItem
          media={<IconBadge color="bg-amber-500"><FileText size={18} strokeWidth={2} /></IconBadge>}
          title="Lebensdaten anzeigen"
          after={
            <Toggle
              checked={prefs.showLifeData}
              onChange={() => setPrefs({ showLifeData: !prefs.showLifeData })}
            />
          }
        />
      </List>

      <BlockTitle>Info</BlockTitle>
      <List strongIos insetIos>
        <ListItem title="Version" after={APP_VERSION} />
        <ListItem title="Format" after={GEDCOM_FORMAT} />
      </List>

      <Popover
        opened={modeOpen}
        target={modeRowRef.current}
        onBackdropClick={() => setModeOpen(false)}
        className="w-56"
      >
        <List nested>
          {(['Vorfahren', 'Nachfahren'] as TreeMode[]).map((m) => (
            <ListItem
              key={m}
              link
              chevron={false}
              onClick={() => {
                setPrefs({ defaultMode: m });
                setModeOpen(false);
              }}
              title={m}
              after={prefs.defaultMode === m ? <Check size={18} strokeWidth={2.5} /> : null}
            />
          ))}
        </List>
      </Popover>

      <Popover
        opened={genOpen}
        target={genRowRef.current}
        onBackdropClick={() => setGenOpen(false)}
        className="w-56"
      >
        <List nested>
          {GEN_OPTIONS.map((g) => (
            <ListItem
              key={String(g)}
              link
              chevron={false}
              onClick={() => {
                setPrefs({ defaultGenerations: g });
                setGenOpen(false);
              }}
              title={genLabel(g)}
              after={prefs.defaultGenerations === g ? <Check size={18} strokeWidth={2.5} /> : null}
            />
          ))}
        </List>
      </Popover>
    </Page>
  );
}

function IconBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className={`w-8 h-8 rounded-lg ${color} text-white flex items-center justify-center`}>
      {children}
    </div>
  );
}
