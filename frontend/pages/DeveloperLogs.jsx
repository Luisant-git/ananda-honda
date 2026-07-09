import React, { useState, useEffect } from 'react';
import { serviceJobCardApi } from '../api/serviceJobcard';
import toast from 'react-hot-toast';

const DeveloperLogs = () => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await serviceJobCardApi.getDeveloperLogs();
      setLogs(response.logs || 'No logs available.');
    } catch (error) {
      toast.error('Failed to load developer logs');
      setLogs('Error loading logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary">Developer Logs</h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            System audit trail for automated background processes.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
        >
          Refresh Logs
        </button>
      </div>

      <div className="bg-[#1e1e1e] text-[#d4d4d4] p-6 rounded-xl shadow-lg border border-gray-800 font-mono text-sm overflow-x-auto min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-brand-accent animate-pulse">
            Loading logs...
          </div>
        ) : (
          <pre className="whitespace-pre-wrap">{logs}</pre>
        )}
      </div>
    </div>
  );
};

export default DeveloperLogs;
