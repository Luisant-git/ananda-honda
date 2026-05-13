import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { serviceTypeOfPartApi } from '../api/serviceTypeOfPartApi.js';
import { menuPermissionApi } from '../api/menuPermissionApi';

const ServiceTypeOfPart = ({ user }) => {
  const [serviceParts, setServiceParts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    partNo: '', 
    partName: '', 
    status: 'Enable' 
  });
  const [permissions, setPermissions] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchServiceParts();
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

  const fetchServiceParts = async (searchTerm = search) => {
    try {
      const data = await serviceTypeOfPartApi.getAll();
      const filteredData = searchTerm 
        ? data.filter(part => 
            part.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.partName.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;
      
      const formattedData = filteredData.map((part, index) => ({
        sNo: index + 1,
        id: part.id,
        partNo: part.partNo,
        partName: part.partName,
        status: part.status,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt
      }));
      setServiceParts(formattedData);
    } catch (error) {
      console.error('Error fetching service parts:', error);
      toast.error('Failed to fetch records');
    }
  };

  const handleSearch = () => {
    fetchServiceParts(search);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.partNo.trim()) {
      toast.error('Part No is required');
      return;
    }
    if (!formData.partName.trim()) {
      toast.error('Part Name is required');
      return;
    }

    try {
      if (isEditMode) {
        await serviceTypeOfPartApi.update(editingPart.id, formData);
        toast.success('Service part updated successfully!');
      } else {
        await serviceTypeOfPartApi.create(formData);
        toast.success('Service part created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingPart(null);
      setFormData({ partNo: '', partName: '', status: 'Enable' });
      fetchServiceParts(search);
    } catch (error) {
      toast.error(error.message || 'Error saving service part');
      console.error('Error saving service part:', error);
    }
  };

  const handleEdit = (part) => {
    setIsEditMode(true);
    setEditingPart(part);
    setFormData({
      partNo: part.partNo,
      partName: part.partName,
      status: part.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (part) => {
    setPartToDelete(part);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await serviceTypeOfPartApi.delete(partToDelete.id);
      toast.success('Service part deleted successfully!');
      setIsDeleteModalOpen(false);
      setPartToDelete(null);
      fetchServiceParts(search);
    } catch (error) {
      toast.error(error.message || 'Error deleting service part');
      console.error('Error deleting service part:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      // Fetch all parts and delete one by one (or use bulk delete API if available)
      const allParts = await serviceTypeOfPartApi.getAll();
      for (const part of allParts) {
        await serviceTypeOfPartApi.delete(part.id);
      }
      toast.success('All service parts cleared successfully!');
      setIsClearModalOpen(false);
      fetchServiceParts('');
      setSearch('');
    } catch (error) {
      toast.error('Error clearing records');
      console.error('Error clearing records:', error);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = columns.map(col => col.header).join(',');
      const rows = serviceParts.map(row => columns.map(col => {
        const val = row[col.accessor];
        if (col.accessor === 'createdAt' && val) {
          return `"${new Date(val).toLocaleDateString('en-GB')}"`;
        }
        return `"${(val || '').toString().replace(/"/g, '""')}"`;
      }).join(',')).join('\n');
      const content = headers + '\n' + rows;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_parts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Error downloading CSV file');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = serviceParts.map(part => ({
        'Part No': part.partNo,
        'Part Name': part.partName,
        'Status': part.status,
        'Created Date': part.createdAt ? new Date(part.createdAt).toLocaleDateString('en-GB') : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ServiceParts');
      
      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 10 },
        { wch: 15 }
      ];

      XLSX.writeFile(workbook, `service_parts_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error exporting to Excel');
    }
  };

  // Download sample Excel template
  const downloadTemplate = () => {
    try {
      const templateData = [
        { 'Part No': 'PART001', 'Part Name': 'Brake Pad', 'Status': 'Enable' },
        { 'Part No': 'PART002', 'Part Name': 'Oil Filter', 'Status': 'Enable' },
        { 'Part No': 'PART003', 'Part Name': 'Air Filter', 'Status': 'Disable' },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 10 }
      ];

      XLSX.writeFile(workbook, 'service_parts_template.xlsx');
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Error downloading template');
    }
  };

  // Import from Excel
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          toast.error('No data found in Excel file');
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        let duplicateCount = 0;
        const errors = [];

        for (const row of jsonData) {
          const partNo = row['Part No'] || row['partNo'] || row['PART_NO'] || row['Part_No'];
          const partName = row['Part Name'] || row['partName'] || row['PART_NAME'] || row['Part_Name'];
          const status = row['Status'] || row['status'] || 'Enable';

          if (!partNo || !partName) {
            errorCount++;
            errors.push(`Missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          const existingPart = serviceParts.find(p => p.partNo === partNo);
          if (existingPart) {
            duplicateCount++;
            continue;
          }

          try {
            await serviceTypeOfPartApi.create({
              partNo: partNo.toString().trim(),
              partName: partName.toString().trim(),
              status: status === 'Enable' || status === 'enable' ? 'Enable' : 'Disable'
            });
            successCount++;
          } catch (err) {
            errorCount++;
            errors.push(`${partNo}: ${err.message}`);
          }
        }

        let message = `Import completed!\n✅ Success: ${successCount}\n`;
        if (duplicateCount > 0) message += `⚠️ Duplicates skipped: ${duplicateCount}\n`;
        if (errorCount > 0) message += `❌ Errors: ${errorCount}`;
        
        if (errors.length > 0 && errors.length <= 5) {
          message += `\n\nErrors:\n${errors.join('\n')}`;
        }
        
        toast.success(message, { duration: 5000 });
        await fetchServiceParts(search);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast.error('Error processing Excel file. Please check the format.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file');
      setIsImporting(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Part No', accessor: 'partNo' },
    { header: 'Part Name', accessor: 'partName' },
    { header: 'Status', accessor: 'status' },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      render: (v) => v ? new Date(v).toLocaleDateString('en-GB') : 'N/A',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with buttons at top right */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-text-primary">Service Type of Part</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Download Template
          </button>
          {serviceParts.length > 0 && (
            <>
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={exportToExcel}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Export Excel
              </button>
             
            </>
          )}
          {permissions?.master?.service_type_of_part?.add && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              + Add
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
              Upload Service Parts Excel
            </label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="service-parts-upload"
              />
              <label
                htmlFor="service-parts-upload"
                className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-3 hover:border-brand-accent transition-colors ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isImporting ? (
                  <span className="text-brand-text-secondary text-sm">
                    <svg className="animate-spin h-5 w-5 inline mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing...
                  </span>
                ) : (
                  <span className="text-brand-text-secondary text-sm">
                    📂 Click to upload Excel file (.xlsx / .xls)
                  </span>
                )}
              </label>
            </div>
            <p className="text-xs text-brand-text-secondary mt-1">
              Expected columns: Part No, Part Name, Status (Enable/Disable)
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
                placeholder="Search by Part No or Part Name..."
                className="flex-1 bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              />
              <button
                onClick={handleSearch}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Search
              </button>
              {search && (
                <button
                  onClick={() => { setSearch(''); fetchServiceParts(''); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-brand-text-secondary">
          Total Records: <strong>{serviceParts.length}</strong>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={serviceParts}
        actionButtons={(part) => (
          <div className="flex gap-3">
            {permissions?.master?.service_type_of_part?.edit && (
              <button
                onClick={() => handleEdit(part)}
                className="text-brand-accent hover:underline text-sm font-medium"
              >
                Edit
              </button>
            )}
            {permissions?.master?.service_type_of_part?.delete && (
              <button
                onClick={() => handleDelete(part)}
                className="text-red-600 hover:underline text-sm"
              >
                Delete
              </button>
            )}
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Service Part" : "Add Service Part"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Part No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.partNo}
              onChange={(e) => setFormData({...formData, partNo: e.target.value.toUpperCase()})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Enter part number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Part Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.partName}
              onChange={(e) => setFormData({...formData, partName: e.target.value})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Enter part name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            >
              <option value="Enable">Enable</option>
              <option value="Disable">Disable</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditMode(false);
                setEditingPart(null);
                setFormData({ partNo: '', partName: '', status: 'Enable' });
              }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold"
            >
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-brand-text-primary">
            Are you sure you want to delete service part <strong>{partToDelete?.partNo} - {partToDelete?.partName}</strong>?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-brand-text-primary mb-3">Confirm Clear All</h3>
            <p className="text-brand-text-secondary mb-4">
              Are you sure you want to delete all <strong>{serviceParts.length}</strong> service part records? This cannot be undone.
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

export default ServiceTypeOfPart;