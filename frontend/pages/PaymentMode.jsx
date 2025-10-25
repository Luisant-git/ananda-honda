import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { paymentModeApi } from '../api/paymentModeApi.js';

const PaymentMode = ({ user }) => {
  const [paymentModes, setPaymentModes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPaymentMode, setEditingPaymentMode] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentModeToDelete, setPaymentModeToDelete] = useState(null);
  const [formData, setFormData] = useState({ paymentMode: '', status: 'Enable' });

  useEffect(() => {
    fetchPaymentModes();
  }, []);

  const fetchPaymentModes = async () => {
    try {
      const data = await paymentModeApi.getAll();
      const formattedData = data.map((mode, index) => ({
        sNo: index + 1,
        ...mode
      }));
      setPaymentModes(formattedData);
    } catch (error) {
      console.error('Error fetching payment modes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await paymentModeApi.update(editingPaymentMode.id, formData);
        toast.success('Payment mode updated successfully!');
      } else {
        await paymentModeApi.create(formData);
        toast.success('Payment mode created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingPaymentMode(null);
      setFormData({ paymentMode: '', status: 'Enable' });
      fetchPaymentModes();
    } catch (error) {
      toast.error('Error saving payment mode');
      console.error('Error saving payment mode:', error);
    }
  };

  const handleEdit = (mode) => {
    setIsEditMode(true);
    setEditingPaymentMode(mode);
    setFormData({ paymentMode: mode.paymentMode, status: mode.status });
    setIsModalOpen(true);
  };

  const handleDelete = (mode) => {
    setPaymentModeToDelete(mode);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await paymentModeApi.delete(paymentModeToDelete.id);
      toast.success('Payment mode deleted successfully!');
      setIsDeleteModalOpen(false);
      setPaymentModeToDelete(null);
      fetchPaymentModes();
    } catch (error) {
      toast.error(error.message || 'Error deleting payment mode');
      console.error('Error deleting payment mode:', error);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingPaymentMode(null);
    setFormData({ paymentMode: '', status: 'Enable' });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'SlNo', accessor: 'sNo' },
    { header: 'Payment Mode', accessor: 'paymentMode' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Payment Mode</h1>
        <button 
          onClick={handleAddNew}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Add
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={paymentModes} 
        actionButtons={user?.role === 'SUPER_ADMIN' ? (mode) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(mode)} className="text-blue-600 hover:underline">Edit</button>
            <button onClick={() => handleDelete(mode)} className="text-red-600 hover:underline">Delete</button>
          </div>
        ) : null}
      />
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Payment Mode" : "Add Payment Mode"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Mode</label>
                <input type="text" value={formData.paymentMode} onChange={(e) => setFormData({...formData, paymentMode: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent">
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                </select>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Close</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold">{isEditMode ? 'Update' : 'Save'}</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-brand-text-primary">Are you sure you want to delete payment mode <strong>{paymentModeToDelete?.paymentMode}</strong>?</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentMode;