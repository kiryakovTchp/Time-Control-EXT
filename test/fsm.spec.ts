import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { startWork, startBreak, pause, resume, stop, getState } from '../src/bg/fsm';

describe('FSM Timer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset state
    stop();
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
    
    // Advance timer by 1100ms to ensure tick happens
    vi.advanceTimersByTime(1100);
    
    // Get state after tick
    const stateAfterTick = getState();
    
    // Check that remaining time decreased by 1
    expect(stateAfterTick.remaining).toBe(initialState.remaining - 1);
  });

  it('should not tick when paused', () => {
    startWork();
    pause();
    const initialState = getState();
    
    vi.advanceTimersByTime(1000);
    const stateAfterTick = getState();
    
    expect(stateAfterTick.remaining).toBe(initialState.remaining);
  });

  it('should auto-transition from work to break when remaining reaches 0', () => {
    startWork();
    // Set remaining to 1 second
    const state = getState();
    state.remaining = 1;
    
    vi.advanceTimersByTime(1000);
    const newState = getState();
    
    expect(newState.phase).toBe('break');
    expect(newState.remaining).toBe(5 * 60);
  });

  it('should auto-transition from break to finished when remaining reaches 0', () => {
    startBreak();
    // Set remaining to 1 second
    const state = getState();
    state.remaining = 1;
    
    vi.advanceTimersByTime(1000);
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
    const state = getState();
    state.remaining = 0;
    
    pause();
    expect(getState().paused).toBe(false);
  });

  it('should not allow resume when remaining <= 0', () => {
    startWork();
    const state = getState();
    state.remaining = 0;
    state.paused = true;
    
    resume();
    expect(getState().paused).toBe(true);
  });

  it('should guard zero - not stay in paused when remaining <= 0', () => {
    startWork();
    const state = getState();
    state.remaining = 0;
    state.paused = true;
    
    // This should trigger guardZero and transition to break
    pause();
    
    const newState = getState();
    expect(newState.phase).toBe('break');
    expect(newState.paused).toBe(false);
  });
});
