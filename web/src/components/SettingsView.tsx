import { Page, Navbar, BlockTitle, List, ListItem, Block, Button } from 'konsta/react';
import { useStore } from '../store';

export function SettingsView() {
  const { folderName, persons, reset } = useStore();
  return (
    <Page>
      <Navbar title="Einstellungen" large transparent />
      <BlockTitle>Ordner</BlockTitle>
      <List strongIos insetIos>
        <ListItem title="Name" after={folderName || '–'} />
        <ListItem title="Personen" after={String(Object.keys(persons).length)} />
      </List>
      <Block inset>
        <Button
          large
          rounded
          colors={{ fillBgIos: 'bg-red-500', fillBgMaterial: 'bg-red-500' }}
          onClick={() => {
            if (confirm('Wirklich alle Daten löschen und neuen Ordner wählen?')) reset();
          }}
        >
          Anderen Ordner laden
        </Button>
      </Block>
    </Page>
  );
}
