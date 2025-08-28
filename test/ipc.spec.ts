import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('IPC Handlers', () => {
  let messageListener: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset storage
    chrome.storage.local.set({});
    chrome.storage.session.set({});
    
    // Capture the message listener when it's registered
    (chrome.runtime.onMessage.addListener as any).mockImplementation((listener: any) => {
      messageListener = listener;
    });
  });

  it('should handle GET_STATE', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'GET_STATE' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    // Simulate message
    const result = messageListener(message, {}, sendResponse);
    
    // Wait for async response
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true); // listener returns true for async
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.objectContaining({
        phase: 'idle',
        remaining: 0,
        paused: false
      })
    });
  });

  it('should handle SETTINGS_GET', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'SETTINGS_GET' };
    
    // Set some settings
    await chrome.storage.local.set({ settings: { workMin: 30, breakMin: 10, strict: false } });
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: { settings: { workMin: 30, breakMin: 10, strict: false } }
    });
  });

  it('should handle SETTINGS_SAVE', async () => {
    const sendResponse = vi.fn();
    const settings = { workMin: 45, breakMin: 15, strict: true };
    const message = { type: 'SETTINGS_SAVE', settings };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: true
    });
    
    // Check that settings were saved
    const saved = await chrome.storage.local.get(['settings']);
    expect(saved.settings).toEqual(settings);
  });

  it('should handle unknown message', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'UNKNOWN_MESSAGE' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: 'Unknown message'
    });
  });

  it('should handle TIMER_START_WORK', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'TIMER_START_WORK' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: true
    });
  });

  it('should handle TIMER_START_BREAK', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'TIMER_START_BREAK', minutes: 10 };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: true
    });
  });

  it('should handle GET_TOP_DOMAINS_TODAY', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'GET_TOP_DOMAINS_TODAY' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.objectContaining({
        totalSecondsToday: 0,
        items: expect.any(Array)
      })
    });
  });

  it('should handle GET_BREAKS', async () => {
    const sendResponse = vi.fn();
    const dayKey = '2024-01-01';
    const message = { type: 'GET_BREAKS', dayKey };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.any(Array)
    });
  });

  it('should handle NUKE_DB', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'NUKE_DB' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: true
    });
  });

  it('should handle DIAG_GET_RING', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'DIAG_GET_RING' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.any(Array)
    });
  });

  it('should handle PING', async () => {
    const sendResponse = vi.fn();
    const message = { type: 'PING' };
    
    // Import and trigger IPC handler
    await import('../src/bg/ipc');
    
    const result = messageListener(message, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: true
    });
  });
});
