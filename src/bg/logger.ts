type Level = 'DEBUG'|'INFO'|'WARN'|'ERROR';
const ring: any[] = [];
export const Logger = {
  log(level:Level, msg:string, data?:any) {
    const entry = { ts: Date.now(), level, msg, data };
    ring.push(entry); if (ring.length>500) ring.shift();
    try { if (chrome?.storage?.session?.set) chrome.storage.session.set({ lastLog: entry }); } catch {}
    if (level!=='DEBUG') console[level==='ERROR'?'error':level==='WARN'?'warn':'log'](msg, data);
  },
  getRing(){ return ring.slice(-200); }
};
export default Logger;
