import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { paymentCollectionApi } from '../api/paymentCollectionApi.js';
import { customerApi } from '../api/customerApi.js';
import { paymentModeApi } from '../api/paymentModeApi.js';
import { typeOfPaymentApi } from '../api/typeOfPaymentApi.js';
import { typeOfCollectionApi } from '../api/typeOfCollectionApi.js';
import hondaLogo from '../assets/honda-logo.png';

const PaymentCollection = () => {
  const [customers, setCustomers] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [typeOfPayments, setTypeOfPayments] = useState([]);
  const [typeOfCollections, setTypeOfCollections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadedCustomer, setLoadedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], recAmt: '', paymentModeId: '', typeOfPaymentId: '', typeOfCollectionId: '', remarks: '' });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', contactNo: '', address: '', status: 'Walk in Customer' });

  useEffect(() => {
    fetchCustomers();
    fetchPaymentModes();
    fetchTypeOfPayments();
    fetchTypeOfCollections();
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

  const fetchTypeOfCollections = async () => {
    try {
      const data = await typeOfCollectionApi.getAll();
      setTypeOfCollections(data.filter(type => type.status === 'Enable'));
    } catch (error) {
      console.error('Error fetching type of collections:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await paymentCollectionApi.getAll();
      const formattedData = data.map((payment, index) => ({
        sNo: index + 1,
        id: payment.id,
        date: payment.date,
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        contactNo: payment.customer.contactNo,
        address: payment.customer.address,
        recAmt: payment.recAmt,
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || 'N/A',
        typeOfCollection: payment.typeOfCollection?.typeOfCollect || 'N/A',
        enteredBy: payment.user?.username || 'N/A',
        remarks: payment.remarks,
        customerId: payment.customerId,
        paymentModeId: payment.paymentModeId,
        typeOfPaymentId: payment.typeOfPaymentId,
        typeOfCollectionId: payment.typeOfCollectionId
      }));
      setPayments(formattedData);
      setFilteredPayments(formattedData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleLoadCustomer = () => {
    if (selectedCustomerId === 'new') {
      setIsNewCustomer(true);
      setLoadedCustomer(null);
      setFilteredPayments(payments);
    } else if (selectedCustomerId) {
      const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
      setLoadedCustomer(customer || null);
      setIsNewCustomer(false);
      const customerPayments = payments.filter(payment => payment.customerId === parseInt(selectedCustomerId));
      setFilteredPayments(customerPayments.map((payment, index) => ({ ...payment, sNo: index + 1 })));
    } else {
      setLoadedCustomer(null);
      setIsNewCustomer(false);
      setFilteredPayments(payments);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number for new customer
    if (isNewCustomer && !/^\d{10}$/.test(newCustomerData.contactNo)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    
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
        typeOfCollectionId: formData.typeOfCollectionId ? parseInt(formData.typeOfCollectionId) : undefined,
        enteredBy: JSON.parse(localStorage.getItem('user'))?.id,
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
      setFormData({ date: new Date().toISOString().split('T')[0], recAmt: '', paymentModeId: '', typeOfPaymentId: '', typeOfCollectionId: '', remarks: '' });
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
      typeOfCollectionId: payment.typeOfCollectionId?.toString() || '',
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
      setIsNewCustomer(true);
      setLoadedCustomer(null);
      setFilteredPayments(payments);
    } else {
      setSelectedCustomerId(customer.id.toString());
      setSearchTerm(customer.name);
      setLoadedCustomer(customer);
      setIsNewCustomer(false);
      const customerPayments = payments.filter(payment => payment.customerId === customer.id);
      setFilteredPayments(customerPayments.map((payment, index) => ({ ...payment, sNo: index + 1 })));
    }
    setShowDropdown(false);
  };

  const handlePrint = (payment) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const printDate = new Date();
    const formattedDate = `${printDate.getDate().toString().padStart(2, '0')}-${(printDate.getMonth() + 1).toString().padStart(2, '0')}-${printDate.getFullYear()} ${printDate.toLocaleTimeString('en-US', { hour12: true })}`;
    
    // Convert image to base64 for reliable printing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 40;
      canvas.height = 25;
      ctx.drawImage(img, 0, 0, 40, 25);
      const logoDataUrl = canvas.toDataURL('image/png');
      
      const printContent = `
      <div style="width: 210mm; height: 148mm; font-family: Arial, sans-serif; font-size: 12px; display: flex;">
        <!-- First Receipt -->
        <div style="width: 50%; padding: 10px; border: 1px solid #000; box-sizing: border-box;">
          <div style="text-align: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
              <img src="${logoDataUrl}" alt="Honda Logo" style="width: 40px; height: 25px; margin-right: 8px;" />
              <h3 style="margin: 0;">ANANDA MOTOWINGS PRIVATE LIMITED</h3>
            </div>
            <p style="margin: 2px 0; font-size: 10px;">Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,<br>Near Silk board Junction, Bomannahalli, Bengaluru,<br>Bengaluru Urban, Karnataka, 560068<br>+919071755550<br>GSTIN: 29ABBCA7185M1Z2</p>
          </div>
          <div style="text-align: center; background: #ddd; padding: 5px; margin-bottom: 10px;">
            <strong>RECEIPT</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <strong>To: ${payment.name}</strong><br>
              ${payment.address || 'LOCALITY OF WALK-IN CUSTOMER'}<br>
            </div>
            <div style="text-align: right;">
              <strong>Receipt</strong> ${payment.receiptNo}<br>
              <strong>As per</strong> ${payment.custId}<br><br>
              <strong>Date</strong> ${new Date(payment.date).toLocaleDateString('en-GB')}<br><br>
              ${payment.paymentMode === 'FINANCE' ? `<strong>FINANCE</strong><br>Hypothycation ${payment.typeOfPayment}` : ''}
            </div>
          </div>
          <p style="margin: 10px 0;">We thankfully acknowledge the receipt of your payment towards - ${payment.typeOfCollection || 'N/A'} <span style="float: right;">Page: 1</span></p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #ddd;">
              <th style="border: 1px solid #000; padding: 5px;">Collection Type</th>
              <th style="border: 1px solid #000; padding: 5px;">Amount</th>
              <th style="border: 1px solid #000; padding: 5px;">Remarks</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${payment.typeOfCollection || 'N/A'}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">₹${payment.recAmt}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${payment.remarks.length > 20 ? payment.remarks.substring(0, 20) + '...' : payment.remarks}</td>
            </tr>
          </table>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px;">
            <div>Payment Mode: ${payment.paymentMode.toLowerCase()}</div>
            <div>Payment Type: ${(payment.typeOfPayment || 'N/A').toLowerCase()}</div>
            <div><strong>Total: ${payment.recAmt}</strong></div>
          </div>
          <div style="border: 1px solid #000; padding: 5px; margin-bottom: 10px;">
            <small style="font-family: 'Times New Roman', Times, serif;">• Issued Subject to Realisation of Cheque.<br>
            • Price ruling at the time of delivery will be charged.<br>
            • Any refund through cheques only within 25 working days.<br>
            • Subject To BANGALORE Jurisdiction.</small>
          </div>
          <div style="text-align: right;">
            <p>For, Ananda Motowings Private Limited<br><br><br><br>Authorised Signatory</p>
          </div>
          <div style="font-size: 8px; margin-top: 10px;">
            Entered by: ${payment.enteredBy} &nbsp;&nbsp; Printed by: ${currentUser?.username || 'N/A'} &nbsp;&nbsp; Printed on: ${formattedDate}
          </div>
        </div>
        
        <!-- Second Receipt (Duplicate) -->
        <div style="width: 50%; padding: 10px; border: 1px solid #000; box-sizing: border-box;">
          <div style="text-align: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
              <img src="${logoDataUrl}" alt="Honda Logo" style="width: 40px; height: 25px; margin-right: 8px;" />
              <h3 style="margin: 0;">ANANDA MOTOWINGS PRIVATE LIMITED</h3>
            </div>
            <p style="margin: 2px 0; font-size: 10px;">Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,<br>Near Silk board Junction, Bomannahalli, Bengaluru,<br>Bengaluru Urban, Karnataka, 560068<br>+919071755550<br>GSTIN: 29ABBCA7185M1Z2</p>
          </div>
          <div style="text-align: center; background: #ddd; padding: 5px; margin-bottom: 10px;">
            <strong>RECEIPT</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <strong>To: ${payment.name}</strong><br>
              ${payment.address || 'LOCALITY OF WALK-IN CUSTOMER'}<br>
            </div>
            <div style="text-align: right;">
              <strong>Receipt</strong> ${payment.receiptNo}<br>
              <strong>As per</strong> ${payment.custId}<br><br>
              <strong>Date</strong> ${new Date(payment.date).toLocaleDateString('en-GB')}<br><br>
              ${payment.paymentMode === 'FINANCE' ? `<strong>FINANCE</strong><br>Hypothycation ${payment.typeOfPayment}` : ''}
            </div>
          </div>
          <p style="margin: 10px 0;">We thankfully acknowledge the receipt of your payment towards - ${payment.typeOfCollection || 'N/A'} <span style="float: right;">Page: 1</span></p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #ddd;">
              <th style="border: 1px solid #000; padding: 5px;">Collection Type</th>
              <th style="border: 1px solid #000; padding: 5px;">Amount</th>
              <th style="border: 1px solid #000; padding: 5px;">Remarks</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${payment.typeOfCollection || 'N/A'}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">₹${payment.recAmt}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${payment.remarks.length > 20 ? payment.remarks.substring(0, 20) + '...' : payment.remarks}</td>
            </tr>
          </table>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px;">
            <div>Payment Mode: ${payment.paymentMode.toLowerCase()}</div>
            <div>Payment Type: ${(payment.typeOfPayment || 'N/A').toLowerCase()}</div>
            <div><strong>Total: ${payment.recAmt}</strong></div>
          </div>
          <div style="border: 1px solid #000; padding: 5px; margin-bottom: 10px;">
            <small style="font-family: 'Times New Roman', Times, serif;">• Issued Subject to Realisation of Cheque.<br>
            • Price ruling at the time of delivery will be charged.<br>
            • Any refund through cheques only within 25 working days.<br>
            • Subject To BANGALORE Jurisdiction.</small>
          </div>
          <div style="text-align: right;">
            <p>For, Ananda Motowings Private Limited<br><br><br><br>Authorised Signatory</p>
          </div>
          <div style="font-size: 8px; margin-top: 10px;">
            Entered by: ${payment.enteredBy} &nbsp;&nbsp; Printed by: ${currentUser?.username || 'N/A'} &nbsp;&nbsp; Printed on: ${formattedDate}
          </div>
        </div>
      </div>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt - ${payment.receiptNo}</title>
            <style>
              @page { size: A5 landscape; margin: 0; }
              body { margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    };
    
    img.src = hondaLogo;
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Date', accessor: 'date', render: (value) => {
      const date = new Date(value);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } },
    { header: 'ReceiptNo', accessor: 'receiptNo' },
    { header: 'CustId', accessor: 'custId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Contact No', accessor: 'contactNo' },
    { header: 'Amount', accessor: 'recAmt' },
    { header: 'PaymentMode', accessor: 'paymentMode' },
    { header: 'PaymentType', accessor: 'typeOfPayment' },
    { header: 'CollectionType', accessor: 'typeOfCollection' },
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
                  setFilteredPayments(payments);
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
                    <input 
                      type="text" 
                      value={newCustomerData.contactNo} 
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, '');
                        if (numericValue.length > 10) {
                          toast.error('Mobile number cannot exceed 10 digits');
                          return;
                        }
                        setNewCustomerData({...newCustomerData, contactNo: numericValue});
                      }} 
                      className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" 
                      placeholder="Enter 10 digit mobile number"
                      maxLength="10"
                      required />
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
        data={filteredPayments} 
        actionButtons={(payment) => (
          <div className="flex gap-2">
            <button onClick={() => handlePrint(payment)} className="text-green-600 hover:underline">Print</button>
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
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Type of Collection</label>
            <select value={formData.typeOfCollectionId} onChange={(e) => setFormData({...formData, typeOfCollectionId: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent">
              <option value="">Select</option>
              {typeOfCollections.map(type => (
                <option key={type.id} value={type.id}>{type.typeOfCollect}</option>
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