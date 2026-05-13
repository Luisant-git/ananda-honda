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
          createdAt: r.createdAt,
        }))
      );
    } catch (error) {
      console.error('Error fetching service job cards:', error);
      toast.error('Failed to fetch records');
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
      const result = await serviceJobCardApi.upload(file);
      toast.success(`Successfully imported ${result.imported || 0} records`);
      fetchRecords('');
      setSearch('');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      header: 'Status', 
      accessor: 'status',
      render: (v) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(v)}`}>
          {v || 'N/A'}
        </span>
      )
    },
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
        <h1 className="text-2xl font-bold text-brand-text-primary">Service Dealership Master</h1>
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

      {/* Upload + Search Section */}
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Upload Service Job Card Excel
            </label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                className="hidden"
                id="sjc-excel-upload"
              />
              <label
                htmlFor="sjc-excel-upload"
                className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-3 hover:border-brand-accent transition-colors ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? (
                  <span className="text-brand-text-secondary text-sm">
                    <svg className="animate-spin h-5 w-5 inline mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <span className="text-brand-text-secondary text-sm">
                    📂 Click to upload Excel or CSV file (.xlsx / .xls / .csv)
                  </span>
                )}
              </label>
            </div>
            <p className="text-xs text-brand-text-secondary mt-1">
              Expected columns: Job Card #, Vehicle Registration No., Customer First Name, Customer Last Name, 
              Contact Phone, Model Name, Service Type, Job Card Status
            </p>
            <p className="text-xs text-green-600 mt-1">
              💡 Service types from Excel will be automatically added to Service Type master
            </p>
          </div>

          {/* Search */}
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
                placeholder="Search by job card no, reg no, mobile, customer name..."
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
            </div>

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