import React, { useState, useEffect } from 'react';

export default function App() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Получаем логи из chrome.storage.session
    chrome.storage.session.get(['lastLog'], (result) => {
      if (result.lastLog) {
        setLogs([result.lastLog]);
      }
    });
  }, []);

  const clearLogs = () => {
    chrome.storage.session.remove(['lastLog']);
    setLogs([]);
  };

  const nukeDB = () => {
    chrome.runtime.sendMessage({ type: 'NUKE_DB' }, (r) => {
      if (r?.ok) {
        alert('Database cleared!');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Time Control Diagnostics</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={clearLogs}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Logs
            </button>
            <button
              onClick={nukeDB}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
            >
              Nuke Database
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Logs</h2>
          
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs available</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="font-mono text-sm">
                      <span className={`font-bold ${
                        log.level === 'ERROR' ? 'text-red-600' :
                        log.level === 'WARN' ? 'text-yellow-600' :
                        log.level === 'INFO' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {new Date(log.ts).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-sm">{log.msg}</div>
                  {log.data && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
