import React, { useState, useEffect } from 'react';
import type { Settings } from '@/shared/types';

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({ workMin: 25, breakMin: 5, strict: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'SETTINGS_GET' }, (r) => {
      if (r?.ok && r.data?.settings) {
        setSettings(r.data.settings);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.runtime.sendMessage({ type: 'SETTINGS_SAVE', settings }, (r) => {
      if (r?.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold">Timer Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={settings.workMin}
            onChange={(e) => setSettings({ ...settings, workMin: parseInt(e.target.value) || 25 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Break Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={settings.breakMin}
            onChange={(e) => setSettings({ ...settings, breakMin: parseInt(e.target.value) || 5 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="strict"
            checked={settings.strict}
            onChange={(e) => setSettings({ ...settings, strict: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="strict" className="ml-2 block text-sm text-gray-900">
            Strict mode (auto-advance phases)
          </label>
        </div>
      </div>
      
      <button
        onClick={handleSave}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
