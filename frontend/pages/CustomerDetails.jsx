import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { customerApi } from '../api/customerApi.js';

const CustomerDetails = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      const formattedData = data.map((customer, index) => ({
        sNo: index + 1,
        ...customer
      }));
      setCustomers(formattedData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await customerApi.update(editingCustomer.id, formData);
        toast.success('Customer updated successfully!');
      } else {
        await customerApi.create(formData);
        toast.success('Customer created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingCustomer(null);
      setFormData({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });
      fetchCustomers();
    } catch (error) {
      toast.error('Error saving customer');
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer) => {
    setIsEditMode(true);
    setEditingCustomer(customer);
    setFormData({ name: customer.name, contactNo: customer.contactNo, address: customer.address, status: customer.status });
    setIsModalOpen(true);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await customerApi.delete(customerToDelete.id);
      toast.success('Customer deleted successfully!');
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Error deleting customer');
      console.error('Error deleting customer:', error);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingCustomer(null);
    setFormData({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'CustId', accessor: 'custId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Contact No1', accessor: 'contactNo' },
    { header: 'Address', accessor: 'address' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Customer Details</h1>
      
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">Select Customer</label>
            <select className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent">
              <option>Select</option>
              {customers.map(c => <option key={c.custId} value={c.custId}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">From:</label>
            <input type="date" className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">To:</label>
            <input type="date" className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>
          <div className="flex gap-2">
            <button className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg">Load</button>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Load All</button>
          </div>
          <button 
            onClick={handleAddNew}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg md:col-start-auto lg:col-start-5">
              Add Customer
          </button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={customers} 
        actionButtons={(customer) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:underline">Edit</button>
            <button onClick={() => handleDelete(customer)} className="text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Customer" : "Customer Entry"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Mobile Number</label>
            <input type="text" value={formData.contactNo} onChange={(e) => setFormData({...formData, contactNo: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" rows={3} required></textarea>
          </div>
           <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent">
                 <option>Walk in Customer</option>
                 <option>Online Enquiry</option>
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
          <p className="text-brand-text-primary">Are you sure you want to delete customer <strong>{customerToDelete?.name}</strong>?</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetails;