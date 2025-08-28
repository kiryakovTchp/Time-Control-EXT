import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTopDomainsToday } from '../src/bg/aggregator';
import * as tracker from '../src/bg/tracker';

// Mock tracker module
vi.mock('../src/bg/tracker', () => ({
  getDomainStats: vi.fn()
}));

describe('Aggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate percentages correctly', async () => {
    // Mock domain stats: 120 seconds example.com, 60 seconds another.com
    const mockStats = {
      'example.com': 120,
      'another.com': 60
    };
    
    vi.mocked(tracker.getDomainStats).mockReturnValue(mockStats);
    
    const result = await getTopDomainsToday();
    
    expect(result.totalSecondsToday).toBe(180);
    expect(result.items).toHaveLength(2);
    
    // Check first item (example.com - 120 seconds)
    expect(result.items[0]).toEqual({
      domain: 'example.com',
      seconds: 120,
      percent: 66.7 // 120/180 * 100 = 66.666... rounded to 66.7
    });
    
    // Check second item (another.com - 60 seconds)
    expect(result.items[1]).toEqual({
      domain: 'another.com',
      seconds: 60,
      percent: 33.3 // 60/180 * 100 = 33.333... rounded to 33.3
    });
  });

  it('should handle empty stats', async () => {
    vi.mocked(tracker.getDomainStats).mockReturnValue({});
    
    const result = await getTopDomainsToday();
    
    expect(result.totalSecondsToday).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('should handle single domain', async () => {
    const mockStats = {
      'example.com': 100
    };
    
    vi.mocked(tracker.getDomainStats).mockReturnValue(mockStats);
    
    const result = await getTopDomainsToday();
    
    expect(result.totalSecondsToday).toBe(100);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      domain: 'example.com',
      seconds: 100,
      percent: 100.0
    });
  });

  it('should sort by seconds descending', async () => {
    const mockStats = {
      'small.com': 10,
      'large.com': 100,
      'medium.com': 50
    };
    
    vi.mocked(tracker.getDomainStats).mockReturnValue(mockStats);
    
    const result = await getTopDomainsToday();
    
    expect(result.items[0].domain).toBe('large.com');
    expect(result.items[1].domain).toBe('medium.com');
    expect(result.items[2].domain).toBe('small.com');
  });

  it('should round percentages to 1 decimal place', async () => {
    const mockStats = {
      'domain1.com': 33,
      'domain2.com': 67
    };
    
    vi.mocked(tracker.getDomainStats).mockReturnValue(mockStats);
    
    const result = await getTopDomainsToday();
    
    expect(result.items[0].percent).toBe(67.0); // 67/100 * 100 = 67.0
    expect(result.items[1].percent).toBe(33.0); // 33/100 * 100 = 33.0
  });
});
