import type { TimerState, Settings } from '@/shared/types';
import Logger from './logger';
import { notifyPhase } from './notify';

type InternalState = {
  phase: 'idle' | 'work' | 'break' | 'finished';
  finishAt: number; // ms timestamp
  paused: boolean;
  pausedAt?: number; // ms timestamp
  startedAt?: number; // ms timestamp
  workMin: number;
  breakMin: number;
};

let state: InternalState = { 
  phase: 'idle', 
  finishAt: 0, 
  paused: false, 
  workMin: 25, 
  breakMin: 5 
};

function getRemaining(): number {
  if (state.phase === 'idle' || state.phase === 'finished') return 0;
  if (state.paused && state.pausedAt) {
    return Math.max(0, state.finishAt - state.pausedAt);
  }
  return Math.max(0, state.finishAt - Date.now());
}

function getTimerState(): TimerState {
  return {
    phase: state.phase,
    remaining: Math.floor(getRemaining() / 1000), // convert to seconds
    paused: state.paused,
    startedAt: state.startedAt
  };
}

function ensureMinuteAlarm() {
  chrome.alarms.create('tick_minute', { periodInMinutes: 1 });
}

function createPhaseEndAlarm(finishAt: number) {
  chrome.alarms.create('phase_end', { when: finishAt });
}

function clearPhaseEndAlarm() {
  chrome.alarms.clear('phase_end');
}

export function emitTick(){ 
  chrome.runtime?.sendMessage?.({ type:'TIMER/TICK', state: getTimerState() }); 
}

export function startWork() {
  const durationMs = state.workMin * 60 * 1000;
  const finishAt = Date.now() + durationMs;
  
  state = { 
    ...state,
    phase: 'work', 
    finishAt, 
    paused: false, 
    startedAt: Date.now() 
  };
  
  createPhaseEndAlarm(finishAt);
  ensureMinuteAlarm();
  emitTick();
  Logger.log('INFO','startWork');
}

export function startBreak(minutes?: number){
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  const durationMs = (minutes ?? state.breakMin) * 60 * 1000;
  const finishAt = Date.now() + durationMs;
  
  state = { 
    ...state,
    phase: 'break', 
    finishAt, 
    paused: false, 
    startedAt: Date.now() 
  };
  
  createPhaseEndAlarm(finishAt);
  ensureMinuteAlarm();
  emitTick();
  Logger.log('INFO','startBreak');
  
  // Notify phase change if auto-transition
  if (prevPhase === 'work') {
    notifyPhase('work', finishedAt);
  }
}

export function pause() {
  if (state.phase === 'idle' || state.phase === 'finished') return;
  if (getRemaining() <= 0) return;
  
  state.paused = true;
  state.pausedAt = Date.now();
  clearPhaseEndAlarm();
  emitTick();
}

export function resume() {
  if (state.phase === 'idle' || state.phase === 'finished') return;
  if (getRemaining() <= 0) return;
  
  if (state.paused && state.pausedAt) {
    const pausedDuration = Date.now() - state.pausedAt;
    state.finishAt += pausedDuration;
    state.paused = false;
    state.pausedAt = undefined;
    createPhaseEndAlarm(state.finishAt);
    emitTick();
  }
}

export function stop(){ 
  state = { 
    phase: 'idle', 
    finishAt: 0, 
    paused: false, 
    workMin: state.workMin, 
    breakMin: state.breakMin 
  }; 
  clearPhaseEndAlarm();
  emitTick(); 
}

export function finish(){ 
  const prevPhase = state.phase;
  const finishedAt = Date.now();
  
  state = { 
    ...state,
    phase: 'finished', 
    finishAt: 0, 
    paused: false 
  }; 
  clearPhaseEndAlarm();
  emitTick(); 
  
  // Notify phase change if auto-transition
  if (prevPhase === 'break') {
    notifyPhase('break', finishedAt);
  }
}

export function getState(): TimerState {
  return getTimerState();
}

export function setSettings(s: Settings){ 
  state.workMin = s.workMin; 
  state.breakMin = s.breakMin; 
}

// Синхронизация состояния при перезапуске сервис-воркера
export function sync() {
  if (state.phase === 'idle' || state.phase === 'finished') return;
  
  // Пересчитываем remaining через finishAt
  const remaining = getRemaining();
  
  // Проверяем автопереход
  if (remaining <= 0) {
    if (state.phase === 'work') {
      startBreak();
      return;
    }
    if (state.phase === 'break') {
      finish();
      return;
    }
  }
  
  // Эмитим тик для обновления UI
  emitTick();
}

// Обработчик alarm
export function handleAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name === 'tick_minute') {
    sync();
  } else if (alarm.name === 'phase_end') {
    // Автопереход
    if (state.phase === 'work') {
      startBreak();
    } else if (state.phase === 'break') {
      finish();
    }
  }
}

// Инициализация
export function init() {
  chrome.alarms.onAlarm.addListener(handleAlarm);
  
  // Синхронизируем состояние при старте
  sync();
}
