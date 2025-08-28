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
    return await db.sessionLogs.where('[dayKey+phase]').equals([dayKey,'break']).toArray();
  } catch {
    const all = await db.sessionLogs.toArray();
    return all.filter(r => r.dayKey === dayKey && r.phase === 'break');
  }
}
export async function nukeDB(){
  await db.close(); 
  await Dexie.delete(db.name);  // важно: статический метод класса Dexie
  await db.open();
}
