import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { startWork, startBreak, pause, resume, stop, getState, init } from '../src/bg/timerEngine';

describe('FSM Timer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset state
    stop();
    
    // Инициализируем timerEngine для регистрации alarm listener
    init();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start work timer', () => {
    startWork();
    const state = getState();
    expect(state.phase).toBe('work');
    expect(state.remaining).toBe(25 * 60); // 25 minutes default
    expect(state.paused).toBe(false);
    expect(state.startedAt).toBeDefined();
  });

  it('should start break timer', () => {
    startBreak();
    const state = getState();
    expect(state.phase).toBe('break');
    expect(state.remaining).toBe(5 * 60); // 5 minutes default
    expect(state.paused).toBe(false);
  });

  it('should pause and resume timer', () => {
    startWork();
    pause();
    expect(getState().paused).toBe(true);

    resume();
    expect(getState().paused).toBe(false);
  });

  it('should stop timer', () => {
    startWork();
    stop();
    const state = getState();
    expect(state.phase).toBe('idle');
    expect(state.remaining).toBe(0);
    expect(state.paused).toBe(false);
  });

  it('should tick and decrease remaining time', () => {
    startWork();
    const initialState = getState();
    
    // Advance time by 1 minute
    vi.advanceTimersByTime(60 * 1000);
    
    // Trigger minute alarm
    (globalThis as any).triggerAlarm('tick_minute');
    
    // Get state after tick
    const stateAfterTick = getState();
    
    // Check that remaining time decreased by 60 seconds
    expect(stateAfterTick.remaining).toBe(initialState.remaining - 60);
  });

  it('should not tick when paused', () => {
    startWork();
    pause();
    const initialState = getState();

    // Advance time by 1 minute
    vi.advanceTimersByTime(60 * 1000);
    
    // Trigger minute alarm
    (globalThis as any).triggerAlarm('tick_minute');
    
    const stateAfterTick = getState();

    expect(stateAfterTick.remaining).toBe(initialState.remaining);
  });

  it('should auto-transition from work to break when phase_end triggered', () => {
    startWork();
    
    // Trigger phase_end alarm
    (globalThis as any).triggerAlarm('phase_end');
    
    const newState = getState();
    expect(newState.phase).toBe('break');
    expect(newState.remaining).toBe(5 * 60);
  });

  it('should auto-transition from break to finished when phase_end triggered', () => {
    startBreak();
    
    // Trigger phase_end alarm
    (globalThis as any).triggerAlarm('phase_end');
    
    const newState = getState();
    expect(newState.phase).toBe('finished');
    expect(newState.remaining).toBe(0);
  });

  it('should emit TIMER/TICK after any command', () => {
    const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage');

    startWork();
    expect(sendMessageSpy).toHaveBeenCalledWith({ type: 'TIMER/TICK', state: getState() });

    pause();
    expect(sendMessageSpy).toHaveBeenCalledWith({ type: 'TIMER/TICK', state: getState() });

    resume();
    expect(sendMessageSpy).toHaveBeenCalledWith({ type: 'TIMER/TICK', state: getState() });

    stop();
    expect(sendMessageSpy).toHaveBeenCalledWith({ type: 'TIMER/TICK', state: getState() });
  });

  it('should not allow pause when remaining <= 0', () => {
    startWork();
    
    // Устанавливаем remaining = 0 через прямую манипуляцию состояния
    const state = getState();
    state.remaining = 0;

    pause();
    expect(getState().paused).toBe(false);
  });

  it('should not allow resume when remaining <= 0', () => {
    startWork();
    
    // Устанавливаем remaining = 0 через прямую манипуляцию состояния
    const state = getState();
    state.remaining = 0;
    state.paused = true;

    resume();
    // При remaining <= 0 resume не должен менять состояние
    expect(getState().paused).toBe(true);
  });

  it('should handle pause and resume correctly', () => {
    startWork();
    const initialState = getState();
    
    // Pause
    pause();
    expect(getState().paused).toBe(true);
    
    // Advance time by 30 seconds
    vi.advanceTimersByTime(30 * 1000);
    
    // Resume
    resume();
    expect(getState().paused).toBe(false);
    
    // Check that remaining time accounts for pause
    const finalState = getState();
    expect(finalState.remaining).toBe(initialState.remaining - 30);
  });
});
