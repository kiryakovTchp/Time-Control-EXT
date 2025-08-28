import { vi } from 'vitest';

// Мок для chrome.storage.session
const sessionStorage = new Map();
const sessionStorageMock = {
  get: vi.fn((keys: string | string[]) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: sessionStorage.get(keys) });
    }
    const result: any = {};
    keys.forEach(key => {
      result[key] = sessionStorage.get(key);
    });
    return Promise.resolve(result);
  }),
  set: vi.fn((items: any) => {
    Object.entries(items).forEach(([key, value]) => {
      sessionStorage.set(key, value);
    });
    return Promise.resolve();
  }),
  remove: vi.fn((keys: string | string[]) => {
    if (typeof keys === 'string') {
      sessionStorage.delete(keys);
    } else {
      keys.forEach(key => sessionStorage.delete(key));
    }
    return Promise.resolve();
  })
};

// Мок для chrome.storage.local
const localStorage = new Map();
const localStorageMock = {
  get: vi.fn((keys: string | string[]) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: localStorage.get(keys) });
    }
    const result: any = {};
    keys.forEach(key => {
      result[key] = localStorage.get(key);
    });
    return Promise.resolve(result);
  }),
  set: vi.fn((items: any) => {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.set(key, value);
    });
    return Promise.resolve();
  })
};

// Мок для chrome.runtime
const runtimeMock = {
  sendMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
};

// Мок для chrome.notifications
const notificationsMock = {
  create: vi.fn(),
  clear: vi.fn()
};

// Глобальный мок chrome
(globalThis as any).chrome = {
  storage: {
    session: sessionStorageMock,
    local: localStorageMock
  },
  runtime: runtimeMock,
  notifications: notificationsMock
};

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
