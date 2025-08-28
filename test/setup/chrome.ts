import { vi } from 'vitest';

// Глобальный мок chrome
(globalThis as any).chrome = {
  storage: {
    session: {
      _s: new Map<string, any>(),
      get: (k: string) => Promise.resolve({ [k]: (chrome.storage.session as any)._s.get(k) }),
      set: (o: Record<string, any>) => { 
        Object.entries(o).forEach(([k,v]) => (chrome.storage.session as any)._s.set(k, v)); 
        return Promise.resolve(); 
      },
      remove: (k: string) => { 
        (chrome.storage.session as any)._s.delete(k); 
        return Promise.resolve(); 
      }
    },
    local: { 
      get: async () => ({}), 
      set: async () => {} 
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { 
      addListener: vi.fn(), 
      removeListener: vi.fn() 
    }
  },
  notifications: { 
    create: vi.fn(), 
    clear: vi.fn() 
  },
} as any;

// Мок для Dexie
const dbMock = {
  sessionLogs: {
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([])
  },
  close: vi.fn().mockResolvedValue(undefined),
  open: vi.fn().mockResolvedValue(undefined)
};

vi.mock('dexie', () => ({
  default: vi.fn().mockImplementation(() => ({
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis(),
    sessionLogs: dbMock.sessionLogs,
    close: dbMock.close,
    open: dbMock.open
  })),
  delete: vi.fn().mockResolvedValue(undefined)
}));
