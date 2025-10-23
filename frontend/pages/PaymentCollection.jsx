import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { paymentCollectionApi } from '../api/paymentCollectionApi.js';
import { customerApi } from '../api/customerApi.js';
import { paymentModeApi } from '../api/paymentModeApi.js';
import { typeOfPaymentApi } from '../api/typeOfPaymentApi.js';

const PaymentCollection = () => {
  const [customers, setCustomers] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [typeOfPayments, setTypeOfPayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadedCustomer, setLoadedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], recAmt: '', paymentModeId: '', typeOfPaymentId: '', remarks: '' });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });

  useEffect(() => {
    fetchCustomers();
    fetchPaymentModes();
    fetchTypeOfPayments();
    fetchPayments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.customer-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const fetchTypeOfPayments = async () => {
    try {
      const data = await typeOfPaymentApi.getAll();
      setTypeOfPayments(data);
    } catch (error) {
      console.error('Error fetching type of payments:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await paymentCollectionApi.getAll();
      const formattedData = data.map((payment, index) => ({
        sNo: index + 1,
        id: payment.id,
        date: new Date(payment.date).toLocaleDateString(),
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        recAmt: payment.recAmt,
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || 'N/A',
        remarks: payment.remarks,
        customerId: payment.customerId,
        paymentModeId: payment.paymentModeId,
        typeOfPaymentId: payment.typeOfPaymentId
      }));
      setPayments(formattedData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleLoadCustomer = () => {
    if (selectedCustomerId === 'new') {
      setIsNewCustomer(true);
      setLoadedCustomer(null);
    } else if (selectedCustomerId) {
      const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
      setLoadedCustomer(customer || null);
      setIsNewCustomer(false);
    } else {
      setLoadedCustomer(null);
      setIsNewCustomer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let customerId = loadedCustomer?.id;
      
      // Create new customer if needed
      if (isNewCustomer) {
        const newCustomer = await customerApi.create(newCustomerData);
        customerId = newCustomer.id;
        await fetchCustomers(); // Refresh customer list
      }
      
      const submitData = {
        date: formData.date,
        customerId: customerId,
        recAmt: parseFloat(formData.recAmt),
        paymentModeId: parseInt(formData.paymentModeId),
        typeOfPaymentId: formData.typeOfPaymentId ? parseInt(formData.typeOfPaymentId) : undefined,
        remarks: formData.remarks
      };
      
      if (isEditMode) {
        await paymentCollectionApi.update(editingPayment.id, submitData);
        toast.success('Payment updated successfully!');
      } else {
        await paymentCollectionApi.create(submitData);
        toast.success('Payment created successfully!');
      }
      
      setIsPaymentModalOpen(false);
      setIsEditMode(false);
      setEditingPayment(null);
      setIsNewCustomer(false);
      setFormData({ date: new Date().toISOString().split('T')[0], recAmt: '', paymentModeId: '', typeOfPaymentId: '', remarks: '' });
      setNewCustomerData({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });
      fetchPayments();
    } catch (error) {
      toast.error('Error saving payment');
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment) => {
    setIsEditMode(true);
    setEditingPayment(payment);
    const customer = customers.find(c => c.id === payment.customerId);
    setLoadedCustomer(customer);
    setSelectedCustomerId(customer.id.toString());
    setFormData({
      date: new Date(payment.date).toISOString().split('T')[0],
      recAmt: payment.recAmt.toString(),
      paymentModeId: payment.paymentModeId.toString(),
      typeOfPaymentId: payment.typeOfPaymentId?.toString() || '',
      remarks: payment.remarks
    });
    setIsPaymentModalOpen(true);
  };

  const handleDelete = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await paymentCollectionApi.delete(paymentToDelete.id);
      toast.success('Payment deleted successfully!');
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
      fetchPayments();
    } catch (error) {
      toast.error('Error deleting payment');
      console.error('Error deleting payment:', error);
    }
  };

  const filteredTypeOfPayments = typeOfPayments.filter(type => 
    !formData.paymentModeId || type.paymentModeId === parseInt(formData.paymentModeId)
  );

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactNo.includes(searchTerm)
  );

  const handleCustomerSelect = (customer) => {
    if (customer === 'new') {
      setSelectedCustomerId('new');
      setSearchTerm('+ Add New Customer');
    } else {
      setSelectedCustomerId(customer.id.toString());
      setSearchTerm(customer.name);
    }
    setShowDropdown(false);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Date', accessor: 'date' },
    { header: 'ReceiptNo', accessor: 'receiptNo' },
    { header: 'CustId', accessor: 'custId' },
    { header: 'Name', accessor: 'name' },
    { header: 'RecAmt', accessor: 'recAmt' },
    { header: 'PaymentMode', accessor: 'paymentMode' },
    { header: 'TypeOfPayment', accessor: 'typeOfPayment' },
    { header: 'Remarks', accessor: 'remarks' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Payment Collection</h1>

      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm space-y-4 border border-brand-border">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow">
            <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Select Customer</label>
            <div className="relative customer-dropdown">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  setSelectedCustomerId('');
                  setLoadedCustomer(null);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name or contact number"
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              />
              {showDropdown && (
                <div className="absolute z-10 w-full bg-white border border-brand-border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                  <div
                    onClick={() => handleCustomerSelect('new')}
                    className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border font-medium text-green-600"
                  >
                    + Add New Customer
                  </div>
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border last:border-b-0"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-brand-text-secondary">{customer.contactNo}</div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && searchTerm && searchTerm !== '+ Add New Customer' && (
                    <div className="p-2 text-brand-text-secondary text-center">
                      No customers found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={handleLoadCustomer}
            className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg"
          >
            Load
          </button>
        </div>
        
        {(loadedCustomer || isNewCustomer) && (
           <div className="border-t border-brand-border pt-4">
            {isNewCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-brand-text-secondary">Name *</label>
                    <input type="text" value={newCustomerData.name} onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
                  </div>
                  <div>
                    <label className="text-sm text-brand-text-secondary">Mobile Number *</label>
                    <input type="text" value={newCustomerData.contactNo} onChange={(e) => setNewCustomerData({...newCustomerData, contactNo: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-brand-text-secondary">Address *</label>
                    <textarea value={newCustomerData.address} onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" rows={2} required></textarea>
                  </div>
                  <div>
                    <label className="text-sm text-brand-text-secondary">Status</label>
                    <select value={newCustomerData.status} onChange={(e) => setNewCustomerData({...newCustomerData, status: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent">
                      <option>Walk in Customer</option>
                      <option>Online Enquiry</option>
                    </select>
                  </div>
                  <div className="pt-2 flex justify-start">
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                      disabled={!newCustomerData.name || !newCustomerData.contactNo || !newCustomerData.address}
                    >
                      Pay
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-brand-text-secondary">CustId</label>
                    <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.custId}</div>
                  </div>
                  <div>
                    <label className="text-sm text-brand-text-secondary">Name</label>
                    <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-brand-text-secondary">Mobile Number</label>
                    <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.contactNo}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-brand-text-secondary">Address</label>
                    <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.address}</div>
                  </div>
                  <div>
                    <label className="text-sm text-brand-text-secondary">Status</label>
                    <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.status}</div>
                  </div>
                  <div className="pt-2 flex justify-start">
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={payments} 
        actionButtons={(payment) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(payment)} className="text-blue-600 hover:underline">Edit</button>
            <button onClick={() => handleDelete(payment)} className="text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={isEditMode ? "Edit Payment" : "Payment Entry"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Date <span className="text-red-500">*</span></label>
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Receipt No <span className="text-red-500">*</span></label>
            <input type="text" value="Auto-generated" disabled className="w-full bg-gray-100 border border-brand-border text-brand-text-secondary rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Received Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" value={formData.recAmt} onChange={(e) => setFormData({...formData, recAmt: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Mode <span className="text-red-500">*</span></label>
            <select value={formData.paymentModeId} onChange={(e) => setFormData({...formData, paymentModeId: e.target.value, typeOfPaymentId: ''})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required>
              <option value="">Select</option>
              {paymentModes.map(mode => (
                <option key={mode.id} value={mode.id}>{mode.paymentMode}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Type of Payment Mode</label>
            <select value={formData.typeOfPaymentId} onChange={(e) => setFormData({...formData, typeOfPaymentId: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent">
              <option value="">Select</option>
              {filteredTypeOfPayments.map(type => (
                <option key={type.id} value={type.id}>{type.typeOfMode}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Remarks <span className="text-red-500">*</span></label>
            <textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" rows={2} required></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold">{isEditMode ? 'Update' : 'Submit'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-brand-text-primary">Are you sure you want to delete payment <strong>{paymentToDelete?.receiptNo}</strong>?</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentCollection;