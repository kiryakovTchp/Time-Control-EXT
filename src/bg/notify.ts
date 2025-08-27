let lastKey: string|undefined;
let lastAt = 0;

export async function notifyOnce(key: string, title: string, message: string){
  const now = Date.now();
  if (lastKey===key && now-lastAt<10000) return;
  lastKey = key; lastAt = now;
  await chrome.notifications.create({ type:'basic', iconUrl:'icons/icon48.png', title, message });
}
