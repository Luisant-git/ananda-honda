import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dashboardApi } from '../api/dashboardApi';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('day');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardApi.getDashboardStats();
      setChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const downloadXML = () => {
    try {
      const total = (currentData.modes || []).reduce((sum, m) => sum + m.amount, 0);
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<dashboard>\n';
      xmlContent += `  <period>${currentData.title}</period>\n`;
      xmlContent += `  <date>${currentData.period}</date>\n`;
      xmlContent += `  <totalCollection>${total}</totalCollection>\n`;
      xmlContent += '  <paymentModes>\n';
      (currentData.modes || []).forEach((mode, index) => {
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
      a.download = `dashboard_${activeTab}_${new Date().toISOString().split('T')[0]}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('XML file downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading XML file');
    }
  };

  const renderSummaryCards = (modes) => {
    const total = (modes || []).reduce((sum, m) => sum + m.amount, 0);
    const count = (modes || []).filter(m => m.amount > 0).length;
    const avg = count > 0 ? total / count : 0;
    const highest = Math.max(...(modes || []).map(m => m.amount), 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Total Collection</p>
          <h3 className="text-2xl font-bold text-brand-accent">₹{total.toLocaleString()}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Payment Modes</p>
          <h3 className="text-2xl font-bold text-brand-accent">{count}</h3>
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



  const renderTable = (title, period, modes) => {
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
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-white text-sm mt-1 opacity-90">{period}</p>
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-lg h-24 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg h-64 animate-pulse"></div>
      </div>
    );
  }

  const getCurrentData = () => {
    if (activeTab === 'day') return { title: "Today's Collection", period: new Date(chartData.day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), modes: chartData.day.modes };
    if (activeTab === 'week') return { title: "This Week's Collection", period: chartData.week.period, modes: chartData.week.modes };
    return { title: "This Month's Collection", period: chartData.month.period, modes: chartData.month.modes };
  };

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1>
        <div className="flex gap-2 bg-brand-surface rounded-lg border border-brand-border p-1">
          <button
            onClick={() => setActiveTab('day')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === 'day'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === 'week'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === 'month'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Month
          </button>
        </div>
      </div>
      
      {renderSummaryCards(currentData.modes)}
      {renderTable(currentData.title, currentData.period, currentData.modes)}
    </div>
  );
};

export default Dashboard;
