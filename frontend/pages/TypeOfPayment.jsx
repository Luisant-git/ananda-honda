import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchableDropdown from '../components/SearchableDropdown';
import { typeOfPaymentApi } from '../api/typeOfPaymentApi.js';
import { paymentModeApi } from '../api/paymentModeApi.js';
import { menuPermissionApi } from '../api/menuPermissionApi';

const TypeOfPayment = ({ user }) => {
  const [typeOfPayments, setTypeOfPayments] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTypeOfPayment, setEditingTypeOfPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeOfPaymentToDelete, setTypeOfPaymentToDelete] = useState(null);
  const [formData, setFormData] = useState({ paymentModeId: '', typeOfMode: '' });
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchTypeOfPayments();
    fetchPaymentModes();
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

  const fetchTypeOfPayments = async () => {
    try {
      const data = await typeOfPaymentApi.getAll();
      const formattedData = data.map((item, index) => ({
        sNo: index + 1,
        id: item.id,
        mode: item.paymentMode.paymentMode,
        typeOfMode: item.typeOfMode,
        paymentModeId: item.paymentModeId
      }));
      setTypeOfPayments(formattedData);
    } catch (error) {
      console.error('Error fetching type of payments:', error);
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const data = await paymentModeApi.getAll();
      setPaymentModes(data.filter(mode => mode.status === 'Enable'));
    } catch (error) {
      console.error('Error fetching payment modes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        paymentModeId: parseInt(formData.paymentModeId),
        typeOfMode: formData.typeOfMode
      };
      if (isEditMode) {
        await typeOfPaymentApi.update(editingTypeOfPayment.id, submitData);
        toast.success('Type of payment updated successfully!');
      } else {
        await typeOfPaymentApi.create(submitData);
        toast.success('Type of payment created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingTypeOfPayment(null);
      setFormData({ paymentModeId: '', typeOfMode: '' });
      fetchTypeOfPayments();
    } catch (error) {
      toast.error('Error saving type of payment');
      console.error('Error saving type of payment:', error);
    }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditingTypeOfPayment(item);
    setFormData({ paymentModeId: item.paymentModeId.toString(), typeOfMode: item.typeOfMode });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setTypeOfPaymentToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await typeOfPaymentApi.delete(typeOfPaymentToDelete.id);
      toast.success('Type of payment deleted successfully!');
      setIsDeleteModalOpen(false);
      setTypeOfPaymentToDelete(null);
      fetchTypeOfPayments();
    } catch (error) {
      toast.error('Error deleting type of payment');
      console.error('Error deleting type of payment:', error);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingTypeOfPayment(null);
    setFormData({ paymentModeId: '', typeOfMode: '' });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Mode', accessor: 'mode' },
    { header: 'Type of Mode', accessor: 'typeOfMode' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Type of Payment</h1>
        {permissions?.master?.type_of_payment?.add && (
          <button 
            onClick={handleAddNew}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
              Add
          </button>
        )}
      </div>
      <DataTable 
        columns={columns} 
        data={typeOfPayments} 
        actionButtons={(item) => (
          <div className="flex gap-2">
            {permissions?.master?.type_of_payment?.edit && (
              <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
            )}
            {permissions?.master?.type_of_payment?.delete && (
              <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline">Delete</button>
            )}
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Type of Payment" : "Add Type of Payment"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
            <SearchableDropdown
              label="Payment Mode"
              value={formData.paymentModeId}
              onChange={(value) => setFormData({...formData, paymentModeId: value})}
              options={paymentModes.map(mode => ({ value: mode.id.toString(), label: mode.paymentMode }))}
              required
            />
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Type of Payment Mode</label>
                <input type="text" value={formData.typeOfMode} onChange={(e) => setFormData({...formData, typeOfMode: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
            </div>
             <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Close</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold">{isEditMode ? 'Update' : 'Save'}</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-brand-text-primary">Are you sure you want to delete type of payment <strong>{typeOfPaymentToDelete?.typeOfMode}</strong>?</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TypeOfPayment;