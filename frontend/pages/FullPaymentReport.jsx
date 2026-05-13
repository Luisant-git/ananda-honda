import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { servicePaymentCollectionApi } from '../api/servicePaymentCollectionApi.js';

const FullPaymentReport = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('full payment');
  const [loading, setLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await servicePaymentCollectionApi.getAll(1, 999999, null, 'full payment', 'completed');
      console.log('API Response:', response);
      
      const paymentsData = response.data || response;
      
      const formattedData = (Array.isArray(paymentsData) ? paymentsData : []).map((payment, index) => {
        let totalAmount = payment.recAmt;
        if (payment.paymentSessions && payment.paymentSessions.length > 0) {
          const sessionsTotal = payment.paymentSessions.reduce((sum, session) => sum + (session.amount || 0), 0);
          totalAmount = sessionsTotal + payment.recAmt;
        }
        const displayTotalAmt = payment.totalAmt || totalAmount;

        return {
          sNo: index + 1,
          id: payment.id,
          date: payment.date,
          receiptNo: payment.receiptNo,
          custId: payment.customer?.custId || 'N/A',
          name: payment.customer?.name || 'N/A',
          contactNo: payment.customer?.contactNo || 'N/A',
          address: payment.customer?.address || 'N/A',
          amount: displayTotalAmt,
          recAmt: payment.recAmt,
          paymentType: payment.paymentType,
          paymentStatus: payment.paymentStatus,
          vehicleNumber: payment.vehicleNumber || 'N/A',
          paymentMode: payment.paymentMode?.paymentMode || 'N/A',
          typeOfPayment: payment.typeOfPayment?.typeOfMode || 'N/A',
          typeOfCollection: payment.serviceTypeOfCollection?.typeOfCollect || 'N/A',
          vehicleModel: payment.vehicleModel?.model || 'N/A',
          enteredBy: payment.user?.username || 'N/A',
          refNo: payment.refNo || 'N/A',
          remarks: payment.remarks || 'N/A',
          jobCardNumber: payment.jobCardNumber || 'N/A',
          serviceType: payment.serviceTypeRelation?.name || 'N/A',
          selectedParts: payment.selectedParts || [],
          paymentSessions: payment.paymentSessions || [],
          customerId: payment.customerId,
        };
      });
      setReportData(formattedData);
      setFilteredData(formattedData);
    } catch (error) {
      console.error('Error fetching full payment data:', error);
      toast.error('Error fetching full payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (payment) => {
    console.log('Viewing payment:', payment);
    if (!payment) {
      toast.error('Unable to load payment details');
      return;
    }
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const renderActions = (payment) => {
    return (
      <div className="flex gap-2">
        <button 
          onClick={() => handleView(payment)} 
          className="text-blue-600 hover:text-blue-800 hover:underline"
          title="View Details"
        >
          View
        </button>
      </div>
    );
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
    setPaymentTypeFilter('full payment');
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
      a.download = `full_payment_report_${new Date().toISOString().split('T')[0]}.xls`;
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
      a.download = `full_payment_report_${new Date().toISOString().split('T')[0]}.csv`;
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
        xmlContent += `<AMOUNT>${row.amount}</AMOUNT>\n`;
        xmlContent += '</ALLLEDGERENTRIES.LIST>\n';
        xmlContent += '<ALLLEDGERENTRIES.LIST>\n';
        xmlContent += `<LEDGERNAME>${row.typeOfPayment}</LEDGERNAME>\n`;
        xmlContent += `<AMOUNT>-${row.amount}</AMOUNT>\n`;
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
      a.download = `tally_full_payment_${new Date().toISOString().split('T')[0]}.xml`;
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
    { header: "Amount", accessor: "amount" },
    { header: "PaymentMode", accessor: "paymentMode" },
    { header: "PaymentType", accessor: "typeOfPayment" },
    { header: "CollectionType", accessor: "typeOfCollection" },
    { header: "Vehicle Model", accessor: "vehicleModel" },
    { header: "Job Card No", accessor: "jobCardNumber" },
    { header: "Ref No", accessor: "refNo" },
    { header: "Remarks", accessor: "remarks" },
  ];

  const renderAmountWithTooltip = (row) => {
    if (row.paymentSessions && row.paymentSessions.length > 0) {
      const sessionDetails = row.paymentSessions.map(s => 
        `${s.receiptNo}: ₹${s.amount} (${new Date(s.date).toLocaleDateString()})`
      ).join('\n');
      return (
        <span title={`Payment Breakdown:\n${sessionDetails}\n\nFinal Payment: ₹${row.amount - row.paymentSessions.reduce((sum, s) => sum + s.amount, 0)}\n━━━━━━━━━━━━━━━━━━\nTotal: ₹${row.amount}`} className="cursor-help border-b border-dotted">
          ₹{row.amount}
        </span>
      );
    }
    return `₹${row.amount}`;
  };

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
      <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Full Payment Collection Report</h1>
      
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
          actionButtons={renderActions}
          renderCell={(column, row) => {
            if (column.accessor === 'amount') {
              return renderAmountWithTooltip(row);
            }
            return null;
          }}
        />
      </div>

      {filteredData.length === 0 && !loading && (
        <div className="text-center py-8 text-brand-text-secondary">
          No full payment records found
        </div>
      )}

      {/* View Payment Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Full Payment Details" maxWidth="max-w-4xl">
        {selectedPayment && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Customer ID</label>
                  <div className="text-brand-text-primary font-medium">{selectedPayment.custId}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Customer Name</label>
                  <div className="text-brand-text-primary font-medium">{selectedPayment.name}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Contact Number</label>
                  <div className="text-brand-text-primary font-medium">{selectedPayment.contactNo}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Address</label>
                  <div className="text-brand-text-primary">{selectedPayment.address}</div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Receipt No</label>
                  <div className="text-brand-text-primary font-medium">{selectedPayment.receiptNo}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Date</label>
                  <div className="text-brand-text-primary font-medium">
                    {new Date(selectedPayment.date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Payment Type</label>
                  <div className="text-brand-text-primary font-medium">{selectedPayment.paymentType}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Payment Status</label>
                  <div className="text-brand-text-primary font-medium">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {selectedPayment.paymentStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Total Amount</label>
                  <div className="text-brand-text-primary font-medium text-lg">₹{selectedPayment.amount}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Received Amount</label>
                  <div className="text-brand-text-primary font-medium">₹{selectedPayment.recAmt}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Payment Mode</label>
                  <div className="text-brand-text-primary">{selectedPayment.paymentMode}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Type of Payment</label>
                  <div className="text-brand-text-primary">{selectedPayment.typeOfPayment}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Reference Number</label>
                  <div className="text-brand-text-primary">{selectedPayment.refNo || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Entered By</label>
                  <div className="text-brand-text-primary">{selectedPayment.enteredBy}</div>
                </div>
              </div>
            </div>

            {/* Previous Payment Sessions */}
            {selectedPayment.paymentSessions && selectedPayment.paymentSessions.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Previous Payment Sessions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Receipt No</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayment.paymentSessions.map((session, idx) => (
                        <tr key={idx} className="border-t border-gray-200">
                          <td className="px-3 py-2">{session.receiptNo}</td>
                          <td className="px-3 py-2">{new Date(session.date).toLocaleDateString('en-GB')}</td>
                          <td className="px-3 py-2 text-right">₹{session.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vehicle Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Vehicle Number</label>
                  <div className="text-brand-text-primary font-medium">{selectedPayment.vehicleNumber}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Vehicle Model</label>
                  <div className="text-brand-text-primary">{selectedPayment.vehicleModel}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Job Card Number</label>
                  <div className="text-brand-text-primary">{selectedPayment.jobCardNumber}</div>
                </div>
              </div>
            </div>

            {/* Service Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Service Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Service Type</label>
                  <div className="text-brand-text-primary">{selectedPayment.serviceType || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Collection Type</label>
                  <div className="text-brand-text-primary">{selectedPayment.typeOfCollection}</div>
                </div>
              </div>
            </div>

            {/* Type of Parts Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Type of Parts Details</h3>
              {selectedPayment.selectedParts && selectedPayment.selectedParts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left">SNo</th>
                        <th className="px-3 py-2 text-left">Part No</th>
                        <th className="px-3 py-2 text-left">Part Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayment.selectedParts.map((part, idx) => (
                        <tr key={idx} className="border-t border-gray-200">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{part.partNo}</td>
                          <td className="px-3 py-2">{part.partName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-brand-text-secondary py-4">
                  No parts added for this payment
                </div>
              )}
            </div>

            {/* Remarks */}
            {selectedPayment.remarks && selectedPayment.remarks !== 'N/A' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Remarks</h3>
                <div className="text-brand-text-primary">{selectedPayment.remarks}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FullPaymentReport;