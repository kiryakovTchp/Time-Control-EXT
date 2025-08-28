import { useState } from 'react';
import SettingsTab from './SettingsTab';
import BreaksTab from './BreaksTab';

export default function App(){
  const [tab, setTab] = useState<'settings'|'breaks'>('settings');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Time Control Settings</h1>
        
        <div className="flex space-x-1 mb-6">
          <button 
            className={`px-4 py-2 rounded ${tab === 'settings' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`px-4 py-2 rounded ${tab === 'breaks' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setTab('breaks')}
          >
            Breaks
          </button>
        </div>
        
        {tab === 'settings' ? <SettingsTab /> : <BreaksTab />}
      </div>
    </div>
  );
}
