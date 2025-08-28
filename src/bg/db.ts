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
export const db = new AppDB();

export async function loadBreaksForDay(dayKey: string) {
  try {
    if (!db.isOpen()) await db.open();
    // не полагаться на свойство, всегда брать через table(...)
    return await db.table('sessionLogs')
      .where('[dayKey+phase]')
      .equals([dayKey, 'break'])
      .toArray();
  } catch {
    // fallback без индекса
    const all = await db.table('sessionLogs').toArray();
    return all.filter(r => r.dayKey === dayKey && r.phase === 'break');
  }
}

export async function nukeDB() {
  await db.close();
  await new Promise<void>((res, rej) => {
    const req = indexedDB.deleteDatabase(db.name);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
  await db.open();
}
