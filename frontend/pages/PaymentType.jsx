import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { paymentTypeApi } from '../api/paymentTypeApi.js';
import { menuPermissionApi } from '../api/menuPermissionApi';

const PaymentType = ({ user }) => {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchPaymentTypes();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const perms = await menuPermissionApi.get();
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const data = await paymentTypeApi.getAll();
      // Deduplicate by normalized name (case-insensitive)
      const seen = new Set();
      const deduped = [];
      data.forEach((p) => {
        const key = (p.name || '').toString().toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(p);
        }
      });
      const formatted = deduped.map((p, i) => ({ sNo: i + 1, ...p }));
      setPaymentTypes(formatted);
    } catch (error) {
      console.error('Error fetching payment types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: formData.name, isActive: !!formData.isActive };
      if (isEditMode) {
        await paymentTypeApi.update(editingItem.id, payload);
        toast.success('Payment type updated');
      } else {
        await paymentTypeApi.create(payload);
        toast.success('Payment type created');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingItem(null);
      setFormData({ name: '', isActive: true });
      fetchPaymentTypes();
    } catch (error) {
      toast.error('Error saving payment type');
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({ name: item.name, isActive: !!item.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await paymentTypeApi.delete(toDelete.id);
      toast.success('Deleted');
      setIsDeleteModalOpen(false);
      setToDelete(null);
      fetchPaymentTypes();
    } catch (error) {
      toast.error(error.message || 'Error deleting');
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setFormData({ name: '', isActive: true });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Name', accessor: 'name' },
    { header: 'Status', accessor: (row) => (row.isActive ? 'Enable' : 'Disable') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Payment Type</h1>
        {permissions?.master?.payment_type?.add && (
          <button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Add</button>
        )}
      </div>

      <DataTable columns={columns} data={paymentTypes} actionButtons={(item) => (
        <div className="flex gap-2">
          {permissions?.master?.payment_type?.edit && (
            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
          )}
          {permissions?.master?.payment_type?.delete && (
            <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline">Delete</button>
          )}
        </div>
      )} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Payment Type' : 'Add Payment Type'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Name</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-brand-border rounded-lg p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
            <select value={formData.isActive ? 'Enable' : 'Disable'} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Enable' })} className="w-full bg-white border border-brand-border rounded-lg p-2">
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
          <p>Are you sure you want to delete <strong>{toDelete?.name}</strong>?</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentType;
