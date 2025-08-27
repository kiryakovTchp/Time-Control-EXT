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
    return await db.sessionLogs.where('[dayKey+phase]').equals([dayKey,'break']).toArray();
  } catch {
    const all = await db.sessionLogs.where('dayKey').equals(dayKey).toArray();
    return all.filter(r=>r.phase==='break');
  }
}
export async function nukeDB(){
  await db.close(); await Dexie.delete('timecontrol'); await db.open();
}
