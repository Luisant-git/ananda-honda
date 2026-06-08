// src/pages/ServiceImport.jsx
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { serviceJobCardApi } from '../api/serviceJobcard';
import { Coins, Wrench, Receipt, CheckCircle, XCircle, AlertCircle, Download, FileSpreadsheet, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

const ServiceImport = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedTab, setSelectedTab] = useState('summary');
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
          invoiceNumber: r.invoiceNumber || 'N/A',
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
          amc: r.amc,
          oil: r.oil,
          battery: r.battery,
          tyre: r.tyre,
          painting: r.painting,
          currentKM: r.currentKM,
          frameNumber: r.frameNumber,
          otpNo: r.otpNo,
          amcStartDate: r.amcStartDate,
          amcEndDate: r.amcEndDate,
          estimatedDeliveryDate: r.estimatedDeliveryDate,
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

  const handleFileSelect = (file, type) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const rowsWithIssues = [];
        const validRows = [];

        rawRows.forEach((r, idx) => {
          const validation = validateRow(r, type);
          if (validation.valid) {
            validRows.push({ 
              __origRow: r, 
              __rowNumber: idx + 2, // +2 for Excel row number (1-indexed + header)
              __reasons: validation.reasons 
            });
          } else {
            rowsWithIssues.push({ 
              __origRow: r, 
              __rowNumber: idx + 2, 
              __reasons: validation.reasons 
            });
          }
        });

        setPreviewResult({ 
          type, 
          rows: rawRows, 
          validRows, 
          invalidRows: rowsWithIssues, 
          fileName: file.name,
          totalRows: rawRows.length
        });
        setIsPreviewOpen(true);
        setSelectedTab('summary');
      } catch (err) {
        console.error('Error parsing file:', err);
        toast.error('Failed to parse file');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateRow = (row, type) => {
    const reasons = [];
    const keys = Object.keys(row).map(k => k.toString().trim().toLowerCase());

    const getVal = (names) => {
      for (const n of names) {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes(n.toLowerCase())) return row[key];
        }
      }
      return '';
    };

    if (type === 'ORDER') {
      const jobCard = getVal(['job card', 'jobcard', 'job_card', 'jobcard#', 'job card #']);
      if (!jobCard || String(jobCard).trim() === '') reasons.push('Missing Job Card number');
      const phone = getVal(['contact phone', 'phone', 'mobile']);
      if (!phone || String(phone).trim() === '') reasons.push('Missing Contact Phone');
    } else if (type === 'REVENUE') {
      const jobCard = getVal(['job card', 'jobcard', 'job_card']);
      if (!jobCard || String(jobCard).trim() === '') reasons.push('Missing Job Card number');
      const labour = getVal(['labour', 'labour revenue']);
      const parts = getVal(['parts', 'parts revenue']);
      const lubes = getVal(['lubes', 'lubes revenue']);
      if ((!labour || labour === '') && (!parts || parts === '') && (!lubes || lubes === '')) reasons.push('No revenue values found');
    } else if (type === 'WORKSHOP') {
      const jobCard = getVal(['job card', 'jobcard', 'job_card']);
      if (!jobCard || String(jobCard).trim() === '') reasons.push('Missing Job Card number');
    } else if (type === 'INVOICE') {
      const jobCard = getVal(['job card', 'jobcard', 'job_card']);
      if (!jobCard || String(jobCard).trim() === '') reasons.push('Missing Job Card number');
      const invoice = getVal(['invoice', 'invoice number']);
      if (!invoice || String(invoice).trim() === '') reasons.push('Missing Invoice Number');
    }

    return { valid: reasons.length === 0, reasons };
  };

  const confirmImportValidRows = async () => {
    if (!previewResult) return;
    if (!previewResult.validRows || previewResult.validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsPreviewOpen(false);
    setIsUploading(previewResult.type);
    try {
      const exportRows = previewResult.validRows.map(v => v.__origRow);
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Import');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const file = new File([blob], `import_valid_${previewResult.fileName || 'upload'}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const result = await serviceJobCardApi.upload(file, previewResult.type);
      const importedCount = result.imported || previewResult.validRows.length;
      toast.success(`Imported ${importedCount} records`);
      setImportResult({ importedCount, importedRows: previewResult.validRows, invalidRows: previewResult.invalidRows });
      setIsResultOpen(true);
      setPreviewResult(null);
    } catch (err) {
      console.error('Import failed:', err);
      toast.error(err.message || 'Import failed');
      setImportResult({ importedCount: 0, importedRows: [], invalidRows: previewResult ? previewResult.invalidRows : [] });
      setIsResultOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadInvalidRows = (invalidRows, fileName = 'invalid_rows.xlsx') => {
    if (!invalidRows || invalidRows.length === 0) {
      toast.error('No invalid rows to download');
      return;
    }
    const exportData = invalidRows.map(r => ({
      'Excel Row #': r.__rowNumber,
      'Validation Issues': r.__reasons.join('; '),
      ...r.__origRow
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'InvalidRows');
    XLSX.writeFile(wb, fileName);
    toast.success(`${invalidRows.length} invalid rows exported`);
  };

  // Helpers to format Excel serial dates and values for preview
  const isExcelDateNumber = (n) => {
    return typeof n === 'number' && n > 29000 && n < 60000;
  };

  const excelDateToJS = (serial) => {
    const unixTime = Math.round((serial - 25569) * 86400 * 1000);
    return new Date(unixTime);
  };

  const formatValue = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (v instanceof Date && !isNaN(v.getTime())) return v.toLocaleString('en-GB');
    const num = (typeof v === 'number') ? v : (typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : null);
    if (num !== null && isExcelDateNumber(num)) {
      return excelDateToJS(num).toLocaleString('en-GB');
    }
    const s = String(v);
    return s.length > 120 ? s.slice(0, 120) + '...' : s;
  };

  const renderDataPreview = (row, showReasons = false, reasons = []) => {
    const keys = Object.keys(row.__origRow || row).slice(0, 4);
    const obj = row.__origRow || row;
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2">
          {keys.map((k) => (
            <div key={k} className="text-xs">
              <span className="text-gray-500">{k}:</span>{' '}
              <span className="text-gray-700 font-medium">{formatValue(obj[k])}</span>
            </div>
          ))}
        </div>
        {showReasons && reasons.length > 0 && (
          <div className="mt-2 pt-2 border-t border-red-100">
            <div className="flex items-start gap-1">
              <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-600">
                {reasons.map((reason, idx) => (
                  <div key={idx}>• {reason}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
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

  const downloadTemplate = (type) => {
    let data = [];
    let filename = '';

    if (type === 'ORDER') {
      data = [{
        'Job Card #': 'JC001',
        'Vehicle Registration No.': 'KA01AB1234',
        'Customer First Name': 'John',
        'Account': 'Doe',
        'Contact Phone': '9876543210',
        'Service Type': 'Paid Service',
        'Model Variant': 'Activa 6G',
        'Created Date/Time': '2026-01-15 10:30',
        'OTP No': '123456',
        'AMC Start Date': '2026-01-01',
        'AMC End Date': '2027-01-01',
        'Effective Final Delivery Estimate Date': '2026-01-16 17:00'
      }];
      filename = 'order_report_template.xlsx';
    } else if (type === 'REVENUE') {
      data = [{
        'Job Card Number': 'JC001',
        'Registration Number': 'KA01AB1234',
        'Customer Name': 'John Doe',
        'Service Type': 'Paid Service',
        'Job Card Date': '2026-01-15',
        'Job Card Closed Date': '2026-01-16',
        'Job Card Status': 'Closed',
        'Labour Revenue': 500,
        'Parts Revenue': 1200,
        'Lubes Revenue': 300,
        'Accessories Revenue': 0,
        'Total Job Card Revenue': 2000,
        'AMC Service': 'No',
        'Current KMs': 15000,
        'Frame Number': 'MDH123456789',
        'Model Name': 'Activa 6G'
      }];
      filename = 'revenue_report_template.xlsx';
    } else if (type === 'WORKSHOP') {
      data = [{
        'Job Card Number': 'JC001',
        'Customer Name': 'John Doe',
        'Customer Mobile': '9876543210',
        'Job Card Date': '2026-01-15',
        'Service Type': 'Paid Service',
        'Model Name': 'Activa 6G',
        'Current KM': 15000,
        'Frame Number': 'MDH123456789',
        'Part Category': 'Oil',
        'Part Description': 'Engine Oil 10W30'
      }];
      filename = 'workshop_sheet_template.xlsx';
    } else if (type === 'INVOICE') {
      data = [{
        'Job Card #': 'JC001',
        'Job Card Date': '2026-01-15',
        'Closed Date/ Time': '2026-01-16 16:00',
        'Job Card Status': 'Closed',
        'Vehicle Registration No.': 'KA01AB1234',
        'Customer First Name': 'John',
        'Customer Last Name': 'Doe',
        'Contact Phone': '9876543210',
        'Service Type': 'Paid Service',
        'Model Name': 'Activa 6G',
        'Frame #': 'MDH123456789',
        'Invoice Number': 'INV-2026-001',
        'Total Invoice Amount': 2000
      }];
      filename = 'invoice_report_template.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
    toast.success(`${filename} downloaded successfully`);
  };

  const downloadExcel = () => {
    try {
      const exportData = records.map(row => {
        const rowData = {};
        columns.forEach(col => {
          let val = row[col.accessor];
          if (col.accessor === 'createdAt' && val) {
            val = new Date(val).toISOString().split('T')[0];
          }
          rowData[col.header] = val || '';
        });
        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Service Job Cards");
      XLSX.writeFile(wb, `service_job_cards_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading Excel file');
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
      {/* Header (unchanged) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary">Service Import</h1>
          <p className="text-sm text-brand-text-secondary mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span>Manage and import service data reports.</span>
            <span className="text-brand-accent font-medium bg-brand-accent/10 px-2 py-0.5 rounded text-xs flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              All uploaded reports are intelligently synced & merged by Job Card Number
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {records.length > 0 && (
            <button
              onClick={downloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Export Excel
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

      {/* Upload Section (unchanged) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Order Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-pink-400 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xl group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-brand-text-primary">Order Report</h3>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-wider">Order Report</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileSelect(e.target.files[0], 'ORDER')}
              className="hidden"
              id="upload-order"
              disabled={!!isUploading}
            />
            <label
              htmlFor="upload-order"
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:bg-pink-50/50 hover:border-pink-400 transition-all ${isUploading === 'ORDER' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading === 'ORDER' ? (
                <div className="flex items-center gap-2 text-pink-600 font-medium">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  <span className="text-brand-text-primary font-bold text-sm">Upload Order Report</span>
                  <span className="text-xs text-brand-text-secondary text-center mt-1">
                    <strong className="text-pink-600 font-semibold">Key Data:</strong> Job Card #, Created Date/Time, Vehicle Reg No., Contact Phone, AMC Dates
                  </span>
                </>
              )}
            </label>
            <div className="text-center">
              <button
                onClick={(e) => { e.preventDefault(); downloadTemplate('ORDER'); }}
                className="text-pink-600 hover:text-pink-800 text-xs font-semibold hover:underline"
              >
                Download Sample Excel
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-brand-accent transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
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
              onChange={(e) => handleFileSelect(e.target.files[0], 'REVENUE')}
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
                  <span className="text-xs text-brand-text-secondary text-center mt-1">
                    <strong className="text-blue-600 font-semibold">Key Data:</strong> Labour, Parts, Lubes Revenue
                  </span>
                </>
              )}
            </label>
            <div className="text-center">
              <button
                onClick={(e) => { e.preventDefault(); downloadTemplate('REVENUE'); }}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold hover:underline"
              >
                Download Sample Excel
              </button>
            </div>
          </div>
        </div>

        {/* Workshop Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-orange-400 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
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
              onChange={(e) => handleFileSelect(e.target.files[0], 'WORKSHOP')}
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
                  <span className="text-xs text-brand-text-secondary text-center mt-1">
                    <strong className="text-orange-600 font-semibold">Key Data:</strong> Parts (Oil, Battery, Tyre, etc.)
                  </span>
                </>
              )}
            </label>
            <div className="text-center">
              <button
                onClick={(e) => { e.preventDefault(); downloadTemplate('WORKSHOP'); }}
                className="text-orange-600 hover:text-orange-800 text-xs font-semibold hover:underline"
              >
                Download Sample Excel
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Report */}
        <div className="bg-brand-surface p-5 rounded-xl shadow-sm border border-brand-border hover:border-purple-400 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-brand-text-primary">Invoice Report</h3>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-wider">Invoice Report</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileSelect(e.target.files[0], 'INVOICE')}
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
                  <span className="text-xs text-brand-text-secondary text-center mt-1">
                    <strong className="text-purple-600 font-semibold">Key Data:</strong> Closed Date/ Time, Invoice Number, Total Invoice Amount
                  </span>
                </>
              )}
            </label>
            <div className="text-center">
              <button
                onClick={(e) => { e.preventDefault(); downloadTemplate('INVOICE'); }}
                className="text-purple-600 hover:text-purple-800 text-xs font-semibold hover:underline"
              >
                Download Sample Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section (unchanged) */}
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

      {/* Data Table (unchanged) */}
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

      {/* View Modal (unchanged) */}
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
              {selectedJobCard.invoiceNumber && selectedJobCard.invoiceNumber !== 'N/A' && (
                <>
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Invoice Number</label>
                    <div className="text-brand-text-primary font-medium">{selectedJobCard.invoiceNumber}</div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Total Invoice Amount</label>
                    <div className="text-brand-text-primary font-bold text-brand-accent">₹{selectedJobCard.totalRevenue || 0}</div>
                  </div>
                </>
              )}
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
                  {selectedJobCard.createdAt ? new Date(selectedJobCard.createdAt).toLocaleString('en-GB') : 'N/A'}
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
                  {!selectedJobCard.invoiceNumber && selectedJobCard.totalRevenue > 0 && (
                    <div>
                      <label className="text-xs text-brand-text-secondary uppercase">Total Revenue</label>
                      <div className="text-brand-text-primary font-bold text-brand-accent">₹{selectedJobCard.totalRevenue || 0}</div>
                    </div>
                  )}
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

            <div className="border-t border-brand-border pt-4">
              <h4 className="text-sm font-bold text-brand-text-primary mb-3">Other Details</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedJobCard.otpNo && (
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">OTP No</label>
                    <div className="text-brand-text-primary font-medium">{selectedJobCard.otpNo}</div>
                  </div>
                )}
                {selectedJobCard.amcStartDate && (
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">AMC Start Date</label>
                    <div className="text-brand-text-primary font-medium">
                      {new Date(selectedJobCard.amcStartDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                )}
                {selectedJobCard.amcEndDate && (
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">AMC End Date</label>
                    <div className="text-brand-text-primary font-medium">
                      {new Date(selectedJobCard.amcEndDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                )}
                {selectedJobCard.estimatedDeliveryDate && (
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Est. Delivery Date</label>
                    <div className="text-brand-text-primary font-medium">
                      {new Date(selectedJobCard.estimatedDeliveryDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                )}
                {selectedJobCard.currentKM > 0 && (
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Current KM</label>
                    <div className="text-brand-text-primary font-medium">{selectedJobCard.currentKM}</div>
                  </div>
                )}
                {selectedJobCard.frameNumber && (
                  <div>
                    <label className="text-xs text-brand-text-secondary uppercase">Frame Number</label>
                    <div className="text-brand-text-primary font-medium">{selectedJobCard.frameNumber}</div>
                  </div>
                )}
                <div className="col-span-full">
                  <label className="text-xs text-brand-text-secondary uppercase">Flags</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {selectedJobCard.amc && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">AMC</span>}
                    {selectedJobCard.oil && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Oil</span>}
                    {selectedJobCard.battery && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Battery</span>}
                    {selectedJobCard.tyre && <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Tyre</span>}
                    {selectedJobCard.painting && <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Painting</span>}
                    {!selectedJobCard.amc && !selectedJobCard.oil && !selectedJobCard.battery && !selectedJobCard.tyre && !selectedJobCard.painting && (
                      <span className="text-brand-text-secondary text-sm">No flags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ✨ NEW: PROFESSIONAL PREVIEW & VALIDATION MODAL */}
      {isPreviewOpen && previewResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Data Validation Preview</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Review your data before importing to the system
                </p>
              </div>
              <button
                onClick={() => { setIsPreviewOpen(false); setPreviewResult(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">File Name</p>
                      <p className="text-sm font-medium text-gray-900 mt-1 truncate">{previewResult.fileName}</p>
                    </div>
                    <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Rows</p>
                      <p className="text-2xl font-bold text-gray-900">{previewResult.totalRows}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold">📊</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-700 uppercase tracking-wide">Valid Records</p>
                      <p className="text-2xl font-bold text-green-700">{previewResult.validRows.length}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-2">Ready to import</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-700 uppercase tracking-wide">Invalid Records</p>
                      <p className="text-2xl font-bold text-red-700">{previewResult.invalidRows.length}</p>
                    </div>
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <button
                    onClick={() => downloadInvalidRows(previewResult.invalidRows, `invalid_${previewResult.fileName}`)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium mt-2 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Download invalid rows
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setSelectedTab('summary')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'summary'
                    ? 'text-brand-accent border-b-2 border-brand-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Summary
              </button>
              <button
                onClick={() => setSelectedTab('valid')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'valid'
                    ? 'text-brand-accent border-b-2 border-brand-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✅ Valid Records ({previewResult.validRows.length})
              </button>
              <button
                onClick={() => setSelectedTab('invalid')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'invalid'
                    ? 'text-brand-accent border-b-2 border-brand-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ❌ Invalid Records ({previewResult.invalidRows.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
              {selectedTab === 'summary' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Validation Summary</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Your file contains <strong>{previewResult.totalRows}</strong> records. 
                          <strong className="text-green-700"> {previewResult.validRows.length}</strong> records are valid and ready to import. 
                          <strong className="text-red-700"> {previewResult.invalidRows.length}</strong> records have issues that need attention.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Common Issues Found</h3>
                    <div className="space-y-2">
                      {(() => {
                        const issueCount = {};
                        previewResult.invalidRows.forEach(row => {
                          row.__reasons.forEach(reason => {
                            issueCount[reason] = (issueCount[reason] || 0) + 1;
                          });
                        });
                        return Object.entries(issueCount).slice(0, 5).map(([issue, count]) => (
                          <div key={issue} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{issue}</span>
                            <span className="text-sm font-semibold text-red-600">{count} occurrence{count !== 1 ? 's' : ''}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> Download the invalid rows report to see detailed issues, fix them in your Excel file, and re-upload.
                    </p>
                  </div>
                </div>
              )}

              {selectedTab === 'valid' && (
                <div>
                  <div className="mb-3 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Showing first 20 of {previewResult.validRows.length} valid records
                    </p>
                  </div>
                  <div className="space-y-3">
                    {previewResult.validRows.slice(0, 20).map((row, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-green-700 font-medium mb-2">Excel Row #{row.__rowNumber}</div>
                            {renderDataPreview(row)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {previewResult.validRows.length > 20 && (
                      <div className="text-center text-sm text-gray-500 py-4">
                        + {previewResult.validRows.length - 20} more valid records
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'invalid' && (
                <div>
                  <div className="mb-3 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {previewResult.invalidRows.length} records need attention
                    </p>
                  </div>
                  <div className="space-y-3">
                    {previewResult.invalidRows.map((row, idx) => (
                      <div key={idx} className="border border-red-200 rounded-lg p-3 bg-red-50">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-red-700 font-medium mb-2">Excel Row #{row.__rowNumber}</div>
                            {renderDataPreview(row, true, row.__reasons)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => { setIsPreviewOpen(false); setPreviewResult(null); }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => downloadInvalidRows(previewResult.invalidRows, `invalid_${previewResult.fileName}`)}
                className="px-4 py-2 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-100 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Invalid Rows
              </button>
              <button
                onClick={confirmImportValidRows}
                disabled={isUploading || previewResult.validRows.length === 0}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  previewResult.validRows.length === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Import {previewResult.validRows.length} Valid Records
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

          {/* ✨ NEW: PROFESSIONAL IMPORT COMPLETED MODAL */}
      {isResultOpen && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${importResult.importedCount > 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {importResult.importedCount > 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Import Completed</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {importResult.importedCount > 0 
                      ? `Successfully processed your ${importResult.importedRows[0]?.__origRow?.type || 'data'} file`
                      : 'No records were imported'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsResultOpen(false); setImportResult(null); fetchRecords(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-700 uppercase tracking-wide">Successfully Imported</p>
                      <p className="text-3xl font-bold text-green-700 mt-1">{importResult.importedCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-green-600">
                      {importResult.importedCount === 1 ? 'record' : 'records'} added to database
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 bg-gradient-to-r from-red-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-700 uppercase tracking-wide">Failed / Invalid</p>
                      <p className="text-3xl font-bold text-red-700 mt-1">{importResult.invalidRows.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {importResult.invalidRows.length > 0 ? (
                      <button
                        onClick={() => downloadInvalidRows(importResult.invalidRows, `invalid_after_import_${new Date().toISOString().split('T')[0]}.xlsx`)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download invalid records
                      </button>
                    ) : (
                      <p className="text-xs text-green-600">All records imported successfully!</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-700 uppercase tracking-wide">Success Rate</p>
                      <p className="text-3xl font-bold text-blue-700 mt-1">
                        {Math.round((importResult.importedCount / (importResult.importedCount + importResult.invalidRows.length)) * 100)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(importResult.importedCount / (importResult.importedCount + importResult.invalidRows.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setSelectedTab('summary')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'summary'
                    ? 'text-brand-accent border-b-2 border-brand-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Summary
              </button>
              <button
                onClick={() => setSelectedTab('valid')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'valid'
                    ? 'text-brand-accent border-b-2 border-brand-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✅ Imported Records ({importResult.importedCount})
              </button>
              {importResult.invalidRows.length > 0 && (
                <button
                  onClick={() => setSelectedTab('invalid')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    selectedTab === 'invalid'
                      ? 'text-brand-accent border-b-2 border-brand-accent'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ❌ Failed Records ({importResult.invalidRows.length})
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
              {selectedTab === 'summary' && (
                <div className="space-y-6">
                  {importResult.invalidRows.length > 0 ? (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-900">Partial Import Completed</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              {importResult.importedCount} records were successfully imported. 
                              {importResult.invalidRows.length} records failed due to validation issues.
                            </p>
                            <p className="text-sm text-yellow-700 mt-2">
                              💡 <strong>Next Step:</strong> Download the failed records, fix the issues in your Excel file, and re-upload.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Common Issues Found</h3>
                        <div className="space-y-2">
                          {(() => {
                            const issueCount = {};
                            importResult.invalidRows.forEach(row => {
                              row.__reasons?.forEach(reason => {
                                issueCount[reason] = (issueCount[reason] || 0) + 1;
                              });
                            });
                            return Object.entries(issueCount).slice(0, 5).map(([issue, count]) => (
                              <div key={issue} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{issue}</span>
                                <span className="text-sm font-semibold text-red-600">{count} occurrence{count !== 1 ? 's' : ''}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-green-900 mb-2">All Records Imported Successfully! 🎉</h3>
                      <p className="text-sm text-green-700">
                        All {importResult.importedCount} records have been successfully added to your database.
                      </p>
                    </div>
                  )}

                  {importResult.importedCount > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">What's Next?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• View imported records in the table below</li>
                        <li>• Use search to find specific job cards</li>
                        <li>• Export data to Excel anytime</li>
                        <li>• Upload more reports to update existing records</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'valid' && importResult.importedCount > 0 && (
                <div>
                  <div className="mb-3 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Showing first 20 of {importResult.importedCount} successfully imported records
                    </p>
                  </div>
                  <div className="space-y-3">
                    {importResult.importedRows.slice(0, 20).map((row, idx) => {
                      const displayRow = row.__origRow || row;
                      const keys = Object.keys(displayRow).slice(0, 4);
                      return (
                        <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs text-green-700 font-medium mb-2">Record #{idx + 1}</div>
                              <div className="grid grid-cols-2 gap-2">
                                {keys.map((k) => (
                                  <div key={k} className="text-xs">
                                    <span className="text-gray-600">{k}:</span>{' '}
                                    <span className="text-gray-800 font-medium">{String(displayRow[k]).slice(0, 40)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {importResult.importedRows.length > 20 && (
                      <div className="text-center text-sm text-gray-500 py-4">
                        + {importResult.importedRows.length - 20} more imported records
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'invalid' && importResult.invalidRows.length > 0 && (
                <div>
                  <div className="mb-3 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {importResult.invalidRows.length} records failed to import
                    </p>
                    <button
                      onClick={() => downloadInvalidRows(importResult.invalidRows, `failed_records_${new Date().toISOString().split('T')[0]}.xlsx`)}
                      className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 text-sm flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Export All Failed
                    </button>
                  </div>
                  <div className="space-y-3">
                    {importResult.invalidRows.map((row, idx) => (
                      <div key={idx} className="border border-red-200 rounded-lg p-3 bg-red-50">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-red-700 font-medium mb-2">Excel Row #{row.__rowNumber}</div>
                            {row.__reasons && (
                              <div className="mb-2 p-2 bg-red-100 rounded text-xs text-red-800">
                                <strong>Issues:</strong> {row.__reasons.join(', ')}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              {Object.keys(row.__origRow || row).slice(0, 4).map((k) => (
                                <div key={k} className="text-xs">
                                  <span className="text-gray-600">{k}:</span>{' '}
                                  <span className="text-gray-800">{String((row.__origRow || row)[k]).slice(0, 40)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => { 
                  setIsResultOpen(false); 
                  setImportResult(null); 
                  fetchRecords(); 
                }}
                className="px-6 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Clear All Confirmation Modal (unchanged) */}
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

export default ServiceImport;