import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { Person, Family } from './types';

const DB_NAME = 'stammbaum';
const DB_VERSION = 1;

interface MetaRecord {
  persons: Record<string, Person>;
  families: Record<string, Family>;
  folderName: string;
  importedAt: number;
  rootPersonId?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
        // photos keyed by lowercase basename for case-insensitive lookup
        if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos');
      },
    });
  }
  return dbPromise;
}

export async function saveMeta(meta: MetaRecord) {
  const d = await db();
  await d.put('meta', meta, 'current');
}

export async function loadMeta(): Promise<MetaRecord | null> {
  const d = await db();
  return (await d.get('meta', 'current')) ?? null;
}

export async function setRootPersonId(id: string | null) {
  const meta = await loadMeta();
  if (!meta) return;
  meta.rootPersonId = id ?? undefined;
  await saveMeta(meta);
}

export async function clearAll() {
  const d = await db();
  await d.clear('meta');
  await d.clear('photos');
}

export async function putPhoto(path: string, blob: Blob) {
  const d = await db();
  const key = path.replace(/\\/g, '/').toLowerCase();
  await d.put('photos', blob, key);
}

export async function getPhoto(path: string): Promise<Blob | null> {
  const d = await db();
  const normalized = path.replace(/\\/g, '/').toLowerCase();

  // Exact match
  const exact = await d.get('photos', normalized);
  if (exact) return exact;

  // Basename fallback
  const basename = normalized.substring(normalized.lastIndexOf('/') + 1);
  const byBasename = await d.get('photos', basename);
  if (byBasename) return byBasename;

  // Suffix scan fallback for cross-folder collision safety
  const keys = await d.getAllKeys('photos');
  for (const key of keys) {
    if (typeof key !== 'string') continue;
    if (normalized.endsWith(key) || key.endsWith(normalized)) {
      return await d.get('photos', key);
    }
  }
  return null;
}

/** Resolve a GEDCOM photoPath (may be Windows-absolute) to a lookup key. */
export function photoKey(photoPath: string): string {
  if (!photoPath) return '';
  return photoPath.replace(/\\/g, '/').toLowerCase();
}
