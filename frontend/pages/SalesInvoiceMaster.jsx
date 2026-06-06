import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { salesInvoiceApi } from '../api/salesInvoiceApi.js';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    const data = [
      {
        'Reference No': 'REF001',
        'Customer First Name': 'John',
        'Customer Middle Name': '',
        'Customer Last Name': 'Doe',
        'Mobile Phone #': '9876543210',
        'Permanent Reg No': 'KA01AB1234',
        'Model Name': 'Activa 125',
        'Assigned To (DSE) Name': 'Vinushree',
        'Actual Deliver date': '2024-01-15',
        'Address Line 1': 'Silk Board',
        'Address Line 2': '6th Mile',
        'City': 'Bengaluru',
        'State': 'Karnataka',
        'Zip Code': '560068'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "sales_invoice_template.xlsx");
  };

  const downloadExcel = () => {
    try {
      const exportData = records.map(row => {
        const rowData = {};
        columns.forEach(col => {
          let val = row[col.accessor];
          if (col.accessor === 'actualDeliverDate' && val) {
            val = new Date(val).toISOString().split('T')[0];
          }
          rowData[col.header] = val || '';
        });
        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Invoices");
      XLSX.writeFile(wb, `sales_invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading Excel file');
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
              onClick={downloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Export Excel
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-brand-accent transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-brand-text-primary">Sales Invoice Master</h3>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-wider">Excel Import</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUpload}
              className="hidden"
              id="excel-upload"
              disabled={!!isUploading}
            />
            <label
              htmlFor="excel-upload"
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  <span className="text-brand-text-primary font-bold text-sm">Upload Sales Invoice Excel</span>
                  <span className="text-xs text-brand-text-secondary text-center mt-1">
                    <strong className="text-blue-600 font-semibold">Key Data:</strong> Customer Name, Mobile, Reg No, Model, DSE, Deliver date
                  </span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-brand-surface p-4 rounded-xl shadow-sm border border-brand-border">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
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
                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
              >
                Search
              </button>
              {search && (
                <button
                  onClick={() => { setSearch(''); fetchRecords(''); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-brand-text-secondary flex items-center justify-between">
          <span>Total Records: <strong className="text-brand-text-primary">{records.length}</strong></span>
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
              {selectedInvoice.paymentDetails && selectedInvoice.paymentDetails.length > 0 && (
                <div className="col-span-2">
                  <label className="text-xs text-brand-text-secondary uppercase">Payments (Sales Report)</label>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Receipt No</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-brand-text-secondary uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {selectedInvoice.paymentDetails.map((payment, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-700">
                              {payment.receiptNo}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-brand-text-primary">
                              ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-brand-text-primary">
                            Total Collected
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-brand-text-primary">
                            ₹{selectedInvoice.totalCollectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
