import 'fake-indexeddb/auto';
import { vi } from 'vitest';

const mem = new Map<string, any>();
const alarms = new Map<string, any>();
let alarmListener: any;

(globalThis as any).chrome = {
  storage: {
    session: {
      _s: new Map<string, any>(),
      async get(k: string | string[]) {
        if (Array.isArray(k)) {
          const out: any = {};
          k.forEach(key => out[key] = (this as any)._s.get(key));
          return out;
        }
        return { [k]: (this as any)._s.get(k) };
      },
      async set(o: Record<string, any>) {
        Object.entries(o).forEach(([k, v]) => (this as any)._s.set(k, v));
      },
      async remove(k: string) {
        (this as any)._s.delete(k);
      }
    },
    local: {
      async get(keys: any) {
        if (!keys) return Object.fromEntries(mem);
        if (Array.isArray(keys)) {
          const out: any = {};
          keys.forEach(k => out[k] = mem.get(k));
          return out;
        }
        if (typeof keys === 'string') return { [keys]: mem.get(keys) };
        // object with defaults
        const out: any = { ...keys };
        Object.keys(keys).forEach(k => { if (mem.has(k)) out[k] = mem.get(k); });
        return out;
      },
      async set(obj: Record<string, any>) {
        Object.entries(obj).forEach(([k, v]) => mem.set(k, v));
      }
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onStartup: {
      addListener: vi.fn()
    },
    onInstalled: {
      addListener: vi.fn()
    }
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn()
  },
  alarms: {
    create: vi.fn().mockImplementation((name: string, opts: any) => {
      alarms.set(name, opts);
    }),
    clear: vi.fn().mockImplementation((name: string) => {
      alarms.delete(name);
    }),
    onAlarm: {
      addListener: vi.fn().mockImplementation((fn: any) => {
        alarmListener = fn;
      })
    }
  }
} as any;

// Helper для триггера alarms в тестах
(globalThis as any).triggerAlarm = (name: string) => {
  if (alarmListener) {
    alarmListener({ name });
  }
};

// Мок для Dexie
const dbMock = {
  sessionLogs: {
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue(1)
  },
  close: vi.fn().mockResolvedValue(undefined),
  open: vi.fn().mockResolvedValue(undefined),
  isOpen: vi.fn().mockReturnValue(true),
  name: 'timecontrol'
};

vi.mock('dexie', () => ({
  default: vi.fn().mockImplementation(() => ({
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis(),
    upgrade: vi.fn().mockReturnThis(),
    sessionLogs: dbMock.sessionLogs,
    close: dbMock.close,
    open: dbMock.open,
    isOpen: dbMock.isOpen,
    name: dbMock.name
  })),
  delete: vi.fn().mockResolvedValue(undefined)
}));

// Гарантируем что getDB().sessionLogs возвращает объект
vi.mock('../src/bg/db', async () => {
  const actual = await vi.importActual('../src/bg/db');
  return {
    ...actual,
    getDB: () => ({
      sessionLogs: dbMock.sessionLogs,
      close: dbMock.close,
      open: dbMock.open,
      isOpen: dbMock.isOpen,
      name: dbMock.name
    })
  };
});
