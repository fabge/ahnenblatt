import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Page, Block } from 'framework7-react';
import { Folder, FileText, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../store';

export function WelcomePage() {
  const { importFiles, isImporting, importError } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const openPicker = () => ref.current?.click();

  return (
    <Page name="welcome" noToolbar noNavbar pageContent={false}>
      <div className="page-content overflow-auto bg-stone-100 dark:bg-zinc-950">
        {/* Mobile: stacked */}
        <div className="md:hidden min-h-full flex flex-col px-4 pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),24px)]">
          <div className="mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] p-5">
            <img
              src="/icons/icon-512.png"
              alt="Stammbaum"
              className="block w-40 h-40 rounded-2xl"
              draggable={false}
            />
          </div>
          <div className="flex-1" />
          <Block className="!mx-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <h1 className="text-[34px] leading-tight font-bold tracking-tight">Stammbaum</h1>
            <p className="mt-3 text-[15px] leading-snug text-black/60 dark:text-white/60">
              Öffne deinen Ahnenblatt-Export. Personen und Fotos werden lokal auf dem Gerät gespeichert.
            </p>
            <PrimaryButton onClick={openPicker} disabled={isImporting} className="mt-6">
              <Folder size={18} strokeWidth={2} />
              {isImporting ? 'Importiere…' : 'Ordner auswählen'}
            </PrimaryButton>
            <p className="mt-4 text-center text-[13px] text-black/45 dark:text-white/40">
              Erwartet wird eine <code>.ged</code>-Datei mit zugehörigen Fotos.
            </p>
            {importError && (
              <p className="mt-3 text-center text-[13px] text-red-600 dark:text-red-400">{importError}</p>
            )}
          </Block>
        </div>

        {/* iPad / desktop */}
        <div className="hidden md:flex min-h-full items-center justify-center px-10 py-16">
          <div className="w-full max-w-5xl grid grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f4ede2] dark:bg-zinc-800 px-3 py-1.5 text-[12px] uppercase tracking-wider text-[#8b6a45] dark:text-[#c9a87a] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b6a45]" />
                Offline · Auf diesem Gerät
              </div>
              <h1 className="mt-6 text-[64px] leading-[0.95] font-bold tracking-tight">Stammbaum</h1>
              <p className="mt-6 max-w-md text-[18px] leading-snug text-black/60 dark:text-white/60">
                Öffne deinen Ahnenblatt-Export. Personen und Fotos werden lokal gespeichert und sind auch ohne Internet verfügbar.
              </p>
              <div className="mt-8">
                <PrimaryButton onClick={openPicker} disabled={isImporting} className="px-5 w-auto">
                  <Folder size={18} strokeWidth={2} />
                  {isImporting ? 'Importiere…' : 'Ordner auswählen'}
                </PrimaryButton>
              </div>
              {importError && (
                <p className="mt-4 text-[13px] text-red-600 dark:text-red-400">{importError}</p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-black/45 dark:text-white/40">
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={14} strokeWidth={2} />
                  <code>.ged</code>-Datei
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon size={14} strokeWidth={2} />
                  Fotos
                </span>
              </div>
            </div>
            <SamplePreviewCard />
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
      </div>
    </Page>
  );
}

function PrimaryButton({
  children, onClick, disabled, className = '',
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        h-12 px-6 rounded-full
        bg-[#8b6a45] active:bg-[#75592e] disabled:opacity-60
        text-white font-semibold text-[16px]
        inline-flex items-center justify-center gap-2
        shadow-[0_2px_8px_-2px_rgba(139,106,69,0.5)]
        w-full md:w-auto cursor-pointer
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface SamplePerson { initials: string; name: string; meta: string }
const SAMPLE_PEOPLE: SamplePerson[] = [
  { initials: 'AH', name: 'Anna Marie Hoffmann', meta: '* 1985 · Architektin' },
  { initials: 'KH', name: 'Klaus Peter Hoffmann', meta: '* 1958 · Maschinenbauingenieur' },
  { initials: 'BW', name: 'Brigitte Hoffmann geb. Weber', meta: '* 1960 · Apothekerin' },
  { initials: 'KH', name: 'Karl Wilhelm Hoffmann', meta: '1925–2002 · Werkmeister' },
  { initials: 'HS', name: 'Hildegard Hoffmann geb. Schmidt', meta: '1928–2015 · Hausfrau' },
];

function SamplePreviewCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] p-6">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-black/45 dark:text-white/45 font-semibold">
        <Folder size={14} strokeWidth={2} />
        Vorschau · Hoffmann_Stammbaum
      </div>
      <ul className="mt-4 divide-y divide-black/5 dark:divide-white/5">
        {SAMPLE_PEOPLE.map((p, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-full bg-[#f4ede2] dark:bg-zinc-800 text-[#8b6a45] dark:text-[#c9a87a] text-[12px] font-semibold flex items-center justify-center shrink-0">
              {p.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold truncate">{p.name}</div>
              <div className="text-[13px] text-black/50 dark:text-white/50 truncate">{p.meta}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-center text-[13px] text-black/40 dark:text-white/40">
        + 16 weitere Personen
      </div>
    </div>
  );
}
