let lastKey: string | undefined;
let lastAt = 0;
let popupPingAt = 0;

export function markPopupPing() { 
  popupPingAt = Date.now(); 
}

export async function notifyPhase(prevPhase: 'work'|'break', finishedAt: number) {
  const now = Date.now();
  const key = `${prevPhase}:${finishedAt}`;
  
  if (now - popupPingAt < 5000) return;            // mute при активном попапе
  if (key === lastKey && now - lastAt < 10000) return; // throttle 10s
  
  lastKey = key; 
  lastAt = now;

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: prevPhase === 'work' ? 'Время на перерыв' : 'Поехали работать',
    message: prevPhase === 'work' ? 'Смена фазы: break' : 'Смена фазы: work'
  });
}

// Legacy function for backward compatibility
export async function notifyOnce(key: string, title: string, message: string){
  const now = Date.now();
  if (lastKey===key && now-lastAt<10000) return;
  lastKey = key; lastAt = now;
  await chrome.notifications.create({ type:'basic', iconUrl:'icons/icon48.png', title, message });
}
