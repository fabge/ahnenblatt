import { useEffect, useRef, useState } from 'react';
import {
  Page, Block, Button, Card, Chip, Icon,
} from 'framework7-react';
import { useStore } from '../store';

export function WelcomePage() {
  const { importFiles, importArchive, isImporting, importError } = useStore();
  const folderRef = useRef<HTMLInputElement>(null);
  const archiveRef = useRef<HTMLInputElement>(null);
  const [importSource, setImportSource] = useState<'folder' | 'archive' | null>(null);
  const openFolderPicker = () => folderRef.current?.click();
  const openArchivePicker = () => archiveRef.current?.click();

  useEffect(() => {
    if (!isImporting) setImportSource(null);
  }, [isImporting]);

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

            <div className="welcome-import-actions">
              <Button
                fill
                large
                round
                raised
                disabled={isImporting}
                preloader
                loading={isImporting && importSource === 'folder'}
                iconF7={isImporting && importSource === 'folder' ? undefined : 'folder_fill'}
                iconSize={16}
                onClick={openFolderPicker}
                className="welcome-import-button"
              >
                {isImporting && importSource === 'folder' ? 'Importiere…' : 'Ordner auswählen'}
              </Button>
              <Button
                large
                round
                raised
                disabled={isImporting}
                preloader
                loading={isImporting && importSource === 'archive'}
                iconF7={isImporting && importSource === 'archive' ? undefined : 'archivebox_fill'}
                iconSize={16}
                onClick={openArchivePicker}
                className="welcome-import-button"
              >
                {isImporting && importSource === 'archive' ? 'Importiere…' : 'ZIP auswählen'}
              </Button>
            </div>

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
        ref={folderRef}
        type="file"
        /* @ts-expect-error -- non-standard attrs */
        webkitdirectory=""
        directory=""
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            setImportSource('folder');
            importFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={archiveRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setImportSource('archive');
            importArchive(file);
          }
          e.target.value = '';
        }}
      />
    </Page>
  );
}
