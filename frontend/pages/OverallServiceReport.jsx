import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import { servicePaymentCollectionApi } from '../api/servicePaymentCollectionApi.js';

const OverallServiceReport = ({ user }) => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [maxReceipts, setMaxReceipts] = useState(0);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Job Cards (Base Data)
      const { serviceJobCardApi } = await import('../api/serviceJobcard.js');
      const jobCards = await serviceJobCardApi.getAll('', false);
      const jcList = Array.isArray(jobCards) ? jobCards : [];

      // 2. Fetch Payments
      const response = await servicePaymentCollectionApi.getAll(1, 999999, null, 'all', 'all');
      const paymentsData = response.data || response;
      const paymentList = Array.isArray(paymentsData) ? paymentsData : [];

      // Group payments by jobCardNumber
      const paymentsByJc = {};
      paymentList.forEach(payment => {
        const jcNo = payment.jobCardNumber;
        if (!jcNo) return;
        
        if (!paymentsByJc[jcNo]) paymentsByJc[jcNo] = [];
        paymentsByJc[jcNo].push(payment);
      });

      // 3. Merge data
      let currentMaxReceipts = 0;
      const formattedData = jcList.map((jc, index) => {
        const jcNo = jc.jobCardNumber || 'N/A';
        const jcPayments = paymentsByJc[jcNo] || [];
        
        const receipts = [];
        let status = jc.status || 'Pending';
        let hasClearedPayment = false;

        jcPayments.forEach(payment => {
           // Main payment
           if (payment.receiptNo) {
             receipts.push({
               receiptNo: payment.receiptNo,
               paymentType: payment.paymentTypeMaster?.name || payment.paymentType || 'N/A',
               amount: payment.recAmt || 0
             });
           }
           
           // Session payments
           if (payment.paymentSessions && Array.isArray(payment.paymentSessions)) {
             payment.paymentSessions.forEach(session => {
                receipts.push({
                   receiptNo: session.receiptNo || 'N/A',
                   paymentType: session.paymentType || 'N/A',
                   amount: session.amount || 0
                });
             });
           }

           if (payment.paymentStatus === 'completed') {
             hasClearedPayment = true;
           }
        });

        if (hasClearedPayment) status = 'Completed';

        if (receipts.length > currentMaxReceipts) {
          currentMaxReceipts = receipts.length;
        }

        const receiptAmountTotal = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const invoicedAmount = Number(jc.totalRevenue || 0);
        const difference = invoicedAmount - receiptAmountTotal;
        const phoneNumber = jc.mobileNumber || jc.phone || jc.contactPhone || 'N/A';

        const rowData = {
          sNo: index + 1,
          jobCardDate: jc.createdAt || jc.date,
          jobCardNo: jcNo,
          phoneNumber: phoneNumber,
          branchName: jc.branchName || 'N/A',
          branchCode: jc.branchCode || 'N/A',
          invoiceNumber: jc.invoiceNumber || 'N/A',
          invoicedDate: jc.closedDate || jc.updatedAt || jc.createdAt,
          invoicedAmount: invoicedAmount,
          receiptAmountTotal: receiptAmountTotal,
          invoiceAmount: invoicedAmount,
          difference: difference,
          status: status,
        };

        // Populate dynamic receipts
        for (let i = 0; i < receipts.length; i++) {
           const r = receipts[i];
           rowData[`receiptNo${i+1}`] = r ? r.receiptNo : '';
           rowData[`paymentType${i+1}`] = r ? r.paymentType : '';
           rowData[`paymentAmount${i+1}`] = r ? r.amount : '';
        }

        return rowData;
      });

      setReportData(formattedData);
      setFilteredData(formattedData);
      setMaxReceipts(currentMaxReceipts);
    } catch (error) {
      console.error('Error fetching overall report data:', error);
      toast.error('Error fetching overall report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFilter();
  }, [search, reportData]);

  const handleFilter = () => {
    let filtered = reportData;
    
    if (fromDate && toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.jobCardDate);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return itemDate >= from && itemDate <= to;
      });
    }
    
    if (statusFilter) {
      filtered = filtered.filter(item => {
         return item.status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(item => {
        const matchJc = String(item.jobCardNo || '').toLowerCase().includes(lowerSearch);
        const matchPhone = String(item.phoneNumber || '').toLowerCase().includes(lowerSearch);
        let matchReceipt = false;
        
        // Check dynamic receipt columns
        for (let i = 1; i <= maxReceipts; i++) {
          if (String(item[`receiptNo${i}`] || '').toLowerCase().includes(lowerSearch)) {
            matchReceipt = true;
            break;
          }
        }
        
        return matchJc || matchPhone || matchReceipt;
      });
    }
    
    setFilteredData(filtered);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('');
    setSearch('');
    fetchReportData();
  };

  const downloadExcel = () => {
    try {
      const headers = columns.map(col => col.header).join('\t');
      const rows = filteredData.map(row => columns.map(col => row[col.accessor] || '').join('\t')).join('\n');
      const content = headers + '\n' + rows;
      const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overall_service_report_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading Excel file');
    }
  };

  const baseColumns1 = [
    { header: "SNo", accessor: "sNo" },
    {
      header: "JC Created Date",
      accessor: "jobCardDate",
      render: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      },
    },
    { header: "Jobcard No", accessor: "jobCardNo" },
    { header: "Phone Number", accessor: "phoneNumber" },
    { header: "Branch Name", accessor: "branchName" },
    { header: "Branch Code", accessor: "branchCode" },
    { header: "Invoice Number", accessor: "invoiceNumber" },
    {
      header: "Invoiced Date",
      accessor: "invoicedDate",
      render: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      },
    },
    { header: "Invoiced Amount", accessor: "invoicedAmount" },
  ];

  const receiptColumns = [];
  for (let i = 1; i <= maxReceipts; i++) {
    receiptColumns.push({ header: `R${i} No`, accessor: `receiptNo${i}` });
    receiptColumns.push({ header: `R${i} Type`, accessor: `paymentType${i}` });
    receiptColumns.push({ header: `R${i} Amt`, accessor: `paymentAmount${i}` });
  }

  const baseColumns2 = [
    { header: "Receipt Amt Total", accessor: "receiptAmountTotal" },
    { header: "Invoice Amount", accessor: "invoiceAmount" },
    { header: "Difference", accessor: "difference" },
    { 
      header: "Status", 
      accessor: "status",
      render: (value) => {
        const isCompleted = value === 'Completed';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {value}
          </span>
        );
      }
    },
  ];

  const columns = [...baseColumns1, ...receiptColumns, ...baseColumns2];

  if (loading) {
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
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Overall Service Report</h1>
      </div>
      
      <div className="bg-brand-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
              Search Records
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by JC No, Phone, Receipt No..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                className="w-full pl-10 pr-4 py-2 bg-white border border-brand-border text-brand-text-primary rounded-lg focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              >
                <option value="">All</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button 
                onClick={handleFilter}
                className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg text-sm">
                Filter
              </button>
              <button 
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                Reset
              </button>
              <button 
                onClick={downloadExcel}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto max-w-[calc(100vw-5rem)]">
        <DataTable 
          columns={columns} 
          data={filteredData}
        />
      </div>
    </div>
  );
};

export default OverallServiceReport;
