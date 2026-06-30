import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config';
import DataTable from '../components/DataTable';

const PineLabsTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);

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

  const handleTestPayment = async () => {
    setIsInitiating(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/pine-labs/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: 1,
          customerName: 'Test User',
          mobileNumber: '9999999999'
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to initiate test payment');
      }
      
      toast.success('Test Payment of ₹1 pushed to POS!');
      fetchTransactions();
    } catch (error) {
      toast.error(error.message);
      console.error('Test Payment Error', error);
    } finally {
      setIsInitiating(false);
    }
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pine Labs Transactions</h1>
        <div className="flex gap-4">
          <button 
            onClick={handleTestPayment}
            disabled={isInitiating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 transition-colors shadow-sm font-medium"
          >
            {isInitiating ? 'Pushing...' : 'Test Payment (₹1)'}
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
          <DataTable data={transactions} columns={columns} />
        )}
      </div>
    </div>
  );
};

export default PineLabsTransactions;
