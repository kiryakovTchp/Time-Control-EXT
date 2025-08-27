import type { DomainsToday } from '@/shared/types';

export async function getTopDomainsToday(): Promise<DomainsToday> {
  // TODO: реальный сбор. Заглушка контракта:
  return { totalSecondsToday: 180, items: [
    { domain: 'example.com', seconds: 120, percent: +(120*100/180).toFixed(1) },
    { domain: 'another.com', seconds: 60, percent: +(60*100/180).toFixed(1) },
  ]};
}
