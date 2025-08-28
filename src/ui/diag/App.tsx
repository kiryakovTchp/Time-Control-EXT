import React, { useState, useEffect } from 'react';

type LogEntry = {
  ts: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  msg: string;
  data?: any;
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    chrome.runtime.sendMessage({ type: 'DIAG_GET_RING' }, (r) => {
      if (r?.ok) {
        setLogs(r.data || []);
      }
      setLoading(false);
    });
  };

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

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-control-logs-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => 
    filter === 'ALL' || log.level === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Time Control Diagnostics</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={loadLogs}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh Logs
            </button>
            <button
              onClick={clearLogs}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Logs
            </button>
            <button
              onClick={exportLogs}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Export JSON
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Logs</h2>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="ALL">All Levels</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="ERROR">Error</option>
              </select>
              <span className="text-sm text-gray-500">
                {filteredLogs.length} of {logs.length} logs
              </span>
            </div>
          </div>
          
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500">No logs available</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.map((log, index) => (
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
                  <div className="mt-1 text-sm break-words">{log.msg}</div>
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
