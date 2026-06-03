// src/pages/ServiceWorkshopMaster.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import { serviceJobCardApi } from '../api/serviceJobcard';

const ServiceWorkshopMaster = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async (searchTerm = search) => {
    try {
      const data = await serviceJobCardApi.getAll(searchTerm);
      setRecords(
        data.map((r, i) => ({
          id: r.id,
          sNo: i + 1,
          jobCardNo: r.jobCardNumber || 'N/A',
          customerName: r.customerName || 'N/A',
          mobileNumber: r.mobileNumber || 'N/A',
          vehicleRegNo: r.registrationNumber || 'N/A',
          vehicleModel: r.vehicleDetails || 'N/A',
          serviceType: r.serviceType?.name || 'N/A',
        }))
      );
    } catch (error) {
      toast.error('Failed to fetch records');
    }
  };

  const handleWorkshopUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await serviceJobCardApi.uploadWorkshop(file);
      toast.success(`Successfully imported ${result.imported || 0} workshop records`);
      fetchRecords('');
    } catch (error) {
      toast.error(error.message || 'Workshop upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Job Card No', accessor: 'jobCardNo' },
    { header: 'Customer Name', accessor: 'customerName' },
    { header: 'Mobile No', accessor: 'mobileNumber' },
    { header: 'Vehicle Reg No', accessor: 'vehicleRegNo' },
    { header: 'Model', accessor: 'vehicleModel' },
    { header: 'Service Type', accessor: 'serviceType' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary">Service Workshop Master</h1>
          <p className="text-xs text-brand-text-secondary mt-1">Upload and manage workshop status records</p>
        </div>
      </div>

      <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="max-w-md">
          <label className="block text-sm font-bold text-brand-text-primary mb-4">
            Upload Workshop Excel Sheet
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleWorkshopUpload}
              className="hidden"
              id="workshop-upload-input"
              disabled={isUploading}
            />
            <label
              htmlFor="workshop-upload-input"
              className={`cursor-pointer h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-brand-border rounded-xl p-4 hover:border-orange-500 hover:bg-orange-50 transition-all ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="text-4xl">🛠️</span>
              <div className="text-center">
                <span className="block text-brand-text-primary font-bold">
                  {isUploading ? 'Processing File...' : 'Click to Upload Workshop Sheet'}
                </span>
                <span className="text-xs text-brand-text-secondary mt-1">
                  Supports .xlsx, .xls, .csv
                </span>
              </div>
            </label>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Required Columns:</h4>
            <ul className="text-[10px] text-blue-700 space-y-1 list-disc pl-4">
              <li>Job Card Number / Job Card #</li>
              <li>Service Type</li>
              <li>Model Name / Frame Number</li>
            </ul>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        title="Workshop Records"
      />
    </div>
  );
};

export default ServiceWorkshopMaster;
