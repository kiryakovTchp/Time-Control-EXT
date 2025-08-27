export const formatDuration = (sec:number) =>
  !Number.isFinite(sec)||sec<0 ? '0s' :
  sec < 60 ? `${Math.floor(sec)}s` :
  sec < 3600 ? `${Math.floor(sec/60)}m` :
  (()=>{const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return m?`${h}h ${m}m`:`${h}h`;})();

export const formatPercent = (n:number) => `${n.toFixed(1)}%`;
