export function parseMinutes(raw: string, min=1, max=180) {
  const cleaned = String(raw ?? '').trim().replace(/,/g,'.').replace(/[^0-9.]/g,'');
  if (!cleaned) return { ok:false as const, reason:'empty' as const };
  const value = Math.floor(parseFloat(cleaned));
  if (!Number.isFinite(value)) return { ok:false as const, reason:'invalid' as const };
  if (value < min || value > max) return { ok:false as const, reason:'range' as const };
  return { ok:true as const, value };
}
