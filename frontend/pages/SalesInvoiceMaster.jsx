import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { salesInvoiceApi } from '../api/salesInvoiceApi.js';

const SalesInvoiceMaster = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async (searchTerm = search) => {
    try {
      const data = await salesInvoiceApi.getAll(searchTerm);
      setRecords(data.map((r, i) => ({ ...r, sNo: i + 1 })));
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }
    setIsUploading(true);
    try {
      const result = await salesInvoiceApi.upload(file);
      toast.success(`Successfully imported ${result.imported} records`);
      fetchRecords('');
      setSearch('');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const handleSearch = () => fetchRecords(search);

  const handleDelete = async (record) => {
    try {
      await salesInvoiceApi.delete(record.id);
      toast.success('Record deleted');
      fetchRecords();
    } catch {
      toast.error('Error deleting record');
    }
  };

  const handleClearAll = async () => {
    try {
      await salesInvoiceApi.clearAll();
      toast.success('All records cleared');
      setIsClearModalOpen(false);
      setRecords([]);
    } catch {
      toast.error('Error clearing records');
    }
  };

  const downloadTemplate = () => {
    const headers = ['Reference No', 'Customer First Name', 'Customer Middle Name', 'Customer Last Name', 'Mobile Phone #', 'Permanent Reg No', 'Model Name', 'Assigned To (DSE) Name', 'Actual Deliver date', 'Address Line 1', 'Address Line 2', 'City', 'State', 'Zip Code'];
    const csv = headers.join(',') + '\nREF001,John,,Doe,9876543210,KA01AB1234,Activa 125,Vinushree,2024-01-15,Silk Board,6th Mile,Bengaluru,Karnataka,560068';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_invoice_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    try {
      const headers = columns.map(col => col.header).join(',');
      const rows = records.map(row => columns.map(col => {
        const val = row[col.accessor];
        if (col.accessor === 'actualDeliverDate' && val) {
          return `"${new Date(val).toISOString().split('T')[0]}"`;
        }
        return `"${val || ''}"`;
      }).join(',')).join('\n');
      const content = headers + '\n' + rows;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_invoices_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading CSV file');
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Customer Name', accessor: 'customerName' },
    { header: 'Contact Info', accessor: 'contactInfo' },
    { header: 'Vehicle Reg No', accessor: 'vehicleRegNo', render: (v) => v || 'N/A' },
    { header: 'Vehicle Model', accessor: 'vehicleModel', render: (v) => v || 'N/A' },
    { header: 'Assigned To (DSE)', accessor: 'assignedTo', render: (v) => v || 'N/A' },
    {
      header: 'Actual Deliver Date',
      accessor: 'actualDeliverDate',
      render: (v) => v ? new Date(v).toLocaleDateString('en-GB') : 'N/A',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Sales Invoice Master</h1>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Download Template
          </button>
          {records.length > 0 && (
            <button
              onClick={downloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Export CSV
            </button>
          )}
          {records.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Upload Sales Invoice Excel
            </label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-3 hover:border-brand-accent transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <span className="text-brand-text-secondary text-sm">Uploading...</span>
                ) : (
                  <span className="text-brand-text-secondary text-sm">
                    📂 Click to upload Excel or CSV file (.xlsx / .xls / .csv)
                  </span>
                )}
              </label>
            </div>
            <p className="text-xs text-brand-text-secondary mt-1">
              Supports standard shell format. Picks: Customer Name (First/Middle/Last), Mobile Phone #, Permanent Reg No, Model Name, Assigned To (DSE) Name, Actual Deliver date
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Search Records
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, contact, vehicle reg, model, DSE..."
                className="flex-1 bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              />
              <button
                onClick={handleSearch}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg"
              >
                Search
              </button>
              {search && (
                <button
                  onClick={() => { setSearch(''); fetchRecords(''); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-brand-text-secondary">
          Total Records: <strong>{records.length}</strong>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        actionButtons={(record) => (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedInvoice(record);
                setIsViewModalOpen(true);
              }}
              className="text-brand-accent hover:underline text-sm font-medium"
            >
              View
            </button>
            <button
              onClick={() => handleDelete(record)}
              className="text-red-600 hover:underline text-sm"
            >
              Delete
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sales Invoice Details"
        maxWidth="max-w-5xl"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Reference No</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.referenceNo || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Customer Name</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.customerName}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Contact Info</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.contactInfo}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Vehicle Reg No</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.vehicleRegNo || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Vehicle Model</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.vehicleModel || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Assigned To (DSE)</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.assignedTo || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Delivery Date</label>
                <div className="text-brand-text-primary font-medium">
                  {selectedInvoice.actualDeliverDate ? new Date(selectedInvoice.actualDeliverDate).toLocaleDateString('en-GB') : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="border-t border-brand-border pt-4">
              <h4 className="text-sm font-bold text-brand-text-primary mb-3">Address Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Address 1</label>
                  <div className="text-brand-text-primary">{selectedInvoice.address1 || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Address 2</label>
                  <div className="text-brand-text-primary">{selectedInvoice.address2 || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">City</label>
                    <div className="text-brand-text-primary">{selectedInvoice.city || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Zip Code</label>
                    <div className="text-brand-text-primary">{selectedInvoice.zipCode || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">State</label>
                  <div className="text-brand-text-primary">{selectedInvoice.state || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-brand-text-primary mb-3">Confirm Clear All</h3>
            <p className="text-brand-text-secondary mb-4">
              Are you sure you want to delete all <strong>{records.length}</strong> sales invoice records? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoiceMaster;
