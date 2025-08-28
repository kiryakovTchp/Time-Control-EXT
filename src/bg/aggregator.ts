import type { DomainsToday } from '@/shared/types';
import { getDomainStats } from './tracker';

export async function getTopDomainsToday(): Promise<DomainsToday> {
  // Get current domain stats from tracker
  const domainStats = getDomainStats();
  
  // Convert to array and sort by seconds (descending)
  const items = Object.entries(domainStats)
    .map(([domain, seconds]) => ({
      domain,
      seconds,
      percent: 0 // will be calculated below
    }))
    .sort((a, b) => b.seconds - a.seconds);
  
  // Calculate total and percentages
  const total = items.reduce((s, i) => s + i.seconds, 0) || 0;
  
  return {
    totalSecondsToday: total,
    items: items.map(i => ({ 
      ...i, 
      percent: total ? +(i.seconds * 100 / total).toFixed(1) : 0 
    }))
  };
}
