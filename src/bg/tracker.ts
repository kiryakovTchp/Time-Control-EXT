import Logger from './logger';

type TabData = {
  domain: string;
  startTime: number;
  lastActive: number;
};

type DomainStats = {
  [domain: string]: number; // seconds
};

let isTracking = false;
let currentTab: TabData | null = null;
let domainStats: DomainStats = {};
let debounceTimer: number | undefined;
let lastUpdateTime = Date.now();

// Debounce function
function debounce(func: Function, delay: number) {
  return function(...args: any[]) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => func.apply(null, args), delay) as unknown as number;
  };
}

// Update domain stats
function updateDomainStats() {
  if (!currentTab) return;
  
  const now = Date.now();
  const elapsed = Math.floor((now - lastUpdateTime) / 1000);
  
  if (elapsed > 0) {
    domainStats[currentTab.domain] = (domainStats[currentTab.domain] || 0) + elapsed;
    currentTab.lastActive = now;
    lastUpdateTime = now;
    
    Logger.log('DEBUG', 'Domain stats updated', { 
      domain: currentTab.domain, 
      elapsed, 
      total: domainStats[currentTab.domain] 
    });
  }
}

// Debounced update function
const debouncedUpdate = debounce(updateDomainStats, 1000);

// Tab activation handler
function handleTabActivated(activeInfo: any) {
  if (!isTracking) return;
  
  // Update previous tab stats
  updateDomainStats();
  
  // Get new tab info
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab.url) return;
    
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      currentTab = {
        domain,
        startTime: Date.now(),
        lastActive: Date.now()
      };
      
      lastUpdateTime = Date.now();
      
      Logger.log('INFO', 'Tab activated', { domain, tabId: activeInfo.tabId });
    } catch (e) {
      Logger.log('WARN', 'Invalid URL', { url: tab.url, error: e });
    }
  });
}

// Tab update handler
function handleTabUpdated(tabId: number, changeInfo: any, tab: chrome.tabs.Tab) {
  if (!isTracking || !changeInfo.url || tabId !== tab.id) return;
  
  // Update previous tab stats
  updateDomainStats();
  
  try {
    const url = new URL(changeInfo.url);
    const domain = url.hostname;
    
    currentTab = {
      domain,
      startTime: Date.now(),
      lastActive: Date.now()
    };
    
    lastUpdateTime = Date.now();
    
    Logger.log('INFO', 'Tab updated', { domain, tabId, url: changeInfo.url });
  } catch (e) {
    Logger.log('WARN', 'Invalid URL', { url: changeInfo.url, error: e });
  }
}

// Window focus handler
function handleWindowFocusChanged(_windowId: number) {
  if (!isTracking) return;
  
  // Update stats when window gains focus
  debouncedUpdate();
}

export function startTabTracking() {
  if (isTracking) return;
  
  isTracking = true;
  domainStats = {};
  lastUpdateTime = Date.now();
  
  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);
        currentTab = {
          domain: url.hostname,
          startTime: Date.now(),
          lastActive: Date.now()
        };
        
        Logger.log('INFO', 'Tab tracking started', { domain: url.hostname });
      } catch (e) {
        Logger.log('WARN', 'Invalid initial URL', { url: tabs[0].url, error: e });
      }
    }
  });
  
  // Add listeners
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);
  chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);
  
  Logger.log('INFO', 'Tab tracking started');
}

export function stopTabTracking() {
  if (!isTracking) return;
  
  // Update final stats
  updateDomainStats();
  
  isTracking = false;
  currentTab = null;
  
  // Clear debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  
  // Remove listeners
  chrome.tabs.onActivated.removeListener(handleTabActivated);
  chrome.tabs.onUpdated.removeListener(handleTabUpdated);
  chrome.windows.onFocusChanged.removeListener(handleWindowFocusChanged);
  
  Logger.log('INFO', 'Tab tracking stopped', { finalStats: domainStats });
}

export function getDomainStats(): DomainStats {
  // Update current tab stats before returning
  updateDomainStats();
  return { ...domainStats };
}

export function clearDomainStats() {
  domainStats = {};
  Logger.log('INFO', 'Domain stats cleared');
}
