import React, { useEffect, useState } from 'react';
import type { TimerState } from '@/shared/types';

export default function App(){
  const [state,setState] = useState<TimerState>({ phase:'idle', remaining:0, paused:false });

  useEffect(()=>{
    chrome.runtime.sendMessage({ type:'GET_STATE' }, (r)=>{ if(r?.ok) setState(r.data); });
    const onMsg = (m:any)=>{ if(m?.type==='TIMER/TICK') setState(m.state); };
    chrome.runtime.onMessage.addListener(onMsg);
    return ()=> chrome.runtime.onMessage.removeListener(onMsg);
  },[]);

  const cmd = (type:string, extra?:any) => chrome.runtime.sendMessage({ type, ...extra });

  const mm = Math.floor(state.remaining/60).toString().padStart(2,'0');
  const ss = Math.floor(state.remaining%60).toString().padStart(2,'0');

  return (
    <div className="w-[360px] box-border overflow-x-hidden p-4 space-y-3">
      <div className="text-5xl font-mono [font-variant-numeric:tabular-nums] leading-none text-center">
        {mm}:{ss}
      </div>
      <div className="grid grid-cols-3 gap-2 max-[340px]:grid-cols-2 min-w-0">
        <button 
          className="btn truncate" 
          onClick={()=>cmd('TIMER_START_WORK')}
        >
          Work
        </button>
        <button 
          className="btn truncate" 
          onClick={()=>cmd('TIMER_START_BREAK')}
        >
          Break
        </button>
        {state.paused
          ? <button 
              className="btn truncate" 
              onClick={()=>cmd('TIMER_RESUME')}
            >
              Resume
            </button>
          : <button 
              className="btn truncate" 
              onClick={()=>cmd('TIMER_PAUSE')}
            >
              Pause
            </button>}
        <button 
          className="btn truncate col-span-1" 
          onClick={()=>cmd('TIMER_STOP')}
        >
          Stop
        </button>
      </div>
      <style>{`
        .btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(0,0,0,0.2);
          border-radius: 0.5rem;
          background: white;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          min-width: 0;
        }
        .btn:hover {
          background: #f3f4f6;
          border-color: rgba(0,0,0,0.3);
        }
        .btn:active {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
