import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import { paymentCollectionApi } from '../api/paymentCollectionApi.js';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const data = await paymentCollectionApi.getAll();
      const formattedData = data.map((payment, index) => ({
        sNo: index + 1,
        id: payment.id,
        date: payment.date,
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        contactNo: payment.customer.contactNo,
        address: payment.customer.address,
        recAmt: payment.recAmt,
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || 'N/A',
        typeOfCollection: payment.typeOfCollection?.typeOfCollect || 'N/A',
        vehicleModel: payment.vehicleModel?.model || 'N/A',
        enteredBy: payment.user?.username || 'N/A',
        refNo: payment.refNo || 'N/A',
        remarks: payment.remarks || 'N/A',
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
    if (!fromDate || !toDate) {
      setFilteredData(reportData);
      return;
    }
    
    const filtered = reportData.filter(item => {
      const itemDate = new Date(item.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      return itemDate >= from && itemDate <= to;
    });
    
    setFilteredData(filtered);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
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
      a.download = `report_${new Date().toISOString().split('T')[0]}.xls`;
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
      a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading CSV file');
    }
  };

  const downloadXML = () => {
    try {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<reports>\n';
      filteredData.forEach(row => {
        xmlContent += '  <report>\n';
        columns.forEach(col => {
          const value = row[col.accessor] || '';
          xmlContent += `    <${col.accessor}>${value}</${col.accessor}>\n`;
        });
        xmlContent += '  </report>\n';
      });
      xmlContent += '</reports>';
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('XML file downloaded successfully!');
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
    { header: "Amount", accessor: "recAmt" },
    { header: "PaymentMode", accessor: "paymentMode" },
    { header: "PaymentType", accessor: "typeOfPayment" },
    { header: "CollectionType", accessor: "typeOfCollection" },
    { header: "Vehicle Model", accessor: "vehicleModel" },
    { header: "Ref No", accessor: "refNo" },
    { header: "Remarks", accessor: "remarks" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Reports</h1>
      
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              />
            </div>
            <button 
              onClick={handleFilter}
              className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-6 rounded-lg">
              Filter
            </button>
            <button 
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
              Reset
            </button>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={downloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
              Excel
            </button>
            <button 
              onClick={downloadCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
              CSV
            </button>
            <button 
              onClick={downloadXML}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg">
              XML
            </button>
          </div>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredData} 
      />
    </div>
  );
};

export default Reports;