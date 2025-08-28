
import { getTopDomainsToday } from './aggregator';
import { getDB, loadBreaksForDay, nukeDB } from './db';
import { getState, startWork, startBreak, pause, resume, stop, setSettings, sync } from './timerEngine';
import Logger from './logger';
import { markPopupPing } from './notify';

const DEFAULT_SETTINGS = { workMin: 25, breakMin: 5, strict: true };

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      let res: { ok: true; data: any } | { ok: false; error: string };
      switch (msg?.type) {
        case 'GET_STATE':
          res = { ok: true, data: getState() };
          break;
        case 'TIMER_START_WORK':
          startWork();
          res = { ok: true, data: true };
          break;
        case 'TIMER_START_BREAK':
          startBreak(msg?.minutes);
          res = { ok: true, data: true };
          break;
        case 'TIMER_PAUSE':
          pause();
          res = { ok: true, data: true };
          break;
        case 'TIMER_RESUME':
          resume();
          res = { ok: true, data: true };
          break;
        case 'TIMER_STOP':
          stop();
          res = { ok: true, data: true };
          break;
        case 'TIMER_SYNC':
          sync();
          res = { ok: true, data: true };
          break;
        case 'SETTINGS_GET': {
          const raw = await chrome.storage.local.get(['settings']);
          const s = raw?.settings ? { ...DEFAULT_SETTINGS, ...raw.settings } : DEFAULT_SETTINGS;
          res = { ok: true, data: { settings: s } };
          break;
        }
        case 'SETTINGS_SAVE': {
          const s = { ...DEFAULT_SETTINGS, ...(msg.settings || {}) };
          setSettings(s);
          await chrome.storage.local.set({ settings: s });
          chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: s });
          res = { ok: true, data: true };
          break;
        }
        case 'GET_TOP_DOMAINS_TODAY':
          res = { ok: true, data: await getTopDomainsToday() };
          break;
        case 'GET_BREAKS':
          const dayKey = msg?.dayKey ?? new Date().toISOString().slice(0, 10);
          res = { ok: true, data: await loadBreaksForDay(dayKey) };
          break;
        case 'NUKE_DB':
          await nukeDB();
          res = { ok: true, data: true };
          break;
        case 'DIAG_GET_RING':
          res = { ok: true, data: Logger.getRing() };
          break;
        case 'PING':
          markPopupPing();
          res = { ok: true, data: true };
          break;
        default:
          res = { ok: false, error: 'Unknown message' };
      }
      sendResponse(res);
    } catch (e: any) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();
  return true;
});
