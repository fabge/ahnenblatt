import { Page, Navbar, BlockTitle, List, ListItem } from 'konsta/react';
import { FolderMinus } from 'lucide-react';
import { useStore } from '../store';

const APP_VERSION = '1.0';
const GEDCOM_FORMAT = 'GEDCOM 5.5.1';

export function SettingsView() {
  const { folderName, persons, families, reset } = useStore();

  return (
    <Page className="pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <Navbar title="Einstellungen" large transparent />
      <BlockTitle>Stammbaum</BlockTitle>
      <List strongIos insetIos>
        <ListItem title="Ordner" after={folderName || '–'} />
        <ListItem title="Personen" after={String(Object.keys(persons).length)} />
        <ListItem title="Familien" after={String(Object.keys(families).length)} />
      </List>
      <List strongIos insetIos>
        <ListItem
          link
          chevron={false}
          onClick={() => reset()}
          media={<FolderMinus size={26} strokeWidth={1.8} className="text-blue-500" />}
          title={<span className="text-red-500">Anderen Ordner wählen</span>}
        />
      </List>
      <BlockTitle>Info</BlockTitle>
      <List strongIos insetIos>
        <ListItem title="Version" after={APP_VERSION} />
        <ListItem title="Format" after={GEDCOM_FORMAT} />
      </List>
    </Page>
  );
}
