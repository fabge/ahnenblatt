import { useRef } from 'react';
import {
  Page, Navbar, NavTitle, BlockTitle, Block, List, ListItem, Toggle, Popover, Button, Icon,
} from 'framework7-react';
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
          <Icon slot="media" f7="folder_fill" size={28} />
          <Button slot="after" small round fill onClick={() => fileRef.current?.click()}>
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
          <Icon slot="media" f7="square_stack_fill" size={22} />
        </ListItem>
        <ListItem
          link="#"
          popoverOpen=".popover-gens"
          title="Generationen"
          after={genLabel(prefs.defaultGenerations)}
        >
          <Icon slot="media" f7="chevron_down" size={22} />
        </ListItem>
        <ListItem title="Lebensdaten anzeigen">
          <Icon slot="media" f7="doc_text_fill" size={22} />
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
              {prefs.defaultMode === m && <Icon slot="after" f7="checkmark" size={18} />}
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
              {prefs.defaultGenerations === g && <Icon slot="after" f7="checkmark" size={18} />}
            </ListItem>
          ))}
        </List>
      </Popover>
    </Page>
  );
}
