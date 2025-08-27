export type Phase = 'idle' | 'work' | 'break' | 'finished';
export type TimerState = { phase: Phase; remaining: number; paused: boolean; startedAt?: number };
export type Settings = { workMin: number; breakMin: number; strict: boolean };

export type SessionLog = {
  id?: number;
  dayKey: string;
  phase: 'work'|'break';
  startedAt: number;
  endedAt?: number;
};

export type DomainsToday = {
  totalSecondsToday: number;
  items: Array<{ domain: string; seconds: number; percent: number }>;
};

export type RpcResponse<T=unknown> = { ok: true; data: T } | { ok: false; error: string };
