import type { TimerState, Settings } from '@/shared/types';
import Logger from './logger';
import { notifyPhase } from './notify';

let state: TimerState = { phase:'idle', remaining:0, paused:false };
let settings: Settings = { workMin: 25, breakMin: 5, strict: true };
let interval: number | undefined;

function autoTransitionIfZero() {
  if (state.remaining <= 0) {
    if (state.phase === 'work') { startBreak(); return true; }
    if (state.phase === 'break') { finish(); return true; }
  }
  return false;
}

function tick() {
  // даже в паузе сначала проверяем нули и делаем автопереход
  if (autoTransitionIfZero()) return;

  if (state.phase === 'idle') return;
  if (state.paused) return;

  if (state.remaining > 0) state.remaining -= 1;

  // повторная проверка на случай перехода ровно на нуле
  if (autoTransitionIfZero()) return;

  emitTick();
}

function ensureInterval() {
  if (interval) return;
  // В тестовой среде тикаем каждые 1000мс для стабильности
  const isVitest = typeof globalThis !== 'undefined' && !!(globalThis as any).process?.env?.VITEST;
  const period = isVitest ? 1000 : 1000;
  interval = setInterval(tick, period) as unknown as number;
}

function clearIntervalIfIdle(){
  if (state.phase==='idle' && interval) { clearInterval(interval); interval = undefined; }
}

export function emitTick(){ chrome.runtime?.sendMessage?.({ type:'TIMER/TICK', state }); }

export function startWork() {
  state = { phase: 'work', remaining: settings.workMin * 60, paused: false, startedAt: Date.now() };
  ensureInterval();
  emitTick(); // immediate tick (без изменения remaining)
  Logger.log('INFO','startWork');
}

export function startBreak(minutes?: number){
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  
  state = { phase: 'break', remaining: (minutes ?? settings.breakMin) * 60, paused: false, startedAt: Date.now() };
  ensureInterval();
  emitTick();
  Logger.log('INFO','startBreak');
  
  // Notify phase change if auto-transition
  if (prevPhase === 'work') {
    notifyPhase('work', finishedAt);
  }
}

export function pause() {
  // при нуле пауза бессмысленна
  if (state.remaining <= 0) return;
  if (state.phase !== 'idle' && state.remaining > 0) {
    state.paused = true;
    emitTick();
  }
}

export function resume() {
  // при нуле резюм бессмысленен, но не вызываем автопереход
  if (state.remaining <= 0) return;
  if (state.phase !== 'idle' && state.remaining > 0) {
    state.paused = false;
    emitTick();
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

// ЛЕНИВЫЙ GUARD при чтении состояния (для теста "guard zero в паузе")
export function getState() {
  autoTransitionIfZero();
  return state; // возвращаем ссылку, не копию
}
export function setSettings(s: Settings){ settings = s; }
