import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
const XLSX = window.XLSX;
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
    partDescription: '',
    Model: '',
    status: 'ORDERED' 
  });
  const [permissions, setPermissions] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
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

  const fetchServiceParts = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await serviceTypeOfPartApi.getAll({
        page: page,
        limit: 10,
        search: search,
        status: statusFilter
      });
      
      const formattedData = response.data.map((part, index) => ({
        sNo: ((page - 1) * 10) + index + 1,
        id: part.id,
        partNo: part.partNo,
        partDescription: part.partDescription,
        Model: part.Model || 'N/A',
        status: part.status,
        statusDate: part.statusDate,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt
      }));
      
      setServiceParts(formattedData);
      setTotalPages(response.meta.totalPages);
      setTotalRecords(response.meta.total);
      setCurrentPage(response.meta.page);
    } catch (error) {
      console.error('Error fetching service parts:', error);
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchServiceParts(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage === 1) {
      fetchServiceParts(1);
    } else {
      setCurrentPage(1);
    }
  }, [search, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchServiceParts(newPage);
    }
  };

 

const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('Current formData before submit:', formData); // Debug log
  
  if (!formData.partNo.trim()) {
    toast.error('Part No is required');
    return;
  }
  if (!formData.partDescription.trim()) {
    toast.error('Part Description is required');
    return;
  }

  setLoading(true);
  try {
    const submitData = {
      partNo: formData.partNo,
      partDescription: formData.partDescription,
      Model: formData.Model || null,
      status: formData.status, // This should be 'ORDERED', 'RECEIVED', or 'NOT_RECEIVED'
      statusDate: new Date().toISOString()
    };

    console.log('Submitting to API:', submitData); // Debug log - check if status is here

    if (isEditMode) {
      const numericId = typeof editingPart.id === 'string' ? parseInt(editingPart.id, 10) : editingPart.id;
      const response = await serviceTypeOfPartApi.update(numericId, submitData);
      console.log('Update response:', response);
      toast.success('Service part updated successfully!');
    } else {
      await serviceTypeOfPartApi.create(submitData);
      toast.success('Service part created successfully!');
    }
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingPart(null);
    setFormData({ partNo: '', partDescription: '', Model: '', status: 'ORDERED' });
    fetchServiceParts(currentPage);
  } catch (error) {
    toast.error(error.message || 'Error saving service part');
    console.error('Error saving service part:', error);
  } finally {
    setLoading(false);
  }
};

const handleEdit = (part) => {
  console.log('Editing part - raw data:', part); // Debug log
  
  setIsEditMode(true);
  setEditingPart(part);
  
  // Convert status if it's the old 'Enable'/'Disable' format
  let statusValue = part.status;
  if (statusValue === 'Enable') statusValue = 'ORDERED';
  if (statusValue === 'Disable') statusValue = 'NOT_RECEIVED';
  
  const newFormData = {
    partNo: part.partNo,
    partDescription: part.partDescription,
    Model: part.Model !== 'N/A' ? part.Model : '',
    status: statusValue // Make sure status is set
  };
  
  console.log('Setting form data to:', newFormData); // Debug log
  
  setFormData(newFormData);
  setIsModalOpen(true);
};

  const handleDelete = (part) => {
    setPartToDelete(part);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const numericId = typeof partToDelete.id === 'string' ? parseInt(partToDelete.id, 10) : partToDelete.id;
      await serviceTypeOfPartApi.delete(numericId);
      toast.success('Service part deleted successfully!');
      setIsDeleteModalOpen(false);
      setPartToDelete(null);
      fetchServiceParts(currentPage);
    } catch (error) {
      toast.error(error.message || 'Error deleting service part');
      console.error('Error deleting service part:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    try {
      const allParts = await serviceTypeOfPartApi.getAll({ page: 1, limit: 999999 });
      for (const part of allParts.data) {
        await serviceTypeOfPartApi.delete(part.id);
      }
      toast.success('All service parts cleared successfully!');
      setIsClearModalOpen(false);
      setSearch('');
      setStatusFilter('');
      setCurrentPage(1);
      fetchServiceParts(1);
    } catch (error) {
      toast.error('Error clearing records');
      console.error('Error clearing records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get status color for display
  const getStatusColor = (status) => {
    switch(status) {
      case 'ORDERED':
        return 'text-yellow-600 bg-yellow-50';
      case 'RECEIVED':
        return 'text-green-600 bg-green-50';
      case 'NOT_RECEIVED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Part No', accessor: 'partNo' },
    { header: 'Part Description', accessor: 'partDescription' },
    { header: 'Model', accessor: 'Model' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      header: 'Status Date',
      accessor: 'statusDate',
      render: (v) => v ? new Date(v).toLocaleDateString() : 'N/A'
    }
  ];

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['SNo', 'Part No', 'Part Description', 'Model', 'Status', 'Status Date', 'Created Date'];
      const rows = serviceParts.map(row => [
        row.sNo,
        row.partNo,
        row.partDescription,
        row.Model || 'N/A',
        row.status,
        row.statusDate ? new Date(row.statusDate).toLocaleDateString('en-GB') : '',
        row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
      const content = headers.join(',') + '\n' + rows.join('\n');
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
        'Part Description': part.partDescription,
        'Model': part.Model || 'N/A',
        'Status': part.status,
        'Status Date': part.statusDate ? new Date(part.statusDate).toLocaleDateString('en-GB') : '',
        'Created Date': part.createdAt ? new Date(part.createdAt).toLocaleDateString('en-GB') : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ServiceParts');
      
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
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
        { 'Part Number': '04053-K0Z-901', 'Part Description': 'CHAIN SPROCKET KIT - CB350', 'Model': 'CB350', 'Status': 'ORDERED' },
        { 'Part Number': '05030-KSP-861', 'Part Description': 'RACE CONE GREASE KIT-MOTORCYCL', 'Model': 'N/A', 'Status': 'ORDERED' },
        { 'Part Number': 'PART003', 'Part Description': 'BRAKE PAD SET', 'Model': 'N/A', 'Status': 'RECEIVED' },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 15 },
        { wch: 12 }
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
          let partNo = row['Part Number'] || row['Part No'] || row['partNo'] || row['PART_NO'];
          let partDescription = row['Part Description'] || row['Part Name'] || row['partName'] || row['PART_NAME'];
          let Model = row['Model'] || row['model'] || row['MODEL'] || 'N/A';
          let status = row['Status'] || row['status'] || 'ORDERED';
          
          // Ensure status is one of the valid values
          if (!['ORDERED', 'RECEIVED', 'NOT_RECEIVED'].includes(status)) {
            status = 'ORDERED';
          }

          if (!partNo || !partDescription) {
            errorCount++;
            errors.push(`Missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          try {
            await serviceTypeOfPartApi.create({
              partNo: partNo.toString().trim(),
              partDescription: partDescription.toString().trim(),
              Model: Model !== 'N/A' ? Model.toString().trim() : null,
              status: status
            });
            successCount++;
          } catch (err) {
            if (err.message.includes('already exists')) {
              duplicateCount++;
            } else {
              errorCount++;
              errors.push(`${partNo}: ${err.message}`);
            }
          }
        }

        let message = `Import completed!\n✅ Success: ${successCount}\n`;
        if (duplicateCount > 0) message += `⚠️ Duplicates skipped: ${duplicateCount}\n`;
        if (errorCount > 0) message += `❌ Errors: ${errorCount}`;
        
        if (errors.length > 0 && errors.length <= 5) {
          message += `\n\nErrors:\n${errors.join('\n')}`;
        }
        
        toast.success(message, { duration: 5000 });
        await fetchServiceParts(currentPage);
        
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

  if (loading && serviceParts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto"></div>
          <p className="mt-2 text-brand-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with buttons */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-text-primary">Service Type of Part</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            📥 Download Template
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
              {/* <button
                onClick={() => setIsClearModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Clear All
              </button> */}
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

      {/* Upload + Search + Status Filter Section */}
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Upload Service Parts Excel
            </label>
            <div className="flex flex-col gap-2">
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
                className={`cursor-pointer w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-3 hover:border-brand-accent transition-colors ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isImporting ? (
                  <span className="text-brand-text-secondary text-sm text-center">
                    <svg className="animate-spin h-5 w-5 inline mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing...
                  </span>
                ) : (
                  <span className="text-brand-text-secondary text-sm text-center">
                    📂 Click to upload Excel file (.xlsx / .xls)
                  </span>
                )}
              </label>
            </div>
            <p className="text-xs text-brand-text-secondary mt-1">
              Expected columns: Part Number, Part Description, Model, Status (ORDERED/RECEIVED/NOT_RECEIVED)
            </p>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Search Records
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by Part No, Part Description or Model..."
                className="w-full flex-1 bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              />
              <button
                onClick={handleSearch}
                className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Search
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Filter by Status
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full flex-1 bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              >
                <option value="">All Status</option>
                <option value="ORDERED">ORDERED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="NOT_RECEIVED">NOT RECEIVED</option>
              </select>
              {statusFilter && (
                <button
                  onClick={() => { setStatusFilter(''); handleStatusFilterChange(''); }}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-brand-text-secondary flex justify-between items-center">
          <div>
            Total Records: <strong>{totalRecords}</strong>
          </div>
          {(search || statusFilter) && (
            <button
              onClick={() => { 
                setSearch(''); 
                setStatusFilter(''); 
                handleStatusFilterChange('');
                handleSearch();
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Clear All Filters
            </button>
          )}
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
                className="text-blue-600 hover:underline text-sm font-medium"
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
        pagination={{
          total: totalRecords,
          totalPages,
          page: currentPage,
          limit: 10,
          onPageChange: handlePageChange,
        }}
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
              Part Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.partDescription}
              onChange={(e) => setFormData({...formData, partDescription: e.target.value})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Enter part description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.Model}
              onChange={(e) => setFormData({...formData, Model: e.target.value})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Enter model (optional)"
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
              <option value="ORDERED">ORDERED</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="NOT_RECEIVED">NOT RECEIVED</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditMode(false);
                setEditingPart(null);
                setFormData({ partNo: '', partDescription: '', Model: '', status: 'ORDERED' });
              }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold disabled:opacity-50"
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
            Are you sure you want to delete service part <strong>{partToDelete?.partNo} - {partToDelete?.partDescription}</strong>?
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
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
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
              Are you sure you want to delete all <strong>{totalRecords}</strong> service part records? This cannot be undone.
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
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
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