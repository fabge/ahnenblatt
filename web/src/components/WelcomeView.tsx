import { useRef } from 'react';
import { Folder } from 'lucide-react';
import { useStore } from '../store';

export function WelcomeView() {
  const { importFiles, isImporting, importError } = useStore();
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 overflow-auto bg-stone-100 dark:bg-zinc-950">
      <div className="min-h-full flex flex-col px-4 pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="mx-auto w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] p-6 flex items-center justify-center">
          <img
            src="/icons/icon-512.png"
            alt="Stammbaum"
            className="w-40 h-40 rounded-2xl"
            draggable={false}
          />
        </div>

        <div className="flex-1" />

        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] p-6">
          <h1 className="text-[34px] leading-tight font-bold tracking-tight">Stammbaum</h1>
          <p className="mt-3 text-[15px] leading-snug text-black/60 dark:text-white/60">
            Öffne deinen Ahnenblatt-Export. Personen und Fotos werden lokal auf dem Gerät
            gespeichert.
          </p>

          <button
            type="button"
            disabled={isImporting}
            onClick={() => ref.current?.click()}
            className="
              mt-6 w-full h-12 rounded-full
              bg-[#8b6a45] active:bg-[#75592e] disabled:opacity-60
              text-white font-semibold text-[16px]
              flex items-center justify-center gap-2
              shadow-[0_2px_8px_-2px_rgba(139,106,69,0.5)]
            "
          >
            <Folder size={18} strokeWidth={2} />
            {isImporting ? 'Importiere…' : 'Ordner auswählen'}
          </button>

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

          <p className="mt-4 text-center text-[13px] text-black/45 dark:text-white/40">
            Erwartet wird eine <code>.ged</code>-Datei mit zugehörigen Fotos.
          </p>

          {importError && (
            <p className="mt-3 text-center text-[13px] text-red-600 dark:text-red-400">
              {importError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
