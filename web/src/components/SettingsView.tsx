import { useRef } from 'react';
import {
  Page, Navbar, NavTitle, NavTitleLarge, BlockTitle, Block, List, ListItem, Toggle, Icon,
} from 'framework7-react';
import { useStore } from '../store';
import type { TreeMode, GenerationsPref } from '../store';

const APP_VERSION = '1.0';
const GEDCOM_FORMAT = 'GEDCOM 5.5.1';
const GEN_OPTIONS: GenerationsPref[] = [1, 2, 3, 4, 5, 6, 7, 'all'];

const genLabel = (g: GenerationsPref) => (g === 'all' ? 'Alle' : String(g));

export function SettingsView() {
  const { folderName, persons, families, prefs, setPrefs, importFiles, reset } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Page name="settings">
      <Navbar large>
        <NavTitle>Einstellungen</NavTitle>
        <NavTitleLarge>Einstellungen</NavTitleLarge>
      </Navbar>

      <BlockTitle>Geöffneter Ordner</BlockTitle>
      <List strong inset dividers>
        <ListItem title="Ordner" after={folderName || '–'}>
          <Icon slot="media" f7="folder_fill" size={22} />
        </ListItem>
        {folderName && (
          <ListItem
            title="Personen"
            after={`${Object.keys(persons).length} · ${Object.keys(families).length} Familien`}
          >
            <Icon slot="media" f7="person_2_fill" size={22} />
          </ListItem>
        )}
        <ListItem
          link="#"
          title="Ordner wechseln"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            fileRef.current?.click();
          }}
        >
          <Icon slot="media" f7="arrow_2_circlepath" size={22} />
        </ListItem>
        {folderName && (
          <ListItem
            link="#"
            title="Ordner entfernen"
            className="text-red-500"
            onClick={async (e: React.MouseEvent) => {
              e.preventDefault();
              if (window.confirm('Soll der geöffnete Ordner entfernt werden?')) {
                await reset();
              }
            }}
          >
            <Icon slot="media" f7="trash" size={22} color="red" />
          </ListItem>
        )}
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
          <Icon slot="media" f7="rectangle_stack_person_crop_fill" size={22} />
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
          <Icon slot="media" f7="list_number" size={22} />
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
