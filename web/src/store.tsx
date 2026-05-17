import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import JSZip from 'jszip';
import type { Person, Family } from './types';
import { parseGedcom } from './gedcom';
import {
  saveMeta,
  loadMeta,
  putPhoto,
  getPhoto,
  photoKey,
  clearAll,
  setRootPersonId as dbSetRootPersonId,
} from './db';
import { mostAncestralPerson } from './lib/findRootPerson';

export interface CanvasState {
  scale: number;
  tx: number;
  ty: number;
  centered: boolean;
}

export type TreeMode = 'Vorfahren' | 'Nachfahren';
export type GenerationsPref = number | 'all';

export interface Prefs {
  defaultMode: TreeMode;
  defaultGenerations: GenerationsPref;
  showLifeData: boolean;
}

const PREFS_KEY = 'stammbaum:prefs';
const DEFAULT_PREFS: Prefs = {
  defaultMode: 'Vorfahren',
  defaultGenerations: 'all',
  showLifeData: true,
};

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function persistPrefs(p: Prefs) {
  try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* empty */ }
}

interface StoreState {
  isLoaded: boolean;
  isLoading: boolean;
  isImporting: boolean;
  importError: string | null;
  persons: Record<string, Person>;
  families: Record<string, Family>;
  folderName: string;
  rootPersonId: string | null;
  canvasByMode: Record<string, CanvasState>;
  prefs: Prefs;
}

interface StoreApi extends StoreState {
  importFiles: (files: FileList) => Promise<void>;
  importArchive: (file: File) => Promise<void>;
  reset: () => Promise<void>;
  getPhotoUrl: (photoPath: string) => Promise<string | null>;
  setRootPerson: (id: string | null) => Promise<void>;
  getCanvas: (mode: string) => CanvasState;
  setCanvas: (mode: string, state: CanvasState) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
}

const StoreCtx = createContext<StoreApi | null>(null);

const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.bmp'];

function zipDisplayName(file: File, gedPath: string): string {
  const topLevel = gedPath.split('/').filter(Boolean)[0];
  if (topLevel && topLevel.toLowerCase() !== gedPath.toLowerCase()) return topLevel;
  return file.name.replace(/\.zip$/i, '');
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    isLoaded: false,
    isLoading: true,
    isImporting: false,
    importError: null,
    persons: {},
    families: {},
    folderName: '',
    rootPersonId: null,
    canvasByMode: {},
    prefs: loadPrefs(),
  });

  // Object URL cache: key (lowercase basename) -> blob URL
  const urlCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const meta = await loadMeta();
      setState((s) => ({
        ...s,
        isLoading: false,
        ...(meta && {
          isLoaded: true,
          persons: meta.persons,
          families: meta.families,
          folderName: meta.folderName,
          rootPersonId: meta.rootPersonId ?? mostAncestralPerson(meta.persons, meta.families),
        }),
      }));
    })();
  }, []);

  const finishImport = useCallback(async (
    all: Array<{ name: string; path: string; blob: Blob }>,
    ged: File,
    folderName: string,
  ) => {
    const { persons, families } = await parseGedcom(ged);

    // Clear caches + store
    for (const url of urlCache.current.values()) URL.revokeObjectURL(url);
    urlCache.current.clear();
    await clearAll();

    // Store all image-ish files indexed by relative path for collision safety
    for (const f of all) {
      const lower = f.name.toLowerCase();
      if (imgExts.some((ext) => lower.endsWith(ext))) {
        await putPhoto(f.path, f.blob);
      }
    }

    const rootPersonId = mostAncestralPerson(persons, families);

    await saveMeta({ persons, families, folderName, importedAt: Date.now(), rootPersonId: rootPersonId ?? undefined });

    setState((s) => ({
      ...s,
      isLoaded: true,
      isImporting: false,
      persons,
      families,
      folderName,
      rootPersonId,
      canvasByMode: {},
    }));
  }, []);

  const importFiles = useCallback(async (files: FileList) => {
    setState((s) => ({ ...s, isImporting: true, importError: null }));
    try {
      const fileList = Array.from(files);
      const all = fileList.map((f) => ({
        name: f.name,
        path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
        blob: f,
      }));
      const ged = all.find((f) => f.name.toLowerCase().endsWith('.ged'));
      if (!ged) throw new Error('Keine GEDCOM-Datei (.ged) im gewählten Ordner gefunden.');

      // Pick folder name from the first file's webkitRelativePath
      const folderName = all[0]?.path.split('/')[0] ?? '';
      await finishImport(all, ged.blob as File, folderName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, isImporting: false, importError: msg }));
    }
  }, [finishImport]);

  const importArchive = useCallback(async (file: File) => {
    setState((s) => ({ ...s, isImporting: true, importError: null }));
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((entry) => !entry.dir && !entry.name.startsWith('__MACOSX/'));
      const gedEntry = entries.find((entry) => entry.name.toLowerCase().endsWith('.ged'));
      if (!gedEntry) throw new Error('Keine GEDCOM-Datei (.ged) im ZIP-Archiv gefunden.');

      const all = await Promise.all(entries.map(async (entry) => {
        const blob = await entry.async('blob');
        const name = entry.name.split('/').pop() || entry.name;
        return { name, path: entry.name, blob };
      }));
      const gedBlob = await gedEntry.async('blob');
      const gedFile = new File([gedBlob], gedEntry.name.split('/').pop() || 'import.ged', { type: 'text/plain' });

      await finishImport(all, gedFile, zipDisplayName(file, gedEntry.name));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, isImporting: false, importError: msg }));
    }
  }, [finishImport]);

  const reset = useCallback(async () => {
    for (const url of urlCache.current.values()) URL.revokeObjectURL(url);
    urlCache.current.clear();
    await clearAll();
    setState((s) => ({
      isLoaded: false,
      isLoading: false,
      isImporting: false,
      importError: null,
      persons: {},
      families: {},
      folderName: '',
      rootPersonId: null,
      canvasByMode: {},
      prefs: s.prefs,
    }));
  }, []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setState((s) => {
      const next = { ...s.prefs, ...patch };
      persistPrefs(next);
      return { ...s, prefs: next };
    });
  }, []);

  const getPhotoUrl = useCallback(async (photoPath: string): Promise<string | null> => {
    const key = photoKey(photoPath);
    if (!key) return null;
    const cached = urlCache.current.get(key);
    if (cached) return cached;
    const blob = await getPhoto(key);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.current.set(key, url);
    return url;
  }, []);

  const setRootPerson = useCallback(async (id: string | null) => {
    await dbSetRootPersonId(id);
    // Resetting root invalidates per-mode viewport state (matches iOS).
    setState((s) => ({ ...s, rootPersonId: id, canvasByMode: {} }));
  }, []);

  const getCanvas = useCallback((mode: string): CanvasState => {
    return state.canvasByMode[mode] ?? { scale: 1, tx: 0, ty: 0, centered: false };
  }, [state.canvasByMode]);

  const setCanvas = useCallback((mode: string, cs: CanvasState) => {
    setState((s) => ({ ...s, canvasByMode: { ...s.canvasByMode, [mode]: cs } }));
  }, []);

  return (
    <StoreCtx.Provider
      value={{ ...state, importFiles, importArchive, reset, getPhotoUrl, setRootPerson, getCanvas, setCanvas, setPrefs }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreApi {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
