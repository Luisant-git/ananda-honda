import React, { useState, useEffect } from 'react';
import { serviceJobCardApi } from '../api/serviceJobcard';
import toast from 'react-hot-toast';
import config from '../config.js';

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

  const renderLogs = (logText) => {
    if (!logText || logText === 'No logs available.' || logText === 'Error loading logs.') {
      return <pre className="whitespace-pre-wrap">{logText}</pre>;
    }

    const lines = logText.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, index) => {
          if (!line.trim()) return null;
          
          const serverFileMatch = line.match(/\|\s*SERVER_FILE:\s*([^\s]+)/);
          if (serverFileMatch) {
            const fileName = serverFileMatch[1];
            const displayLine = line.replace(/\|\s*SERVER_FILE:\s*[^\s]+/, '');
            
            return (
              <div key={index} className="flex items-center justify-between hover:bg-[#2a2a2a] p-1 rounded">
                <span className="whitespace-pre-wrap break-all">{displayLine}</span>
                <a
                  href={`${config.API_BASE_URL}/service-job-card/developer/download/${fileName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 shrink-0 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold py-1 px-3 rounded flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download
                </a>
              </div>
            );
          }
          
          return (
            <div key={index} className="hover:bg-[#2a2a2a] p-1 rounded whitespace-pre-wrap break-all">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

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

      <div className="bg-[#1e1e1e] text-[#d4d4d4] p-6 rounded-xl shadow-lg border border-gray-800 font-mono text-sm min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-brand-accent animate-pulse">
            Loading logs...
          </div>
        ) : (
          renderLogs(logs)
        )}
      </div>
    </div>
  );
};

export default DeveloperLogs;
