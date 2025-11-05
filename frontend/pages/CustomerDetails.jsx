import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { customerApi } from '../api/customerApi.js';
import SearchableDropdown from '../components/SearchableDropdown.jsx';
import { menuPermissionApi } from '../api/menuPermissionApi';

const CustomerDetails = ({ user }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });
  const [filters, setFilters] = useState({ selectedCustomer: '', fromDate: '', toDate: '' });
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      const formattedData = data.map((customer, index) => ({
        sNo: index + 1,
        ...customer
      }));
      setCustomers(formattedData);
      setFilteredCustomers(formattedData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleFilterLoad = () => {
    let filtered = [...customers];
    
    if (filters.selectedCustomer) {
      filtered = filtered.filter(customer => customer.custId === filters.selectedCustomer);
    }
    
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
        const toDate = filters.toDate ? new Date(filters.toDate) : null;
        
        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0);
          if (customerDate < fromDate) return false;
        }
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          if (customerDate > toDate) return false;
        }
        return true;
      });
    }
    
    setFilteredCustomers(filtered.map((customer, index) => ({ ...customer, sNo: index + 1 })));
  };

  const handleLoadAll = () => {
    setFilters({ selectedCustomer: '', fromDate: '', toDate: '' });
    setFilteredCustomers(customers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!/^\d{10}$/.test(formData.contactNo)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    
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

  const downloadXML = () => {
    try {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlContent += '<ENVELOPE>\n';
      xmlContent += '<HEADER>\n';
      xmlContent += '<TALLYREQUEST>Import Data</TALLYREQUEST>\n';
      xmlContent += '</HEADER>\n';
      xmlContent += '<BODY>\n';
      xmlContent += '<IMPORTDATA>\n';
      xmlContent += '<REQUESTDESC>\n';
      xmlContent += '<REPORTNAME>All Masters</REPORTNAME>\n';
      xmlContent += '<STATICVARIABLES>\n';
      xmlContent += '<SVCURRENTCOMPANY>DEMO COMPANY</SVCURRENTCOMPANY>\n';
      xmlContent += '</STATICVARIABLES>\n';
      xmlContent += '</REQUESTDESC>\n';
      xmlContent += '<REQUESTDATA>\n';
      
      filteredCustomers.forEach(customer => {
        xmlContent += '<TALLYMESSAGE xmlns:UDF="TallyUDF">\n';
        xmlContent += `<LEDGER NAME="${customer.custId} ${customer.name}" RESERVEDNAME="">\n`;
        xmlContent += '<NAME.LIST>\n';
        xmlContent += `<NAME>${customer.custId} ${customer.name}</NAME>\n`;
        xmlContent += '</NAME.LIST>\n';
        xmlContent += '<ADDRESS.LIST>\n';
        xmlContent += `<ADDRESS>${customer.address || 'N/A'}</ADDRESS>\n`;
        xmlContent += '</ADDRESS.LIST>\n';
        xmlContent += `<ADDITIONALNAME>${customer.custId} ${customer.name}</ADDITIONALNAME>\n`;
        // xmlContent += '<ISINTERESTON>No</ISINTERESTON>\n';
        xmlContent += `<PARENT>Sundry Debtors</PARENT>\n`;
        // xmlContent += '<VATTINNUMBER/>\n';
        // xmlContent += '<PARTYGSTIN/>\n';
        // xmlContent += '<PINCODE/>\n';
        xmlContent += '</LEDGER>\n';
        xmlContent += '</TALLYMESSAGE>\n';
      });
      
      xmlContent += '</REQUESTDATA>\n';
      xmlContent += '</IMPORTDATA>\n';
      xmlContent += '</BODY>\n';
      xmlContent += '</ENVELOPE>';
      
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tally_customers_${new Date().toISOString().split('T')[0]}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Tally XML file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading XML file');
    }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Customer Details</h1>
        <button 
          onClick={downloadXML}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg">
          XML
        </button>
      </div>
      
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <SearchableDropdown
            label="Select Customer"
            value={filters.selectedCustomer}
            onChange={(value) => setFilters({...filters, selectedCustomer: value})}
            options={customers.map(c => ({ value: c.custId, label: `${c.name} - ${c.contactNo}` }))}
          />
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">From:</label>
            <input 
              type="date" 
              value={filters.fromDate}
              onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
              className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">To:</label>
            <input 
              type="date" 
              value={filters.toDate}
              onChange={(e) => setFilters({...filters, toDate: e.target.value})}
              className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleFilterLoad}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg">Load</button>
            <button 
              onClick={handleLoadAll}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Load All</button>
          </div>
          {permissions?.master?.customer_details?.add && (
            <button 
              onClick={handleAddNew}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg md:col-start-auto lg:col-start-5">
                Add Customer
            </button>
          )}
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredCustomers} 
        actionButtons={(customer) => (
          <div className="flex gap-2">
            {permissions?.master?.customer_details?.edit && (
              <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:underline">Edit</button>
            )}
            {permissions?.master?.customer_details?.delete && (
              <button onClick={() => handleDelete(customer)} className="text-red-600 hover:underline">Delete</button>
            )}
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
            <input 
              type="text" 
              value={formData.contactNo} 
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, '');
                if (numericValue.length > 10) {
                  toast.error('Mobile number cannot exceed 10 digits');
                  return;
                }
                setFormData({...formData, contactNo: numericValue});
              }} 
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" 
              placeholder="Enter 10 digit mobile number"
              maxLength="10"
              required />
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