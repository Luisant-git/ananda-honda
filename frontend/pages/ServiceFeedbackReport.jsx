import React, { useState, useEffect } from 'react';
import { serviceJobCardApi } from '../api/serviceJobcard';
import DateFilterButtons from '../components/DateFilterButtons';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';

const ServiceFeedbackReport = () => {
  const [jobCards, setJobCards] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchJobCards = async () => {
    try {
      const response = await serviceJobCardApi.getAll();
      const data = response || [];
      setJobCards(data);
      // Let handleFilter take care of the initial filtering
    } catch (error) {
      console.error('Error fetching job cards:', error);
      toast.error('Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  const getFeedbackStatus = (feedback) => {
    if (!feedback) return 'No Feedback';
    const lower = feedback.toLowerCase();
    if (lower.includes('dissatisf')) return 'Dissatisfied';
    if (lower.includes('satisf')) return 'Satisfied';
    return feedback;
  };

  useEffect(() => {
    handleFilter();
  }, [search, fromDate, toDate, feedbackFilter, jobCards]);

  const handleFilter = () => {
    let filtered = jobCards;

    if (fromDate && toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.closedDate || item.createdAt);
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return itemDate >= from && itemDate <= to;
      });
    }

    if (feedbackFilter) {
      filtered = filtered.filter(item => {
         return getFeedbackStatus(item.feedback).toLowerCase() === feedbackFilter.toLowerCase();
      });
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(item => {
        const matchJc = String(item.jobCardNumber || '').toLowerCase().includes(lowerSearch);
        const matchPhone = String(item.mobileNumber || '').toLowerCase().includes(lowerSearch);
        const matchName = String(item.customerName || '').toLowerCase().includes(lowerSearch);
        return matchJc || matchPhone || matchName;
      });
    }

    setFilteredData(filtered);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setFeedbackFilter('');
    setSearch('');
  };

  const downloadExcel = () => {
    try {
      let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
      html += '<head><meta charset="utf-8"></head><body>';
      html += '<table border="1"><thead><tr>';
      
      columns.forEach(col => {
        html += `<th style="background-color: #f3f4f6; font-weight: bold; text-align: left; padding: 5px;">${col.header}</th>`;
      });
      html += '</tr></thead><tbody>';

      filteredData.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
          let value = '';
          if (col.accessor === 'feedback') {
            value = getFeedbackStatus(row.feedback);
          } else if (col.accessor === 'date') {
            const dateVal = row.closedDate || row.createdAt;
            if (dateVal) {
              const d = new Date(dateVal);
              value = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
            } else {
              value = '';
            }
          } else {
             value = row[col.accessor] !== undefined && row[col.accessor] !== null ? row[col.accessor] : '';
          }
          
          let style = 'padding: 5px;';
          
          if (col.accessor === 'feedback') {
             if (value === 'Satisfied') {
                style += ' background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center;';
             } else if (value === 'Dissatisfied') {
                style += ' background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center;';
             } else {
                style += ' background-color: #f3f4f6; color: #4b5563; font-style: italic; text-align: center;';
             }
          }
          
          if (col.accessor === 'jobCardNumber' || col.accessor === 'mobileNumber') {
            style += ' mso-number-format:"\\@";';
          }
          
          html += `<td style="${style}">${value}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></body></html>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_feedback_report_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading Excel file');
    }
  };

  const columns = [
    { 
      header: "Date", 
      accessor: "date",
      render: (_, row) => {
        const val = row.closedDate || row.createdAt;
        if (!val) return '';
        const date = new Date(val);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      }
    },
    { header: "Job Card No", accessor: "jobCardNumber" },
    { header: "Customer Name", accessor: "customerName" },
    { header: "Phone Number", accessor: "mobileNumber" },
    { 
      header: "Feedback", 
      accessor: "feedback",
      render: (value) => {
        const status = getFeedbackStatus(value);
        if (status === 'Satisfied') {
          return <span className="text-green-600 font-semibold">{status}</span>;
        } else if (status === 'Dissatisfied') {
          return <span className="text-red-600 font-semibold">{status}</span>;
        }
        return <span className="text-gray-500 italic">{status}</span>;
      }
    }
  ];

  const totalCount = filteredData.length;
  const satisfiedCount = filteredData.filter(c => getFeedbackStatus(c.feedback) === 'Satisfied').length;
  const dissatisfiedCount = filteredData.filter(c => getFeedbackStatus(c.feedback) === 'Dissatisfied').length;
  const noFeedbackCount = filteredData.filter(c => getFeedbackStatus(c.feedback) === 'No Feedback').length;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Service Feedback Report</h1>
        <DateFilterButtons setFromDate={setFromDate} setToDate={setToDate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface p-4 rounded-lg border border-brand-border shadow-sm text-center">
          <p className="text-brand-text-secondary text-sm">Total Records</p>
          <p className="text-2xl font-bold text-brand-text-primary">{totalCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm text-center">
          <p className="text-green-700 text-sm">Satisfied</p>
          <p className="text-2xl font-bold text-green-700">{satisfiedCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm text-center">
          <p className="text-red-700 text-sm">Dissatisfied</p>
          <p className="text-2xl font-bold text-red-700">{dissatisfiedCount}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-gray-600 text-sm">No Feedback</p>
          <p className="text-2xl font-bold text-gray-700">{noFeedbackCount}</p>
        </div>
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
                placeholder="Search by JC No, Phone, Name..."
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
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Feedback Status</label>
              <select
                value={feedbackFilter}
                onChange={(e) => setFeedbackFilter(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              >
                <option value="">All</option>
                <option value="Satisfied">Satisfied</option>
                <option value="Dissatisfied">Dissatisfied</option>
                <option value="No Feedback">No Feedback</option>
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

export default ServiceFeedbackReport;
