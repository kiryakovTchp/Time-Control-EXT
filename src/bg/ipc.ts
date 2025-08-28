import type { RpcResponse, Settings } from '@/shared/types';
import { getTopDomainsToday } from './aggregator';
import { loadBreaksForDay, nukeDB } from './db';
import { getState, startWork, startBreak, pause, resume, stop, setSettings } from './fsm';
import Logger from './logger';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      let res: RpcResponse<any>;
      switch (msg?.type) {
        case 'GET_STATE': res = { ok:true, data: getState() }; break;
        case 'TIMER_START_WORK': startWork(); res = { ok:true, data:true }; break;
        case 'TIMER_START_BREAK': startBreak(msg?.minutes); res = { ok:true, data:true }; break;
        case 'TIMER_PAUSE': pause(); res = { ok:true, data:true }; break;
        case 'TIMER_RESUME': resume(); res = { ok:true, data:true }; break;
        case 'TIMER_STOP': stop(); res = { ok:true, data:true }; break;
        case 'SETTINGS_GET': res = { ok:true, data: await chrome.storage.local.get(['settings']) }; break;
        case 'SETTINGS_SAVE':
          setSettings((msg.settings as Settings));
          await chrome.storage.local.set({ settings: msg.settings });
          chrome.runtime.sendMessage({ type:'SETTINGS_UPDATED', settings: msg.settings });
          res = { ok:true, data:true };
          break;
        case 'GET_TOP_DOMAINS_TODAY': res = { ok:true, data: await getTopDomainsToday() }; break;
        case 'GET_BREAKS':
          const dayKey = msg?.dayKey ?? new Date().toISOString().slice(0,10);
          res = { ok:true, data: await loadBreaksForDay(dayKey) }; break;
        case 'NUKE_DB': await nukeDB(); res = { ok:true, data:true }; break;
        case 'DIAG_GET_RING': res = { ok:true, data: Logger.getRing() }; break;
        default: res = { ok:false, error:'Unknown message' };
      }
      sendResponse(res);
    } catch (e:any) {
      sendResponse({ ok:false, error: String(e?.message||e) });
    }
  })();
  return true;
});
