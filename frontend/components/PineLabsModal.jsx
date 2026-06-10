import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { pineLabsApi } from '../api/pineLabsApi';
import toast from 'react-hot-toast';

const PineLabsModal = ({ isOpen, onClose, amount, customerName, mobileNumber, referenceId, createdBy, onSuccess }) => {
  const [status, setStatus] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    if (isOpen) {
      initiatePayment();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  const cleanup = () => {
    if (pollingInterval) clearInterval(pollingInterval);
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
      });

      setTransactionId(response.transactionId);
      setStatus('Waiting for customer to pay on POS machine...');
      
      const interval = setInterval(() => pollStatus(response.transactionId), 3000);
      setPollingInterval(interval);
    } catch (error) {
      setStatus('Failed to initiate: ' + (error.message || 'Unknown error'));
    }
  };

  const pollStatus = async (txId) => {
    try {
      const res = await pineLabsApi.checkStatus(txId);
      if (res.status === 'Success') {
        if (pollingInterval) clearInterval(pollingInterval);
        setStatus('Payment Successful!');
        setTimeout(() => {
          onSuccess(txId);
        }, 1500);
      } else if (res.status === 'Failed' || res.status === 'Cancelled') {
        if (pollingInterval) clearInterval(pollingInterval);
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

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Pine Labs POS Payment">
      <div className="p-6 text-center space-y-4">
        <div className="mb-4 text-gray-700 text-lg">
          Amount: <span className="font-bold text-gray-900">₹{amount}</span>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-md font-medium text-blue-800">
            {status}
          </p>
          {status === 'Waiting for customer to pay on POS machine...' && (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel POS Payment
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PineLabsModal;
