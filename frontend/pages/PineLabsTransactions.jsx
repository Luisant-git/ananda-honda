import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config';
import DataTable from '../components/DataTable';

const PineLabsTransactions = ({ embedded = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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
        createdBy: t.user?.username || 'System'
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

  const actionButtons = (item) => {
    if (item.status === 'Pending') {
      return (
        <button 
          onClick={() => handleCheckStatus(item.transactionId)}
          className="px-3 py-1 bg-brand-surface border border-brand-border text-brand-text-primary rounded hover:bg-brand-hover text-sm shadow-sm transition-colors"
        >
          Check Status
        </button>
      );
    }
    return null;
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
    </div>
  );
};

export default PineLabsTransactions;
