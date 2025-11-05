import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dashboardApi } from '../api/dashboardApi';

const Dashboard = () => {
  const today = new Date().toISOString().split('T')[0];
  const [chartData, setChartData] = useState({ modes: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both from and to dates');
      return;
    }
    setLoading(true);
    try {
      const data = await dashboardApi.getDashboardStats(fromDate, toDate);
      setChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setFromDate(today);
    setToDate(today);
    setSearchTerm('');
    setLoading(true);
    try {
      const data = await dashboardApi.getDashboardStats(today, today);
      setChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const downloadXML = () => {
    try {
      const total = (chartData.modes || []).reduce((sum, m) => sum + m.amount, 0);
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<dashboard>\n';
      xmlContent += `  <fromDate>${fromDate}</fromDate>\n`;
      xmlContent += `  <toDate>${toDate}</toDate>\n`;
      xmlContent += `  <totalCollection>${total}</totalCollection>\n`;
      xmlContent += '  <paymentModes>\n';
      (chartData.modes || []).forEach((mode, index) => {
        xmlContent += '    <paymentMode>\n';
        xmlContent += `      <sNo>${index + 1}</sNo>\n`;
        xmlContent += `      <mode>${mode.mode}</mode>\n`;
        xmlContent += `      <amount>${mode.amount}</amount>\n`;
        xmlContent += '    </paymentMode>\n';
      });
      xmlContent += '  </paymentModes>\n';
      xmlContent += '</dashboard>';
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_${fromDate}_to_${toDate}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('XML file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading XML file');
    }
  };

  const renderSummaryCards = (modes, totalCount) => {
    const total = (modes || []).reduce((sum, m) => sum + m.amount, 0);
    const count = (modes || []).filter(m => m.amount > 0).length;
    const avg = totalCount > 0 ? total / totalCount : 0;
    const highest = Math.max(...(modes || []).map(m => m.amount), 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Total Collection</p>
          <h3 className="text-2xl font-bold text-brand-accent">₹{total.toLocaleString()}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Payment Collection Count</p>
          <h3 className="text-2xl font-bold text-brand-accent">{totalCount || 0}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Average Amount</p>
          <h3 className="text-2xl font-bold text-brand-accent">₹{Math.round(avg).toLocaleString()}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Highest Payment</p>
          <h3 className="text-2xl font-bold text-brand-accent">₹{highest.toLocaleString()}</h3>
        </div>
      </div>
    );
  };



  const renderTable = (modes) => {
    const tableData = (modes || [])
      .filter(mode => mode.mode.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((mode, index) => ({
        sNo: index + 1,
        paymentMode: mode.mode,
        amount: mode.amount
      }));
    
    return (
      <div className="bg-brand-surface rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <div className="bg-brand-accent p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Payment Collection Report</h3>
              <p className="text-white text-sm mt-1 opacity-90">{fromDate && toDate ? `${new Date(fromDate).toLocaleDateString('en-GB')} - ${new Date(toDate).toLocaleDateString('en-GB')}` : 'Select date range'}</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Search payment mode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-white rounded-lg px-4 py-2 text-sm text-brand-text-primary focus:ring-2 focus:ring-white focus:outline-none"
              />
              <button
                onClick={downloadXML}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                XML
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-brand-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary">{row.sNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-text-primary">{row.paymentMode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-brand-text-primary">₹{row.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };



  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1>
      
      <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-brand-text-secondary mb-1">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
            <button
              onClick={handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {renderSummaryCards(chartData.modes, chartData.totalCount)}
      {renderTable(chartData.modes)}
    </div>
  );
};

export default Dashboard;
