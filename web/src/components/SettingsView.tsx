import { useRef } from 'react';
import {
  Page, Navbar, NavTitle, NavTitleLarge, BlockTitle, Block, List, ListItem, Toggle, Button, Icon,
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
      <Navbar large>
        <NavTitle>Einstellungen</NavTitle>
        <NavTitleLarge>Einstellungen</NavTitleLarge>
      </Navbar>

      <BlockTitle>Geöffneter Ordner</BlockTitle>
      <List strong inset mediaList dividers>
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
      <List strong inset dividers>
        <ListItem
          title="Standardmodus"
          smartSelect
          smartSelectParams={{ openIn: 'popover', closeOnSelect: true }}
        >
          <Icon slot="media" f7="square_stack_fill" size={22} />
          <select
            name="defaultMode"
            value={prefs.defaultMode}
            onChange={(e) => setPrefs({ defaultMode: e.target.value as TreeMode })}
          >
            {(['Vorfahren', 'Nachfahren'] as TreeMode[]).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </ListItem>
        <ListItem
          title="Generationen"
          smartSelect
          smartSelectParams={{ openIn: 'popover', closeOnSelect: true }}
        >
          <Icon slot="media" f7="chevron_down" size={22} />
          <select
            name="defaultGenerations"
            value={String(prefs.defaultGenerations)}
            onChange={(e) => {
              const v = e.target.value;
              setPrefs({ defaultGenerations: v === 'all' ? 'all' : Number(v) });
            }}
          >
            {GEN_OPTIONS.map((g) => (
              <option key={String(g)} value={String(g)}>{genLabel(g)}</option>
            ))}
          </select>
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
      <List strong inset dividers>
        <ListItem title="Version" after={APP_VERSION} />
        <ListItem title="Format" after={GEDCOM_FORMAT} />
      </List>

    </Page>
  );
}
