import type { TimerState, Settings } from '@/shared/types';
import Logger from './logger';
import { notifyPhase } from './notify';

let state: TimerState = { phase:'idle', remaining:0, paused:false };
let settings: Settings = { workMin: 25, breakMin: 5, strict: true };
let lastTickAt = Date.now();

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

function ensureAlarm() {
  chrome.alarms.create('timer_tick', { periodInMinutes: 1/60 });
}

function clearAlarm() {
  chrome.alarms.clear('timer_tick');
}

export function emitTick(){ chrome.runtime?.sendMessage?.({ type:'TIMER/TICK', state }); }

export function startWork() {
  state = { phase: 'work', remaining: settings.workMin * 60, paused: false, startedAt: Date.now() };
  lastTickAt = Date.now();
  ensureAlarm();
  emitTick(); // immediate tick (без изменения remaining)
  Logger.log('INFO','startWork');
}

export function startBreak(minutes?: number){
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  
  state = { phase: 'break', remaining: (minutes ?? settings.breakMin) * 60, paused: false, startedAt: Date.now() };
  lastTickAt = Date.now();
  ensureAlarm();
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
  lastTickAt = Date.now();
  clearAlarm();
  emitTick(); 
}

export function finish(){ 
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  
  state={ phase:'finished', remaining:0, paused:false }; 
  lastTickAt = Date.now();
  clearAlarm();
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

// Синхронизация состояния при перезапуске сервис-воркера
export function sync() {
  if (state.phase === 'idle' || state.phase === 'finished') return;
  
  const now = Date.now();
  const elapsed = Math.floor((now - lastTickAt) / 1000);
  
  if (elapsed > 0 && !state.paused) {
    const decrement = Math.min(elapsed, state.remaining);
    state.remaining -= decrement;
    lastTickAt = now;
    
    // Проверяем автопереход
    if (autoTransitionIfZero()) {
      // Автопереход произошел, эмитим тик
      emitTick();
    }
  }
}

// Обработчик alarm
export function handleAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name === 'timer_tick') {
    tick();
  }
}

// Инициализация
export function init() {
  chrome.alarms.onAlarm.addListener(handleAlarm);
  
  // Синхронизируем состояние при старте
  sync();
}
