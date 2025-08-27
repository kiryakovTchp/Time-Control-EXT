import type { TimerState, Settings } from '@/shared/types';
import Logger from './logger';

let state: TimerState = { phase:'idle', remaining:0, paused:false };
let settings: Settings = { workMin: 25, breakMin: 5, strict: true };
let interval: number | undefined;

function tick(){
  if (state.phase==='idle' || state.paused) return;
  state.remaining = Math.max(0, state.remaining - 1);
  if (state.remaining===0) {
    if (state.phase==='work') startBreak();
    else if (state.phase==='break') finish();
  }
  emitTick();
}
function ensureInterval(){
  if (interval) return;
  interval = setInterval(tick, 1000) as unknown as number;
}
function clearIntervalIfIdle(){
  if (state.phase==='idle' && interval) { clearInterval(interval); interval = undefined; }
}

export function emitTick(){ chrome.runtime?.sendMessage?.({ type:'TIMER/TICK', state }); }

export function startWork(){
  state = { phase:'work', remaining: settings.workMin*60, paused:false, startedAt: Date.now() };
  ensureInterval(); emitTick(); Logger.log('INFO','startWork');
}
export function startBreak(minutes?: number){
  state = { phase:'break', remaining: (minutes ?? settings.breakMin)*60, paused:false, startedAt: Date.now() };
  ensureInterval(); emitTick(); Logger.log('INFO','startBreak');
}
export function pause(){ if (state.phase!=='idle' && state.remaining>0){ state.paused=true; emitTick(); } }
export function resume(){ if (state.phase!=='idle' && state.remaining>0){ state.paused=false; emitTick(); } }
export function stop(){ state={ phase:'idle', remaining:0, paused:false }; emitTick(); clearIntervalIfIdle(); }
export function finish(){ state={ phase:'finished', remaining:0, paused:false }; emitTick(); }
export function getState(){ return state; }
export function setSettings(s: Settings){ settings = s; }
