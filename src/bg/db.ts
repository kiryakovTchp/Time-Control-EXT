import Dexie, { type Table } from 'dexie';
import type { SessionLog } from '@/shared/types';

export class AppDB extends Dexie {
  sessionLogs!: Table<SessionLog, number>;
  constructor() {
    super('timecontrol');
    this.version(1).stores({
      sessionLogs: '++id,[dayKey+phase],phase,dayKey,startedAt'
    });
  }
}

let _db: AppDB | null = null;

export function getDB(): AppDB {
  if (_db && typeof (_db as any).table === 'function') return _db;
  _db = new AppDB();
  return _db;
}

export async function loadBreaksForDay(dayKey: string) {
  const db = getDB();
  try {
    if (!db.isOpen()) await db.open();
    
    // Проверяем что sessionLogs существует
    if (!db.sessionLogs) {
      return [];
    }
    
    return await db.sessionLogs
      .where('[dayKey+phase]')
      .equals([dayKey, 'break'])
      .toArray();
  } catch {
    // fallback
    try {
      const all = await db.sessionLogs?.toArray() || [];
      return all.filter(x => x.dayKey === dayKey && x.phase === 'break');
    } catch {
      return [];
    }
  }
}

export async function nukeDB() {
  const db = getDB();
  await db.close();
  await new Promise<void>((res, rej) => {
    const req = indexedDB.deleteDatabase(db.name);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
  _db = null; // форсим пересоздание
  await getDB().open();
}
