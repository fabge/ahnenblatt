import { useRef } from 'react';
import {
  Page, Navbar, NavTitle, BlockTitle, Block, List, ListItem, Toggle, Popover, Button,
} from 'framework7-react';
import { Folder, Layers, ChevronsDown, FileText, Check } from 'lucide-react';
import { useStore } from '../store';
import type { TreeMode, GenerationsPref } from '../store';

const APP_VERSION = '1.0';
const GEDCOM_FORMAT = 'GEDCOM 5.5.1';
const GEN_OPTIONS: GenerationsPref[] = [1, 2, 3, 4, 5, 6, 7, 'all'];

const genLabel = (g: GenerationsPref) => (g === 'all' ? 'Alle' : String(g));

export function SettingsView() {
  const { folderName, persons, families, prefs, setPrefs, importFiles } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Page name="settings">
      <Navbar>
        <NavTitle>Einstellungen</NavTitle>
      </Navbar>

      <BlockTitle>Geöffneter Ordner</BlockTitle>
      <List strong inset mediaList>
        <ListItem
          title={folderName || '–'}
          text={`${Object.keys(persons).length} Personen · ${Object.keys(families).length} Familien`}
        >
          <FolderBadge slot="media" />
          <Button
            slot="after"
            small
            round
            fill
            className="folder-change-btn"
            onClick={() => fileRef.current?.click()}
          >
            Wechseln
          </Button>
        </ListItem>
      </List>
      <input
        ref={fileRef}
        type="file"
        /* @ts-expect-error -- non-standard attrs */
        webkitdirectory=""
        directory=""
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) importFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {!folderName && (
        <Block className="!mt-0 text-[13px] opacity-55">
          Kein Ordner geöffnet.
        </Block>
      )}

      <BlockTitle>Baumansicht</BlockTitle>
      <List strong inset>
        <ListItem
          link="#"
          popoverOpen=".popover-mode"
          title="Standardmodus"
          after={prefs.defaultMode}
        >
          <IconBadge slot="media" color="bg-emerald-500"><Layers size={18} strokeWidth={2} /></IconBadge>
        </ListItem>
        <ListItem
          link="#"
          popoverOpen=".popover-gens"
          title="Generationen"
          after={genLabel(prefs.defaultGenerations)}
        >
          <IconBadge slot="media" color="bg-blue-500"><ChevronsDown size={18} strokeWidth={2} /></IconBadge>
        </ListItem>
        <ListItem title="Lebensdaten anzeigen">
          <IconBadge slot="media" color="bg-amber-500"><FileText size={18} strokeWidth={2} /></IconBadge>
          <Toggle
            slot="after"
            checked={prefs.showLifeData}
            onChange={() => setPrefs({ showLifeData: !prefs.showLifeData })}
          />
        </ListItem>
      </List>

      <BlockTitle>Info</BlockTitle>
      <List strong inset>
        <ListItem title="Version" after={APP_VERSION} />
        <ListItem title="Format" after={GEDCOM_FORMAT} />
      </List>

      <Popover className="popover-mode">
        <List>
          {(['Vorfahren', 'Nachfahren'] as TreeMode[]).map((m) => (
            <ListItem
              key={m}
              link="#"
              noChevron
              popoverClose
              onClick={() => setPrefs({ defaultMode: m })}
              title={m}
            >
              {prefs.defaultMode === m && <Check slot="after" size={18} strokeWidth={2.5} />}
            </ListItem>
          ))}
        </List>
      </Popover>

      <Popover className="popover-gens">
        <List>
          {GEN_OPTIONS.map((g) => (
            <ListItem
              key={String(g)}
              link="#"
              noChevron
              popoverClose
              onClick={() => setPrefs({ defaultGenerations: g })}
              title={genLabel(g)}
            >
              {prefs.defaultGenerations === g && <Check slot="after" size={18} strokeWidth={2.5} />}
            </ListItem>
          ))}
        </List>
      </Popover>
    </Page>
  );
}

function IconBadge({
  color, children, slot,
}: { color: string; children: React.ReactNode; slot?: string }) {
  return (
    <div slot={slot} className={`w-8 h-8 rounded-lg ${color} text-white flex items-center justify-center`}>
      {children}
    </div>
  );
}

function FolderBadge({ slot }: { slot?: string }) {
  return (
    <div
      slot={slot}
      className="w-11 h-11 rounded-xl bg-[#f4ede2] dark:bg-zinc-800 flex items-center justify-center"
    >
      <Folder size={22} strokeWidth={1.8} className="text-[#8b6a45]" />
    </div>
  );
}
