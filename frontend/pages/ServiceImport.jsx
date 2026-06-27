// src/pages/ServiceImport.jsx
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { serviceJobCardApi } from '../api/serviceJobcard';
import { Coins, Wrench, Receipt, CheckCircle, XCircle, AlertCircle, Download, FileSpreadsheet, ChevronRight } from 'lucide-react';
const XLSX = window.XLSX;

const ServiceImport = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [isConfirmImportOpen, setIsConfirmImportOpen] = useState(false);
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

    setIsUploading(type);

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRowsUnfiltered = XLSX.utils.sheet_to_json(ws, { defval: '' });
        // Filter out rows where every column is entirely empty
        const rawRows = rawRowsUnfiltered.filter(row => {
          return Object.values(row).some(val => String(val).trim() !== '');
        });

        if (rawRows.length > 0) {
          const firstRowKeys = Object.keys(rawRows[0]).map(k => k.toLowerCase());
          const hasKey = (names) => names.some(n => firstRowKeys.some(k => k.includes(n.toLowerCase())));
          
          let isValidFormat = true;
          if (type === 'ORDER') {
            if (!hasKey(['job card', 'jobcard', 'job_card']) || !hasKey(['vehicle reg', 'registration', 'created date'])) isValidFormat = false;
            if (hasKey(['invoice date', 'inv date', 'invoice number']) || hasKey(['labour revenue'])) isValidFormat = false;
          } else if (type === 'REVENUE') {
            if (!hasKey(['job card', 'jobcard', 'job_card']) || (!hasKey(['labour']) && !hasKey(['parts']) && !hasKey(['lubes']))) isValidFormat = false;
            if (hasKey(['invoice date', 'inv date', 'invoice number'])) isValidFormat = false;
          } else if (type === 'INVOICE') {
            if (!hasKey(['job card', 'jobcard', 'job_card']) || !hasKey(['invoice number', 'invoice'])) isValidFormat = false;
            if (hasKey(['created date'])) isValidFormat = false;
          } else if (type === 'WORKSHOP') {
            // No strict format rules for workshop sheet, accept any Excel file
            isValidFormat = true;
          }

          if (!isValidFormat) {
            setPreviewResult({
              type,
              fileName: file.name,
              formatError: true
            });
            setIsPreviewOpen(true);
            return;
          }
        }

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
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    }, 200);
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
      // No strict row validation for workshop sheets, accept all rows
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

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await serviceJobCardApi.remove(recordToDelete.id);
      toast.success('Record deleted');
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
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
          {(records.length > 0 && user?.username === 'ROOT' && user?.role === 'SUPER_ADMIN') && (
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
              onClick={() => {
                setRecordToDelete(record);
                setIsDeleteModalOpen(true);
              }}
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

      {/* ✨ IMPORT WIZARD MODAL */}
      <Modal
        isOpen={isPreviewOpen || isResultOpen || (isUploading && !!previewResult)}
        onClose={() => { 
          if (isUploading) return;
          setIsPreviewOpen(false); 
          setIsResultOpen(false); 
          setPreviewResult(null); 
          if (isResultOpen) fetchRecords();
        }}
        title="Import Data Wizard"
        maxWidth="max-w-4xl"
        maxHeight="max-h-[95vh]"
      >
        {(() => {
          const isWizardOpen = isPreviewOpen || isResultOpen || (isUploading && !!previewResult);
          if (!isWizardOpen) return null;
          
          let wizardStep = 2; // Default to Preview
          if (isResultOpen) wizardStep = 4;
          else if (isUploading && !!previewResult) wizardStep = 3;

          const steps = [
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Preview' },
            { num: 3, label: 'Import' },
            { num: 4, label: 'Complete' }
          ];

          return (
            <div className="flex flex-col h-full">
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border px-4">
                {steps.map((step, idx) => {
                  const isActive = wizardStep === step.num;
                  const isPast = wizardStep > step.num || (step.num === 1); // Upload is always past
                  return (
                    <React.Fragment key={step.num}>
                      <div className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors
                          ${isPast && !isActive ? 'bg-green-500 text-white' : 
                            isActive ? 'bg-brand-accent text-white' : 
                            'bg-gray-200 text-gray-500'}`}>
                          {isPast && !isActive ? <CheckCircle className="w-5 h-5" /> : step.num}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isActive || isPast ? 'text-brand-text-primary' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`flex-1 h-[2px] -mt-6 mx-2 transition-colors ${wizardStep > step.num ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="flex-1 overflow-auto">
                {/* Step 2: Preview */}
                {wizardStep === 2 && previewResult && (
                  previewResult.formatError ? (
                    <div className="space-y-6 py-8 text-center">
                      <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-700">Invalid File Format</h3>
                      <p className="text-brand-text-secondary max-w-md mx-auto text-lg">
                        The file you uploaded does not match the required columns for the <strong className="text-brand-text-primary">{previewResult.type}</strong> section. 
                      </p>
                      <p className="text-sm text-brand-text-secondary">Please check your file headers or download the sample template.</p>
                      <div className="flex justify-center pt-8">
                        <button onClick={() => { setIsPreviewOpen(false); setPreviewResult(null); }} className="px-8 py-3 rounded-lg bg-white border border-brand-border text-brand-text-secondary font-bold hover:bg-brand-hover transition-colors">
                          Go Back & Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-text-primary text-center">
                      {previewResult.validRows.length} valid rows ready to import.
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-brand-surface p-3 rounded-lg border border-brand-border text-center shadow-sm">
                        <div className="text-xs text-brand-text-secondary font-semibold uppercase tracking-wider mb-1">Total Rows</div>
                        <div className="text-xl font-bold text-brand-text-primary">{previewResult.totalRows}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center shadow-sm">
                        <div className="text-xs text-green-700 font-semibold uppercase tracking-wider mb-1">Valid</div>
                        <div className="text-xl font-bold text-green-700">{previewResult.validRows.length}</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center shadow-sm">
                        <div className="text-xs text-red-700 font-semibold uppercase tracking-wider mb-1">Errors</div>
                        <div className="text-xl font-bold text-red-700">{previewResult.invalidRows.length}</div>
                      </div>
                    </div>

                    {previewResult.validRows.length > 0 && previewResult.type !== 'WORKSHOP' && (
                      <div className="border border-brand-border rounded-lg overflow-hidden">
                        <div className="bg-brand-surface px-4 py-3 border-b border-brand-border">
                          <h4 className="text-sm font-bold text-brand-text-primary">Previewing valid records</h4>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-brand-surface sticky top-0 z-10 shadow-sm">
                              <tr>
                                {(() => {
                                  let headers = ['Job Card No', 'Vehicle Reg No', 'Customer Name', 'Contact Info', 'Status'];
                                  if (previewResult.type === 'REVENUE') {
                                    headers = ['Customer Name', 'Labour Rev', 'Parts Rev', 'Lubes Rev'];
                                  } else if (previewResult.type === 'INVOICE') {
                                    headers = ['Job Card', 'Invoice Number', 'Customer First Name', 'Final Amount'];
                                  } else if (previewResult.type === 'WORKSHOP') {
                                    const firstRow = previewResult.validRows[0]?.__origRow || {};
                                    headers = Object.keys(firstRow).slice(0, 5);
                                  }
                                  
                                  return headers.map(title => (
                                    <th key={title} className="p-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-border">
                                      {title}
                                    </th>
                                  ));
                                })()}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border bg-white">
                              {previewResult.validRows.map((row, idx) => {
                                const displayRow = row.__origRow || row;
                                
                                const getVal = (names) => {
                                  for (const n of names) {
                                    for (const key of Object.keys(displayRow)) {
                                      if (key.toLowerCase().includes(n.toLowerCase())) return displayRow[key];
                                    }
                                  }
                                  return '—';
                                };

                                let extractedData = [];
                                if (previewResult.type === 'REVENUE') {
                                  extractedData = [
                                    getVal(['customer name', 'name', 'customer', 'first name', 'last name']),
                                    getVal(['labour', 'labour revenue', 'labor']),
                                    getVal(['parts', 'parts revenue']),
                                    getVal(['lubes', 'lubes revenue'])
                                  ];
                                } else if (previewResult.type === 'INVOICE') {
                                  extractedData = [
                                    getVal(['job card', 'jobcard', 'job_card', 'jobcard#', 'job card #']),
                                    getVal(['invoice', 'invoice number', 'inv no']),
                                    getVal(['customer first name', 'customer name', 'name', 'customer', 'first name']),
                                    getVal(['final amount', 'amount', 'total', 'invoice amount'])
                                  ];
                                } else if (previewResult.type === 'WORKSHOP') {
                                  const keys = Object.keys(displayRow).slice(0, 5);
                                  extractedData = keys.map(k => displayRow[k]);
                                } else {
                                  extractedData = [
                                    getVal(['job card', 'jobcard', 'job_card', 'jobcard#', 'job card #']),
                                    getVal(['vehicle reg', 'vehicle_reg', 'registration no', 'registration', 'reg no']),
                                    getVal(['customer name', 'name', 'customer', 'first name', 'last name']),
                                    getVal(['contact phone', 'phone', 'mobile', 'contact', 'contact info']),
                                    getVal(['status', 'state'])
                                  ];
                                }

                                return (
                                  <tr key={idx} className="hover:bg-brand-surface/50 transition-colors">
                                    {extractedData.map((val, colIdx) => (
                                      <td key={colIdx} className="p-3 text-xs text-brand-text-primary font-medium truncate max-w-[150px]" title={String(val)}>
                                        {formatValue(val)}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {previewResult.invalidRows.length > 0 && (
                      <div className="text-center mt-4">
                        <button 
                          onClick={() => downloadInvalidRows(previewResult.invalidRows, `invalid_rows_${previewResult.fileName || 'upload'}.xlsx`)}
                          className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded hover:bg-red-100 flex items-center justify-center gap-2 mx-auto text-sm"
                        >
                          <Download className="w-4 h-4" /> Download {previewResult.invalidRows.length} invalid rows
                        </button>
                      </div>
                    )}
                    
                      <div className="flex justify-end gap-3 p-4 border-t border-brand-border mt-auto bg-white sticky bottom-0 z-20 shadow-[0_-10px_15px_-3px_rgba(255,255,255,1)]">
                        <button onClick={() => { setIsPreviewOpen(false); setPreviewResult(null); }} className="px-6 py-2 rounded-lg border border-brand-border text-brand-text-secondary font-bold hover:bg-brand-hover text-sm bg-white">Cancel</button>
                        <button 
                          onClick={() => setIsConfirmImportOpen(true)} 
                          disabled={previewResult.validRows.length === 0}
                          className="px-6 py-2 rounded-lg bg-brand-accent text-white font-bold hover:bg-brand-accent-hover disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                          Import {previewResult.validRows.length} Valid Records
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Step 3: Importing */}
                {wizardStep === 3 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <svg className="animate-spin h-16 w-16 text-brand-accent mb-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-brand-text-primary">Importing data...</h3>
                    <p className="text-brand-text-secondary mt-2 text-lg">Please wait while your records are being processed.</p>
                  </div>
                )}

                {/* Step 4: Complete */}
                {wizardStep === 4 && importResult && (
                  <div className="space-y-6 text-center py-8">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-brand-text-primary">
                      {importResult.importedCount} records imported successfully!
                    </h3>
                    
                    {importResult.invalidRows && importResult.invalidRows.length > 0 && (
                      <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
                        <p className="text-red-700 font-bold mb-3 text-lg">{importResult.invalidRows.length} records had errors and were skipped.</p>
                        <button 
                          onClick={() => downloadInvalidRows(importResult.invalidRows, `failed_records.xlsx`)}
                          className="px-6 py-3 bg-red-100 text-red-800 font-bold rounded-lg hover:bg-red-200 inline-flex items-center gap-2 transition-colors"
                        >
                          <Download className="w-5 h-5" /> Download Failed Records
                        </button>
                      </div>
                    )}

                    <div className="mt-auto p-4 border-t border-brand-border flex justify-center bg-white sticky bottom-0 z-20 shadow-[0_-10px_15px_-3px_rgba(255,255,255,1)]">
                      <button 
                        onClick={() => { setIsResultOpen(false); setImportResult(null); fetchRecords(); }}
                        className="px-10 py-3 rounded-lg bg-brand-accent text-white font-bold hover:bg-brand-accent-hover text-lg transition-colors"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Clear All"
        maxWidth="max-w-md"
      >
        <p className="text-brand-text-secondary mb-6">
          Are you sure you want to delete all <strong>{records.length}</strong> service job card records? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
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
      </Modal>

      <ConfirmModal
        isOpen={isConfirmImportOpen}
        onClose={() => setIsConfirmImportOpen(false)}
        onConfirm={confirmImportValidRows}
        title="Confirm Import"
        message={`Are you sure you want to import ${previewResult?.validRows?.length || 0} valid records to the database?`}
        confirmText="Yes, Import"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Confirm Delete"
        message={
          <span>
            Are you sure you want to delete service job card <strong>{recordToDelete?.jobCardNo}</strong>?
          </span>
        }
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default ServiceImport;