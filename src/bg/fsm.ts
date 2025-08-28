import type { TimerState, Settings } from '@/shared/types';
import Logger from './logger';
import { notifyPhase } from './notify';

let state: TimerState = { phase:'idle', remaining:0, paused:false };
let settings: Settings = { workMin: 25, breakMin: 5, strict: true };
let interval: number | undefined;

function tick(){
  if (state.phase==='idle' || state.paused) return;
  if (state.remaining <= 0) return;
  
  state.remaining = state.remaining - 1;
  
  if (state.remaining === 0) {
    if (state.phase==='work') startBreak();
    else if (state.phase==='break') finish();
    return;
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

function guardZeroAndAuto() {
  if (state.remaining <= 0) {
    if (state.phase === 'work') { startBreak(); return true; }
    if (state.phase === 'break') { finish(); return true; }
    if (state.phase !== 'idle' && state.phase !== 'finished') { finish(); return true; }
  }
  return false;
}

export function emitTick(){ chrome.runtime?.sendMessage?.({ type:'TIMER/TICK', state }); }

export function startWork(){
  state = { phase:'work', remaining: settings.workMin*60, paused:false, startedAt: Date.now() };
  ensureInterval(); 
  emitTick(); // ← сразу
  Logger.log('INFO','startWork');
}

export function startBreak(minutes?: number){
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  
  state = { phase:'break', remaining: (minutes ?? settings.breakMin)*60, paused:false, startedAt: Date.now() };
  ensureInterval(); 
  emitTick(); // ← сразу
  Logger.log('INFO','startBreak');
  
  // Notify phase change if auto-transition
  if (prevPhase === 'work') {
    notifyPhase('work', finishedAt);
  }
}

export function pause(){ 
  if (state.remaining <= 0) return;
  if (state.phase!=='idle' && state.remaining>0){ 
    state.paused=true; 
    emitTick(); // немедленный тик
  } 
}

export function resume(){ 
  if (state.remaining <= 0) return;
  if (state.phase!=='idle' && state.remaining>0){ 
    state.paused=false; 
    emitTick(); // немедленный тик
  } 
}

export function stop(){ 
  state={ phase:'idle', remaining:0, paused:false }; 
  emitTick(); 
  clearIntervalIfIdle(); 
}

export function finish(){ 
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  
  state={ phase:'finished', remaining:0, paused:false }; 
  emitTick(); 
  
  // Notify phase change if auto-transition
  if (prevPhase === 'break') {
    notifyPhase('break', finishedAt);
  }
}

export function getState(){ return state; }
export function setSettings(s: Settings){ settings = s; }
