import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config';
import DataTable from '../components/DataTable';

const PineLabsTransactions = ({ embedded = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('response');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/pine-labs/transactions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json() || [];
      const formatted = data.map((t, idx) => ({
        sNo: idx + 1,
        id: t.id,
        transactionId: t.transactionId,
        invoiceId: t.invoiceId || 'N/A',
        customerName: t.customerName || 'N/A',
        mobileNumber: t.mobileNumber || 'N/A',
        amount: `₹${t.amount}`,
        paymentMode: t.paymentMode || 'POS',
        status: t.status,
        date: new Date(t.createdAt).toLocaleString(),
        createdBy: t.user?.username || 'System',
        requestData: t.requestData,
        responseData: t.responseData,
        cancelData: t.cancelData
      }));
      setTransactions(formatted);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (transactionId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/pine-labs/status/${transactionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to check status');
      
      const data = await response.json();
      if (data.status === 'Success') {
        toast.success(`Payment successful!`);
      } else if (data.status === 'Failed' || data.status === 'Cancelled') {
        toast.error(`Payment ${data.status.toLowerCase()}`);
      } else {
        toast(`Still pending. PineLabs said: ${data.pineLabsResponse?.ResponseMessage || 'Unknown'}`, { icon: '⏳', duration: 4000 });
      }
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to get status');
    }
  };

  const handleCopy = (dataToCopy) => {
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    toast.success('Logs copied to clipboard!');
  };

  const actionButtons = (item) => {
    return (
      <div className="flex gap-2">
        {item.status === 'Pending' && (
          <button 
            onClick={() => handleCheckStatus(item.transactionId)}
            className="px-3 py-1 bg-brand-surface border border-brand-border text-brand-text-primary rounded hover:bg-brand-hover text-sm shadow-sm transition-colors whitespace-nowrap"
          >
            Check Status
          </button>
        )}
        <button
          onClick={() => {
            setSelectedLog({
              title: `Logs for ${item.transactionId}`,
              request: item.requestData || { message: "No request logs found" },
              response: item.responseData || { message: "No response logs found" },
              cancel: item.cancelData || { message: "No cancel logs found" }
            });
            setActiveTab('response');
            setIsLogModalOpen(true);
          }}
          className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 text-sm shadow-sm transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          View Logs
        </button>
      </div>
    );
  };

  const handleViewAllLogs = () => {
    const allLogs = transactions.map(t => ({
      transactionId: t.transactionId,
      status: t.status,
      request: t.requestData || null,
      response: t.responseData || null,
      cancel: t.cancelData || null
    }));
    setSelectedLog({
      title: "All Transaction Logs",
      all: allLogs
    });
    setActiveTab('all');
    setIsLogModalOpen(true);
  };

  const columns = [
    { accessor: "sNo", header: "S.No" },
    { accessor: "date", header: "Date & Time" },
    { accessor: "transactionId", header: "Transaction ID" },
    { accessor: "invoiceId", header: "Reference ID" },
    { accessor: "customerName", header: "Customer Name" },
    { accessor: "mobileNumber", header: "Mobile" },
    { accessor: "amount", header: "Amount" },
    { accessor: "paymentMode", header: "Payment Mode" },
    { accessor: "status", header: "Status",
      render: (value, item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold
          ${item.status === 'Success' ? 'bg-green-100 text-green-800' : 
            item.status === 'Failed' ? 'bg-red-100 text-red-800' : 
            item.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' : 
            'bg-yellow-100 text-yellow-800'}`}>
          {item.status}
        </span>
      )
    },
    { accessor: "createdBy", header: "Initiated By" }
  ];

  return (
    <div className={embedded ? "" : "p-6"}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`${embedded ? "text-xl" : "text-2xl"} font-bold text-gray-800`}>PineLabs History</h1>
        <div className="flex gap-4">
          <button 
            onClick={handleViewAllLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            View All Logs
          </button>
          <button 
            onClick={fetchTransactions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading transactions...</div>
        ) : (
          <DataTable data={transactions} columns={columns} actionButtons={actionButtons} />
        )}
      </div>

      {isLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{selectedLog.title}</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleCopy(selectedLog.all ? selectedLog.all : selectedLog[activeTab])} 
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium border border-blue-200 px-3 py-1.5 rounded bg-blue-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Copy
                </button>
                <button onClick={() => setIsLogModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            {!selectedLog.all && (
              <div className="flex border-b px-6 pt-2 gap-4 bg-gray-50">
                <button onClick={() => setActiveTab('request')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'request' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Request Log</button>
                <button onClick={() => setActiveTab('response')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'response' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Response Log</button>
                <button onClick={() => setActiveTab('cancel')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'cancel' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancel Log</button>
              </div>
            )}

            <div className="p-6 overflow-x-auto overflow-y-auto bg-gray-900 flex-1">
              <pre className="text-sm font-mono text-green-400">
                {JSON.stringify(selectedLog.all ? selectedLog.all : selectedLog[activeTab], null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PineLabsTransactions;
