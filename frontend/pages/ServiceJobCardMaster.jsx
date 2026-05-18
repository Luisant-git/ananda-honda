// src/pages/ServiceJobCardMaster.jsx
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { serviceJobCardApi } from '../api/serviceJobcard';

const ServiceJobCardMaster = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async (searchTerm = search) => {
    try {
      const data = await serviceJobCardApi.getAll(searchTerm);
      console.log("API DATA:", data);
      
      setRecords(
        data.map((r, i) => ({
          id: r.id,
          sNo: i + 1,
          jobCardNo: r.jobCardNumber || 'N/A',
          customerName: r.customer?.name || `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.customerName || 'N/A',
          mobileNumber: r.mobileNumber || r.phone || r.contactPhone || 'N/A',
          vehicleRegNo: r.registrationNumber || 'N/A',
          vehicleModel: r.vehicleDetails || r.modelName || 'N/A',
          serviceType: r.serviceType?.name || r.serviceType || r.servicetype || r.service_type || 'N/A',
          customerComplaint: r.complaint || r.customerComplaint || 'N/A',
          status: r.status || 'N/A',
          closedDate: r.closedDate,
          labourRevenue: r.labourRevenue,
          partsRevenue: r.partsRevenue,
          lubesRevenue: r.lubesRevenue,
          totalRevenue: r.totalRevenue,
          createdAt: r.createdAt,
        }))
      );
    } catch (error) {
      console.error('Error fetching service job cards:', error);
      toast.error('Failed to fetch records');
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }
    setIsUploading(type);
    try {
      const result = await serviceJobCardApi.upload(file, type);
      toast.success(`Successfully imported ${result.imported || 0} records`);
      fetchRecords('');
      setSearch('');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = () => fetchRecords(search);

  const handleDelete = async (record) => {
    try {
      await serviceJobCardApi.remove(record.id);
      toast.success('Record deleted');
      fetchRecords();
    } catch (error) {
      toast.error('Error deleting record');
    }
  };

  const handleClearAll = async () => {
    try {
      await serviceJobCardApi.clearAll();
      toast.success('All records cleared');
      setIsClearModalOpen(false);
      setRecords([]);
    } catch (error) {
      toast.error('Error clearing records');
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Job Card #',
      'Vehicle Registration No.',
      'Customer First Name',
      'Customer Last Name',
      'Contact Phone',
      'Model Name',
      'Service Type',
      'Job Card Status'
    ];
    const sampleRow = [
      'SJC00001',
      'KA01KT6124',
      'KRISHNA',
      'KISHORE',
      '8610380807',
      'CB350C OBD2B',
      'Paid Service',
      'Pending'
    ];
    const csv = headers.join(',') + '\n' + sampleRow.join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service_job_card_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  const downloadCSV = () => {
    try {
      const headers = columns.map(col => col.header).join(',');
      const rows = records.map(row => columns.map(col => {
        const val = row[col.accessor];
        if (col.accessor === 'createdAt' && val) {
          return `"${new Date(val).toISOString().split('T')[0]}"`;
        }
        return `"${(val || '').toString().replace(/"/g, '""')}"`;
      }).join(',')).join('\n');
      const content = headers + '\n' + rows;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_job_cards_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading CSV file');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Job Card No', accessor: 'jobCardNo' },
    { header: 'Customer Name', accessor: 'customerName' },
    { header: 'Contact Info', accessor: 'mobileNumber' },
    { header: 'Vehicle Reg No', accessor: 'vehicleRegNo', render: (v) => v || 'N/A' },
    { header: 'Vehicle Model', accessor: 'vehicleModel', render: (v) => v || 'N/A' },
    { header: 'Service Type', accessor: 'serviceType', render: (v) => v || 'N/A' },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      render: (v) => v ? new Date(v).toLocaleDateString('en-GB') : 'N/A',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary">Service Dealership Master</h1>
          <p className="text-sm text-brand-text-secondary mt-1">Manage and import service data reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Download Template
          </button>
          {records.length > 0 && (
            <button
              onClick={downloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Export CSV
            </button>
          )}
          {records.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Revenue Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-brand-accent transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl group-hover:scale-110 transition-transform">
              💰
            </div>
            <div>
              <h3 className="font-bold text-brand-text-primary">Job Card Log & Revenue</h3>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-wider">Revenue Report</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleUpload(e.target.files[0], 'REVENUE')}
              className="hidden"
              id="upload-revenue"
              disabled={!!isUploading}
            />
            <label
              htmlFor="upload-revenue"
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all ${isUploading === 'REVENUE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading === 'REVENUE' ? (
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  <span className="text-brand-text-primary font-bold text-sm">Upload Revenue Sheet</span>
                  <span className="text-[10px] text-brand-text-secondary text-center">Labour, Parts, Lubes Revenue...</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* 2. Workshop Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-orange-400 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl group-hover:scale-110 transition-transform">
              🛠️
            </div>
            <div>
              <h3 className="font-bold text-brand-text-primary">Workshop Sheet</h3>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-wider">Status Report</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleUpload(e.target.files[0], 'WORKSHOP')}
              className="hidden"
              id="upload-workshop"
              disabled={!!isUploading}
            />
            <label
              htmlFor="upload-workshop"
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:bg-orange-50/50 hover:border-orange-400 transition-all ${isUploading === 'WORKSHOP' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading === 'WORKSHOP' ? (
                <div className="flex items-center gap-2 text-orange-600 font-medium">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  <span className="text-brand-text-primary font-bold text-sm">Upload Workshop Excel</span>
                  <span className="text-[10px] text-brand-text-secondary text-center">Job Card Status, Close Date...</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* 3. Invoice Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-purple-400 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl group-hover:scale-110 transition-transform">
              📄
            </div>
            <div>
              <h3 className="font-bold text-brand-text-primary">Invoice Report</h3>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-wider">3 Order Report</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleUpload(e.target.files[0], 'INVOICE')}
              className="hidden"
              id="upload-invoice"
              disabled={!!isUploading}
            />
            <label
              htmlFor="upload-invoice"
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:bg-purple-50/50 hover:border-purple-400 transition-all ${isUploading === 'INVOICE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading === 'INVOICE' ? (
                <div className="flex items-center gap-2 text-purple-600 font-medium">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  <span className="text-brand-text-primary font-bold text-sm">Upload Invoice Report</span>
                  <span className="text-[10px] text-brand-text-secondary text-center">Registration, Customer Name...</span>
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
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by job card no, registration no, mobile, customer name..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border text-brand-text-primary rounded-lg focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleSearch}
              className="flex-1 md:flex-none bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
              Search
            </button>
            {search && (
              <button
                onClick={() => { setSearch(''); fetchRecords(''); }}
                className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-brand-text-secondary">
        Total Records: <strong>{records.length}</strong>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={records}
        actionButtons={(record) => (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedJobCard(record);
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Service Job Card Details"
        maxWidth="max-w-5xl"
      >
        {selectedJobCard && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Job Card No</label>
                <div className="text-brand-text-primary font-medium">{selectedJobCard.jobCardNo}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Status</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedJobCard.status)}`}>
                    {selectedJobCard.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Customer Name</label>
                <div className="text-brand-text-primary font-medium">{selectedJobCard.customerName}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Mobile Number</label>
                <div className="text-brand-text-primary font-medium">{selectedJobCard.mobileNumber}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Vehicle Reg No</label>
                <div className="text-brand-text-primary font-medium">{selectedJobCard.vehicleRegNo}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Vehicle Model</label>
                <div className="text-brand-text-primary font-medium">{selectedJobCard.vehicleModel}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Service Type</label>
                <div className="text-brand-text-primary font-medium">{selectedJobCard.serviceType}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Created Date</label>
                <div className="text-brand-text-primary font-medium">
                  {selectedJobCard.createdAt ? new Date(selectedJobCard.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                </div>
              </div>
              {selectedJobCard.closedDate && (
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Closed Date</label>
                  <div className="text-brand-text-primary font-medium">
                    {new Date(selectedJobCard.closedDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
              )}
            </div>

            {(selectedJobCard.labourRevenue > 0 || selectedJobCard.partsRevenue > 0) && (
              <div className="border-t border-brand-border pt-4">
                <h4 className="text-sm font-bold text-brand-text-primary mb-3">Revenue Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Labour</label>
                    <div className="text-brand-text-primary font-medium">₹{selectedJobCard.labourRevenue || 0}</div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Parts</label>
                    <div className="text-brand-text-primary font-medium">₹{selectedJobCard.partsRevenue || 0}</div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Lubes</label>
                    <div className="text-brand-text-primary font-medium">₹{selectedJobCard.lubesRevenue || 0}</div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Total Revenue</label>
                    <div className="text-brand-text-primary font-bold text-brand-accent">₹{selectedJobCard.totalRevenue || 0}</div>
                  </div>
                </div>
              </div>
            )}

            {selectedJobCard.customerComplaint && selectedJobCard.customerComplaint !== 'N/A' && (
              <div className="border-t border-brand-border pt-4">
                <h4 className="text-sm font-bold text-brand-text-primary mb-3">Complaint Details</h4>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Customer Complaint</label>
                  <div className="text-brand-text-primary mt-1">{selectedJobCard.customerComplaint}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-brand-text-primary mb-3">Confirm Clear All</h3>
            <p className="text-brand-text-secondary mb-4">
              Are you sure you want to delete all <strong>{records.length}</strong> service job card records? This cannot be undone.
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

export default ServiceJobCardMaster;