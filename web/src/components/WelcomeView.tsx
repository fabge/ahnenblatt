import { useRef } from 'react';
import { Page, Block, BlockTitle, Button } from 'konsta/react';
import { useStore } from '../store';

export function WelcomeView() {
  const { importFiles, isImporting, importError } = useStore();
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Page>
      <div className="flex flex-col items-center justify-center min-h-full px-4 py-12 text-center">
        <div className="text-6xl mb-4">🌳</div>
        <BlockTitle large>Stammbaum</BlockTitle>
        <Block strong inset>
          <p className="text-sm">
            Wähle den Ordner aus, der deine Ahnenblatt-<code>.ged</code>-Datei und die
            zugehörigen Fotos enthält. Die Daten bleiben lokal auf deinem Gerät.
          </p>
        </Block>
        <Block inset>
          <Button large rounded disabled={isImporting} onClick={() => ref.current?.click()}>
            {isImporting ? 'Importiere…' : 'Ordner auswählen'}
          </Button>
          <input
            ref={ref}
            type="file"
            /* @ts-expect-error -- non-standard attrs */
            webkitdirectory=""
            directory=""
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                importFiles(e.target.files);
              }
            }}
          />
          {importError && (
            <p className="text-red-600 dark:text-red-400 mt-4 text-sm">{importError}</p>
          )}
        </Block>
      </div>
    </Page>
  );
}
