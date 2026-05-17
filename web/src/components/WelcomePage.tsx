import { useRef } from 'react';
import {
  Page, Block, Button, Card, Chip, Icon,
} from 'framework7-react';
import { useStore } from '../store';

export function WelcomePage() {
  const { importFiles, isImporting, importError } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const openPicker = () => ref.current?.click();

  return (
    <Page name="welcome" noToolbar noNavbar className="welcome-page">
      <div className="welcome-shell">
        <div className="welcome-layout">
          <div className="welcome-intro">
            <Chip
              className="welcome-chip"
              mediaBgColor="transparent"
              mediaTextColor="brown"
              text="Offline · Auf diesem Gerät"
            >
              <Icon slot="media" f7="checkmark_seal_fill" size={16} />
            </Chip>

            <h1>Stammbaum</h1>
            <p className="welcome-copy">
              Öffne deinen Ahnenblatt-Export. Personen und Fotos werden lokal gespeichert und sind auch ohne Internet verfügbar.
            </p>

            <Button
              fill
              large
              round
              raised
              disabled={isImporting}
              preloader
              loading={isImporting}
              iconF7="folder_fill"
              iconSize={16}
              onClick={openPicker}
              className="welcome-import-button"
            >
              {isImporting ? 'Importiere…' : 'Ordner auswählen'}
            </Button>

            {importError && <Block className="welcome-error">{importError}</Block>}

            <div className="welcome-requirements">
              <span>
                <Icon f7="doc_text_fill" size={14} />
                <code>.ged</code>
              </span>
              <span>
                <Icon f7="photo_fill" size={14} />
                Fotos
              </span>
            </div>
          </div>

          <div className="welcome-media">
            <Card raised className="welcome-icon-card">
              <img src="/icons/icon-512.png" alt="Stammbaum" draggable={false} />
            </Card>
          </div>
        </div>
      </div>

      <input
        ref={ref}
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
    </Page>
  );
}
