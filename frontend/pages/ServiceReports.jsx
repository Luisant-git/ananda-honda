import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import { servicePaymentCollectionApi } from '../api/servicePaymentCollectionApi.js';

const ServiceReports = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await servicePaymentCollectionApi.getAll(1, 999999);
      const formattedData = response.data.map((payment, index) => ({
        sNo: index + 1,
        id: payment.id,
        date: payment.date,
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        contactNo: payment.customer.contactNo,
        address: payment.customer.address,
        recAmt: payment.recAmt,
        paymentType: payment.paymentType,
        paymentStatus: payment.paymentStatus,
        vehicleNumber: payment.vehicleNumber || 'N/A',
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || 'N/A',
        typeOfCollection: payment.typeOfCollection?.typeOfCollect || 'N/A',
        vehicleModel: payment.vehicleModel?.model || 'N/A',
        enteredBy: payment.user?.username || 'N/A',
        refNo: payment.refNo || 'N/A',
        remarks: payment.remarks || 'N/A',
        jobCardNumber: payment.jobCardNumber || 'N/A',
        customerId: payment.customerId,
        paymentModeId: payment.paymentModeId,
        typeOfPaymentId: payment.typeOfPaymentId,
        typeOfCollectionId: payment.typeOfCollectionId,
        vehicleModelId: payment.vehicleModelId,
      }));
      setReportData(formattedData);
      setFilteredData(formattedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const handleFilter = () => {
    let filtered = reportData;
    
    if (fromDate && toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return itemDate >= from && itemDate <= to;
      });
    }
    
    if (paymentTypeFilter) {
      filtered = filtered.filter(item => item.paymentType === paymentTypeFilter);
    }
    
    setFilteredData(filtered);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setPaymentTypeFilter('');
    setFilteredData(reportData);
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
      a.download = `service_report_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading Excel file');
    }
  };

  const downloadCSV = () => {
    try {
      const headers = columns.map(col => col.header).join(',');
      const rows = filteredData.map(row => columns.map(col => `"${row[col.accessor] || ''}"`).join(',')).join('\n');
      const content = headers + '\n' + rows;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading CSV file');
    }
  };

  const downloadXML = () => {
    try {
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
      };

      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlContent += '<ENVELOPE>\n';
      xmlContent += '<HEADER>\n';
      xmlContent += '<TALLYREQUEST>Import Data</TALLYREQUEST>\n';
      xmlContent += '</HEADER>\n';
      xmlContent += '<BODY>\n';
      xmlContent += '<IMPORTDATA>\n';
      xmlContent += '<REQUESTDESC>\n';
      xmlContent += '<REPORTNAME>All Masters</REPORTNAME>\n';
      xmlContent += '<STATICVARIABLES>\n';
      xmlContent += '<SVCURRENTCOMPANY>DEMO COMPANY</SVCURRENTCOMPANY>\n';
      xmlContent += '</STATICVARIABLES>\n';
      xmlContent += '</REQUESTDESC>\n';
      xmlContent += '<REQUESTDATA>\n';
      
      filteredData.forEach(row => {
        xmlContent += '<TALLYMESSAGE xmlns:UDF="TallyUDF">\n';
        xmlContent += `<VOUCHER VCHTYPE="RECEIPT (SERVICE)" ACTION="Create">\n`;
        xmlContent += `<DATE>${formatDate(row.date)}</DATE>\n`;
        xmlContent += `<VOUCHERTYPENAME>RECEIPT (SERVICE)</VOUCHERTYPENAME>\n`;
        xmlContent += `<VOUCHERNUMBER>${row.receiptNo}</VOUCHERNUMBER>\n`;
        xmlContent += `<REFERENCE>${row.remarks || 'N/A'} ${row.refNo || 'N/A'} JC:${row.jobCardNumber}</REFERENCE>\n`;
        xmlContent += `<EFFECTIVEDATE>${formatDate(row.date)}</EFFECTIVEDATE>\n`;
        xmlContent += `<NARRATION>${row.remarks || 'N/A'} ${row.refNo || 'N/A'} JC:${row.jobCardNumber}</NARRATION>\n`;
        xmlContent += '<ALLLEDGERENTRIES.LIST>\n';
        xmlContent += `<LEDGERNAME>${row.custId} ${row.name}</LEDGERNAME>\n`;
        xmlContent += `<AMOUNT>${row.recAmt}</AMOUNT>\n`;
        xmlContent += '</ALLLEDGERENTRIES.LIST>\n';
        xmlContent += '<ALLLEDGERENTRIES.LIST>\n';
        xmlContent += `<LEDGERNAME>${row.typeOfPayment}</LEDGERNAME>\n`;
        xmlContent += `<AMOUNT>-${row.recAmt}</AMOUNT>\n`;
        xmlContent += '</ALLLEDGERENTRIES.LIST>\n';
        xmlContent += '</VOUCHER>\n';
        xmlContent += '</TALLYMESSAGE>\n';
      });
      
      xmlContent += '</REQUESTDATA>\n';
      xmlContent += '</IMPORTDATA>\n';
      xmlContent += '</BODY>\n';
      xmlContent += '</ENVELOPE>';
      
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tally_service_transaction_${new Date().toISOString().split('T')[0]}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Tally XML file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading XML file');
    }
  };

  const columns = [
    { header: "SNo", accessor: "sNo" },
    {
      header: "Date",
      accessor: "date",
      render: (value) => {
        const date = new Date(value);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      },
    },
    { header: "ReceiptNo", accessor: "receiptNo" },
    { header: "CustId", accessor: "custId" },
    { header: "Name", accessor: "name" },
    { header: "Contact No", accessor: "contactNo" },
    { header: "Payment Type", accessor: "paymentType" },
    { header: "Status", accessor: "paymentStatus" },
    { header: "Vehicle No", accessor: "vehicleNumber" },
    { header: "Amount", accessor: "recAmt" },
    { header: "PaymentMode", accessor: "paymentMode" },
    { header: "PaymentType", accessor: "typeOfPayment" },
    { header: "CollectionType", accessor: "typeOfCollection" },
    { header: "Vehicle Model", accessor: "vehicleModel" },
    { header: "Job Card No", accessor: "jobCardNumber" },
    { header: "Ref No", accessor: "refNo" },
    { header: "Remarks", accessor: "remarks" },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Service Payment Collection Report</h1>
      
      <div className="bg-brand-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Type</label>
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              >
                <option value="">All</option>
                <option value="full payment">Full Payment</option>
                <option value="part payment">Part Payment</option>
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
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={downloadExcel}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm">
              Excel
            </button>
            <button 
              onClick={downloadCSV}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm">
              CSV
            </button>
            <button 
              onClick={downloadXML}
              className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm">
              XML
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredData} 
        />
      </div>
    </div>
  );
};

export default ServiceReports;