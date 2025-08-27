import React, { useState, useEffect } from 'react';
import type { SessionLog } from '@/shared/types';
import { formatDuration } from '@/shared/format';

export default function BreaksTab() {
  const [breaks, setBreaks] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dayKey = new Date().toISOString().slice(0, 10);
    chrome.runtime.sendMessage({ type: 'GET_BREAKS', dayKey }, (r) => {
      if (r?.ok) {
        setBreaks(r.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Breaks</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Today's Breaks</h2>
      
      {breaks.length === 0 ? (
        <div className="text-gray-500">No breaks recorded today</div>
      ) : (
        <div className="space-y-2">
          {breaks.map((breakItem, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <div className="font-medium">
                  {new Date(breakItem.startedAt).toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-500">
                  {breakItem.endedAt 
                    ? `Duration: ${formatDuration((breakItem.endedAt - breakItem.startedAt) / 1000)}`
                    : 'In progress...'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
