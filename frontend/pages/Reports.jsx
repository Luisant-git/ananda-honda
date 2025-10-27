import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import { paymentCollectionApi } from '../api/paymentCollectionApi.js';

const Reports = () => {
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const data = await paymentCollectionApi.getAll();
      const formattedData = data.map((payment, index) => ({
        sNo: index + 1,
        date: new Date(payment.date).toLocaleDateString('en-GB'),
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        contactNo: payment.customer.contactNo,
        recAmt: payment.recAmt,
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || 'N/A',
        typeOfCollection: payment.typeOfCollection?.typeOfCollect || 'N/A',
        remarks: payment.remarks
      }));
      setReportData(formattedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const downloadExcel = () => {
    try {
      const headers = columns.map(col => col.header).join('\t');
      const rows = reportData.map(row => columns.map(col => row[col.accessor] || '').join('\t')).join('\n');
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
      const rows = reportData.map(row => columns.map(col => `"${row[col.accessor] || ''}"`).join(',')).join('\n');
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

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Date', accessor: 'date' },
    { header: 'ReceiptNo', accessor: 'receiptNo' },
    { header: 'CustId', accessor: 'custId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Contact No', accessor: 'contactNo' },
    { header: 'Amount', accessor: 'recAmt' },
    { header: 'PaymentMode', accessor: 'paymentMode' },
    { header: 'PaymentType', accessor: 'typeOfPayment' },
    { header: 'CollectionType', accessor: 'typeOfCollection' },
    { header: 'Remarks', accessor: 'remarks' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Reports</h1>
      
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="flex gap-4 justify-end">
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
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={reportData} 
      />
    </div>
  );
};

export default Reports;