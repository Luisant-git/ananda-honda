
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
const XLSX = window.XLSX;
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import DateFilterButtons from '../components/DateFilterButtons';
import { serviceReminderApi } from '../api/serviceReminderApi';

const ServiceReminderReport = ({ user }) => {
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  useEffect(() => {
    fetchReminders();
    fetchSummary();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [fromDate, toDate, statusFilter, serviceTypeFilter, reminders]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await serviceReminderApi.getAll();
      const reminderList = Array.isArray(data) ? data : [];
      // Ensure each reminder has a salesInvoice object
      const safeReminders = reminderList.map(reminder => ({
        ...reminder,
        salesInvoice: reminder.salesInvoice || {
          customerName: 'N/A',
          contactInfo: 'N/A',
          vehicleModel: 'N/A',
          vehicleRegNo: 'N/A'
        }
      }));
      console.log('Fetched reminders:', safeReminders);
      setReminders(safeReminders);
      setFilteredReminders(safeReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to fetch reminders');
      setReminders([]);
      setFilteredReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await serviceReminderApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleFilter = () => {
    let filtered = reminders;
    
    if (fromDate && toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.scheduledDate);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return itemDate >= from && itemDate <= to;
      });
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter.toUpperCase());
    }
    
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.serviceType === serviceTypeFilter);
    }
    
    setFilteredReminders(filtered);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setServiceTypeFilter('all');
    fetchReminders();
  };

  const handleClearAll = async () => {
    try {
      await serviceReminderApi.clearAll();
      toast.success('All records cleared');
      setIsClearModalOpen(false);
      fetchReminders();
      fetchSummary();
    } catch {
      toast.error('Error clearing records');
    }
  };

  const handleManualTrigger = async () => {
    try {
      await serviceReminderApi.trigger();
      toast.success('Reminders triggered successfully!');
      setTimeout(() => {
        fetchReminders();
        fetchSummary();
      }, 2000);
    } catch (error) {
      toast.error('Failed to trigger reminders');
    }
  };

  const handleResendReminder = async (reminder) => {
    try {
      await serviceReminderApi.resend(reminder.id);
      toast.success('Reminder resent successfully!');
      fetchReminders();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to resend reminder');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SENT': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
      'FREE_SERVICE_1': 'Free Service 1',
      'FREE_SERVICE_2': 'Free Service 2',
      'FREE_SERVICE_3': 'Free Service 3'
    };
    return labels[serviceType] || serviceType;
  };

  // Safe accessor function for nested properties
  const safeAccess = (row, path) => {
    if (!row) return 'N/A';
    const parts = path.split('.');
    let value = row;
    for (const part of parts) {
      if (value === null || value === undefined) return 'N/A';
      value = value[part];
    }
    return value || 'N/A';
  };

const columns = [
  { header: 'SNo', accessor: 'sNo' },
  {
    header: 'Scheduled Date',
    accessor: 'scheduledDate',
    render: (value) => value ? new Date(value).toLocaleDateString('en-GB') : '-'
  },
  {
    header: 'Service Type',
    accessor: 'serviceType',
    render: (value) => getServiceTypeLabel(value)
  },
  { header: 'Reminder No', accessor: 'reminderNumber' },
  { header: 'Customer Name', accessor: 'salesInvoice.customerName' },
  { header: 'Contact No', accessor: 'salesInvoice.contactInfo' },
  { header: 'Vehicle Model', accessor: 'salesInvoice.vehicleModel' },
  { header: 'Vehicle Reg No', accessor: 'salesInvoice.vehicleRegNo' },
  {
    header: 'Service Due Date',
    accessor: 'reminderDate',
    render: (value) => value ? new Date(value).toLocaleDateString('en-GB') : '-'
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(value)}`}>
        {value}
      </span>
    )
  },
  {
    header: 'Sent At',
    accessor: 'sentAt',
    render: (value) => value ? new Date(value).toLocaleString() : '-'
  }
];

  // Transform columns for DataTable
  const transformedColumns = columns.map(col => ({
    header: col.header,
    accessor: typeof col.accessor === 'function' ? 'custom' : col.accessor,
    render: col.render,
    customAccessor: typeof col.accessor === 'function' ? col.accessor : null
  }));

  const downloadExcel = () => {
    try {
      const exportData = filteredReminders.map((row, idx) => ({
        'SNo': idx + 1,
        'Scheduled Date': row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString('en-GB') : '-',
        'Service Type': getServiceTypeLabel(row.serviceType),
        'Reminder Number': row.reminderNumber,
        'Customer Name': row.salesInvoice?.customerName || 'N/A',
        'Contact No': row.salesInvoice?.contactInfo || 'N/A',
        'Vehicle Model': row.salesInvoice?.vehicleModel || 'N/A',
        'Vehicle Reg No': row.salesInvoice?.vehicleRegNo || 'N/A',
        'Service Due Date': row.reminderDate ? new Date(row.reminderDate).toLocaleDateString('en-GB') : '-',
        'Status': row.status,
        'Sent At': row.sentAt ? new Date(row.sentAt).toLocaleString() : '-',
        'Error Message': row.errorMessage || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ServiceReminders');
      XLSX.writeFile(wb, `service_reminders_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Error downloading Excel file');
    }
  };

  const downloadCSV = () => {
    try {
      const headers = ['SNo', 'Scheduled Date', 'Service Type', 'Reminder Number', 'Customer Name', 'Contact No', 'Vehicle Model', 'Vehicle Reg No', 'Service Due Date', 'Status', 'Sent At', 'Error Message'];
      const rows = filteredReminders.map((row, idx) => {
        return [
          idx + 1,
          row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString('en-GB') : '-',
          getServiceTypeLabel(row.serviceType),
          row.reminderNumber,
          row.salesInvoice?.customerName || 'N/A',
          row.salesInvoice?.contactInfo || 'N/A',
          row.salesInvoice?.vehicleModel || 'N/A',
          row.salesInvoice?.vehicleRegNo || 'N/A',
          row.reminderDate ? new Date(row.reminderDate).toLocaleDateString('en-GB') : '-',
          row.status,
          row.sentAt ? new Date(row.sentAt).toLocaleString() : '-',
          row.errorMessage || '-'
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      }).join('\n');
      const content = headers.join(',') + '\n' + rows;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_reminders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Error downloading CSV file');
    }
  };

  const renderActions = (reminder) => {
    if (reminder.status === 'FAILED') {
      return (
        <button
          onClick={() => handleResendReminder(reminder)}
          className="text-blue-600 hover:underline text-sm"
        >
          Resend
        </button>
      );
    }
    return (
      <button
        onClick={() => {
          setSelectedReminder(reminder);
          setIsViewModalOpen(true);
        }}
        className="text-green-600 hover:underline text-sm"
      >
        View
      </button>
    );
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">
          Service Reminder Report
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <DateFilterButtons setFromDate={setFromDate} setToDate={setToDate} />
          {(user?.username === 'ROOT' && user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 text-sm whitespace-nowrap"
            >
              Clear All Data
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Total Sent</div>
            <div className="text-2xl font-bold text-green-600">
              {summary.total?.sent || 0}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
            <div className="text-sm text-red-600">Failed</div>
            <div className="text-2xl font-bold text-red-700">{summary.total?.failed || 0}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
            <div className="text-sm text-blue-600">Total Processed</div>
            <div className="text-2xl font-bold text-blue-700">
              {(summary.total?.sent || 0) + (summary.total?.failed || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
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
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 text-sm"
              >
                <option value="all">All (Sent & Failed)</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Service Type</label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 text-sm"
              >
                <option value="all">All</option>
                <option value="FREE_SERVICE_1">Free Service 1</option>
                <option value="FREE_SERVICE_2">Free Service 2</option>
                <option value="FREE_SERVICE_3">Free Service 3</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button
                onClick={handleFilter}
                className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Filter
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadExcel}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm"
            >
              📊 Export Excel
            </button>
            <button
              onClick={downloadCSV}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm"
            >
              📄 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={transformedColumns}
          data={filteredReminders.map((item, index) => ({ ...item, sNo: index + 1 }))}
          actionButtons={renderActions}
          customRender={(column, row) => {
            if (column.customAccessor) {
              return column.customAccessor(row);
            }
            if (column.render) {
              return column.render(row[column.accessor], row);
            }
            return row[column.accessor] || '-';
          }}
        />
      </div>

      {filteredReminders.length === 0 && !loading && (
        <div className="text-center py-8 text-brand-text-secondary">
          No reminder records found
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Reminder Details" maxWidth="max-w-4xl">
        {selectedReminder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Customer Name</label>
                <div className="text-brand-text-primary font-medium">{selectedReminder.salesInvoice?.customerName || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Contact Number</label>
                <div className="text-brand-text-primary font-medium">{selectedReminder.salesInvoice?.contactInfo || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Vehicle Model</label>
                <div className="text-brand-text-primary">{selectedReminder.salesInvoice?.vehicleModel || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Registration Number</label>
                <div className="text-brand-text-primary">{selectedReminder.salesInvoice?.vehicleRegNo || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Service Type</label>
                <div className="text-brand-text-primary">{getServiceTypeLabel(selectedReminder.serviceType)}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Reminder Number</label>
                <div className="text-brand-text-primary">{selectedReminder.reminderNumber}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Service Due Date</label>
                <div className="text-brand-text-primary">{selectedReminder.reminderDate ? new Date(selectedReminder.reminderDate).toLocaleDateString('en-GB') : '-'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Scheduled Date</label>
                <div className="text-brand-text-primary">{selectedReminder.scheduledDate ? new Date(selectedReminder.scheduledDate).toLocaleDateString('en-GB') : '-'}</div>
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary uppercase">Status</label>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedReminder.status)}`}>
                    {selectedReminder.status}
                  </span>
                </div>
              </div>
              {selectedReminder.sentAt && (
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Sent At</label>
                  <div className="text-brand-text-primary">{new Date(selectedReminder.sentAt).toLocaleString()}</div>
                </div>
              )}
              {selectedReminder.errorMessage && (
                <div className="md:col-span-2">
                  <label className="text-xs text-brand-text-secondary uppercase">Error Message</label>
                  <div className="text-red-600">{selectedReminder.errorMessage}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearAll}
        title="Confirm Clear All"
        message="Are you sure you want to delete ALL service reminder records? This action cannot be undone and will permanently erase the data."
        confirmText="Yes, Clear All"
      />
    </div>
  );
};

export default ServiceReminderReport;