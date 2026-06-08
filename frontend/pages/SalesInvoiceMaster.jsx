import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { salesInvoiceApi } from '../api/salesInvoiceApi.js';
import { FileSpreadsheet, CheckCircle, XCircle, AlertCircle, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const SalesInvoiceMaster = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [wizardStep, setWizardStep] = useState(1);
  const [isConfirmImportOpen, setIsConfirmImportOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (isPreviewOpen) setWizardStep(2);
  }, [isPreviewOpen]);

  useEffect(() => {
    if (isResultOpen) setWizardStep(4);
  }, [isResultOpen]);

  const fetchRecords = async (searchTerm = search) => {
    try {
      const data = await salesInvoiceApi.getAll(searchTerm);
      setRecords(data.map((r, i) => ({ ...r, sNo: i + 1 })));
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
    }
  };

  const formatValue = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'number' && val > 40000 && val < 50000) {
      const date = new Date((val - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date.toLocaleDateString('en-GB');
    }
    return String(val);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const rawRowsUnfiltered = XLSX.utils.sheet_to_json(ws, { defval: '' });
          
          const rawRows = rawRowsUnfiltered.filter(row => {
            return Object.values(row).some(val => String(val).trim() !== '');
          });

          if (rawRows.length > 0) {
            const firstRowKeys = Object.keys(rawRows[0]).map(k => k.toLowerCase());
            const hasKey = (names) => names.some(n => firstRowKeys.some(k => k.includes(n.toLowerCase())));
            
            let isValidFormat = true;
            // Require uniquely identifying columns for Sales Invoice Master
            if (!hasKey(['actual deliver date', 'deliver date', 'delivery']) || !hasKey(['assigned to', 'dse'])) {
              isValidFormat = false;
            }

            if (!isValidFormat) {
              setPreviewResult({
                type: 'SALES_INVOICE',
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
            const validation = validateRow(r);
            if (validation.valid) {
              validRows.push({ __origRow: r, __rowNumber: idx + 2, __reasons: validation.reasons });
            } else {
              rowsWithIssues.push({ __origRow: r, __rowNumber: idx + 2, __reasons: validation.reasons });
            }
          });

          setPreviewResult({ 
            type: 'SALES_INVOICE', 
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
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsArrayBuffer(file);
    }, 200);
  };

  const validateRow = (row) => {
    const reasons = [];
    const getVal = (names) => {
      for (const n of names) {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes(n.toLowerCase())) return row[key];
        }
      }
      return '';
    };

    const name = getVal(['customer', 'name']);
    const phone = getVal(['mobile', 'phone', 'contact']);
    const account = getVal(['account']);
    
    if ((!name || String(name).trim() === '') && 
        (!phone || String(phone).trim() === '') && 
        (!account || String(account).trim() === '')) {
      reasons.push('Missing Customer Name, Mobile, and Account');
    }

    return { valid: reasons.length === 0, reasons };
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

  const confirmImportValidRows = async () => {
    if (!previewResult) return;
    if (!previewResult.validRows || previewResult.validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsPreviewOpen(false);
    setIsUploading(true);
    setWizardStep(3);
    try {
      const exportRows = previewResult.validRows.map(v => v.__origRow);
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Import');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const file = new File([blob], `import_valid_${previewResult.fileName || 'upload'}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const result = await salesInvoiceApi.upload(file);
      const importedCount = result.imported || previewResult.validRows.length;
      toast.success(`Imported ${importedCount} records`);
      setImportResult({ importedCount, importedRows: previewResult.validRows, invalidRows: previewResult.invalidRows });
      setIsResultOpen(true);
      setPreviewResult(null);
      fetchRecords('');
      setSearch('');
    } catch (err) {
      console.error('Import failed:', err);
      toast.error(err.message || 'Import failed');
      setImportResult({ importedCount: 0, importedRows: [], invalidRows: previewResult ? previewResult.invalidRows : [] });
      setIsResultOpen(true);
    } finally {
      setIsUploading(false);
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

  const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Preview' },
    { num: 3, label: 'Importing' },
    { num: 4, label: 'Complete' }
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
              onChange={(e) => handleFileSelect(e.target.files[0])}
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
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Account</label>
                <div className="text-brand-text-primary font-medium">{selectedInvoice.account || 'N/A'}</div>
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

      {/* Wizard Modal */}
      <Modal 
        isOpen={isPreviewOpen || isResultOpen} 
        onClose={() => {
          setIsPreviewOpen(false);
          setIsResultOpen(false);
          setPreviewResult(null);
          setImportResult(null);
        }} 
        title="Sales Invoice Import Wizard"
        maxWidth="max-w-4xl"
      >
        <div className="bg-white rounded-lg flex h-[600px] overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-col h-full">
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border px-4">
                {steps.map((step, idx) => {
                  const isActive = wizardStep === step.num;
                  const isPast = wizardStep > step.num || (step.num === 1);
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
                        The file you uploaded does not match the required columns for Sales Invoice Master. 
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

                      {previewResult.validRows.length > 0 && (
                        <div className="border border-brand-border rounded-lg overflow-hidden">
                          <div className="bg-brand-surface px-4 py-3 border-b border-brand-border">
                            <h4 className="text-sm font-bold text-brand-text-primary">Previewing valid records</h4>
                          </div>
                          <div className="max-h-[240px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-brand-surface sticky top-0 z-10 shadow-sm">
                                <tr>
                                  {['Customer Name', 'Contact Info', 'Vehicle Reg No', 'Vehicle Model', 'Assigned To (DSE)'].map(title => (
                                    <th key={title} className="p-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-border">
                                      {title}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-brand-border bg-white">
                                {previewResult.validRows.slice(0, 10).map((row, idx) => {
                                  const displayRow = row.__origRow || row;
                                  
                                  const getVal = (names) => {
                                    for (const n of names) {
                                      for (const key of Object.keys(displayRow)) {
                                        if (key.toLowerCase().includes(n.toLowerCase())) return displayRow[key];
                                      }
                                    }
                                    return '—';
                                  };

                                  const extractedData = [
                                    getVal(['customer first name', 'customer name', 'name', 'customer']),
                                    getVal(['mobile', 'phone', 'contact']),
                                    getVal(['permanent reg no', 'reg no', 'vehicle reg']),
                                    getVal(['model name', 'model']),
                                    getVal(['assigned to (dse) name', 'assigned to', 'dse'])
                                  ];

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
                            {previewResult.validRows.length > 10 && (
                              <div className="p-3 text-center text-xs text-brand-text-secondary bg-brand-surface/50 border-t border-brand-border font-medium">
                                Showing first 10 of {previewResult.validRows.length} valid rows
                              </div>
                            )}
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
                      
                      <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-4">
                        <button onClick={() => { setIsPreviewOpen(false); setPreviewResult(null); }} className="px-6 py-2 rounded-lg border border-brand-border text-brand-text-secondary font-bold hover:bg-brand-hover text-sm">Cancel</button>
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
                  <div className="flex flex-col items-center justify-center h-full py-12 space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-blue-100 animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-brand-accent border-t-transparent animate-spin"></div>
                      <FileSpreadsheet className="w-10 h-10 text-brand-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-brand-text-primary">Importing Data...</h3>
                      <p className="text-brand-text-secondary max-w-xs mx-auto">Please wait while we process and save your sales invoices securely to the database.</p>
                    </div>
                  </div>
                )}

                {/* Step 4: Complete */}
                {wizardStep === 4 && importResult && (
                  <div className="flex flex-col h-full">
                    <div className="text-center mb-8">
                      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-brand-text-primary mb-2">Import Successful!</h3>
                      <p className="text-brand-text-secondary">
                        Successfully imported <strong className="text-green-600">{importResult.importedCount}</strong> records.
                      </p>
                      {importResult.invalidRows && importResult.invalidRows.length > 0 && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                          <p className="text-red-700 font-bold mb-3 text-lg">{importResult.invalidRows.length} records had errors and were skipped.</p>
                          <button 
                            onClick={() => downloadInvalidRows(importResult.invalidRows, `failed_records.xlsx`)}
                            className="px-4 py-2 bg-white text-red-700 border border-red-200 font-bold rounded hover:bg-red-50 flex items-center gap-2 text-sm"
                          >
                            <Download className="w-4 h-4" /> Download Error Report
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-4 mt-auto pt-4 border-t border-brand-border">
                      <button
                        onClick={() => {
                          setIsResultOpen(false);
                          setImportResult(null);
                        }}
                        className="px-8 py-3 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                      >
                        Finish & Close
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default SalesInvoiceMaster;
