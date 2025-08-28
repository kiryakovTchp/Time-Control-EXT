import type { DomainsToday } from '@/shared/types';
import { getDomainStats } from './tracker';

export async function getTopDomainsToday(): Promise<DomainsToday> {
  // Get current domain stats from tracker
  const domainStats = getDomainStats();
  
  // Calculate total seconds
  const totalSecondsToday = Object.values(domainStats).reduce((sum, seconds) => sum + seconds, 0);
  
  // Convert to array and sort by seconds (descending)
  const items = Object.entries(domainStats)
    .map(([domain, seconds]) => ({
      domain,
      seconds,
      percent: totalSecondsToday > 0 ? +(seconds * 100 / totalSecondsToday).toFixed(1) : 0
    }))
    .sort((a, b) => b.seconds - a.seconds);
  
  return {
    totalSecondsToday,
    items
  };
}
