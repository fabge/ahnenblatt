import { useState } from 'react';
import {
  Page,
  Navbar,
  BlockTitle,
  List,
  ListItem,
  Block,
  Button,
  Dialog,
  DialogButton,
} from 'konsta/react';
import { useStore } from '../store';

export function SettingsView() {
  const { folderName, persons, reset } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
          onClick={() => setConfirmOpen(true)}
        >
          Anderen Ordner laden
        </Button>
      </Block>

      <Dialog
        opened={confirmOpen}
        onBackdropClick={() => setConfirmOpen(false)}
        title="Daten löschen?"
        content="Alle importierten Personen und Fotos werden entfernt, und du wählst anschließend einen neuen Ordner."
        buttons={
          <>
            <DialogButton onClick={() => setConfirmOpen(false)}>Abbrechen</DialogButton>
            <DialogButton
              strong
              onClick={() => {
                setConfirmOpen(false);
                reset();
              }}
            >
              Löschen
            </DialogButton>
          </>
        }
      />
    </Page>
  );
}
