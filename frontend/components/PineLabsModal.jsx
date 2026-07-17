import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { pineLabsApi } from '../api/pineLabsApi';
import PineLabsTransactions from '../pages/PineLabsTransactions';
import toast from 'react-hot-toast';
import PineLabsLogoImg from '../assets/Pine Labs-logo.png';

const PineLabsModal = ({ isOpen, onClose, amount, customerName, mobileNumber, referenceId, createdBy, onSuccess, machineType }) => {
  const [status, setStatus] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const pollingInterval = useRef(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initiatePayment();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  const cleanup = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setStatus('');
    setTransactionId(null);
  };

  const initiatePayment = async () => {
    setStatus('Initiating payment on POS machine...');
    try {
      const response = await pineLabsApi.initiate({
        amount: parseFloat(amount),
        invoiceId: referenceId,
        customerName,
        mobileNumber,
        createdBy,
        type: machineType || 'sale',
      });

      setTransactionId(response.transactionId);
      setStatus('Waiting for customer to pay on POS machine...');
      
      const interval = setInterval(() => pollStatus(response.transactionId), 3000);
      pollingInterval.current = interval;
    } catch (error) {
      setStatus('Failed to initiate: ' + (error.message || 'Unknown error'));
    }
  };

  const pollStatus = async (txId) => {
    try {
      const res = await pineLabsApi.checkStatus(txId);
      if (res.status === 'Success') {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setStatus('Payment Successful!');
        setTimeout(() => {
          onSuccess(txId);
        }, 3500);
      } else if (res.status === 'Failed' || res.status === 'Cancelled') {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setStatus(`Payment ${res.status}`);
      }
    } catch (error) {
      console.error('Polling error', error);
    }
  };

  const handleCancel = async () => {
    if (transactionId && (status === 'Waiting for customer to pay on POS machine...' || status.includes('Initiating'))) {
      try {
        await pineLabsApi.cancel(transactionId);
        toast.success('POS Payment cancelled');
      } catch (error) {
        console.error('Cancel error', error);
      }
    }
    onClose();
  };

  const isError = status.includes('Failed') || status.includes('Cancelled') || status.includes('not configured');
  const isSuccess = status.includes('Successful');
  const isWaiting = status === 'Waiting for customer to pay on POS machine...';
  const isInitiating = status.includes('Initiating');

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="" maxWidth={showHistory ? "max-w-5xl" : "max-w-md"}>
      <div className="-mt-2 flex flex-col items-center">
        {/* Pine Labs Custom Logo */}
        <div className="mb-4 mt-1 flex justify-center">
          <img src={PineLabsLogoImg} alt="Pine Labs" className="h-4 object-contain" />
        </div>

        {/* Main Terminal Card */}
        <div className="w-full bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-green-800/60 text-xs font-bold uppercase tracking-widest mb-1">Total Amount to Pay</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">₹{amount}</h2>
          </div>

          {/* Dynamic Status Visuals */}
          <div className="flex flex-col items-center justify-center h-24 mb-5">
            {isWaiting && (
              <div className="relative flex justify-center items-center">
                <div className="absolute animate-ping w-24 h-24 rounded-full bg-[#8dc63f] opacity-20"></div>
                <div className="absolute animate-pulse w-16 h-16 rounded-full bg-[#00a651] opacity-20"></div>
                <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-r from-[#8dc63f] to-[#00a651] flex items-center justify-center shadow-lg shadow-green-500/40">
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            )}
            {isInitiating && (
              <div className="flex gap-3">
                <div className="w-3.5 h-3.5 bg-[#8dc63f] rounded-full animate-bounce shadow-sm"></div>
                <div className="w-3.5 h-3.5 bg-[#00a651] rounded-full animate-bounce shadow-sm" style={{animationDelay: '0.15s'}}></div>
                <div className="w-3.5 h-3.5 bg-[#8dc63f] rounded-full animate-bounce shadow-sm" style={{animationDelay: '0.3s'}}></div>
              </div>
            )}
            {isSuccess && (
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center shadow-md animate-[bounce_1s_ease-in-out]">
                <svg className="w-10 h-10 text-[#00a651]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
              </div>
            )}
            {isError && (
              <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center shadow-md border border-red-200 animate-[pulse_1s_ease-in-out]">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center">
            <p className={`text-base font-semibold ${isError ? 'text-red-600' : isSuccess ? 'text-[#00a651]' : 'text-[#00a651]'}`}>
              {status}
            </p>
            {isWaiting && <p className="text-xs text-green-800/70 mt-1.5 font-medium">Please ask the customer to tap, insert, or swipe their card.</p>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full mt-6 flex justify-between items-center px-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {showHistory ? 'Hide' : 'Show'} History
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {isError || isSuccess ? 'Close' : 'Cancel Payment'}
          </button>
        </div>

        {showHistory && (
          <div className="w-full mt-6 border-t pt-4 text-left">
            <PineLabsTransactions embedded={true} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PineLabsModal;
