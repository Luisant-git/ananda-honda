import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import DataTable from '../components/DataTable';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('day');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const renderTable = (title, period, modes) => {
    const total = (modes || []).reduce((sum, m) => sum + m.amount, 0);
    const tableData = (modes || []).map((mode, index) => ({
      sNo: index + 1,
      paymentMode: mode.mode,
      amount: `₹${mode.amount.toLocaleString()}`
    }));

    const columns = [
      { header: 'SNo', accessor: 'sNo' },
      { header: 'Payment Mode', accessor: 'paymentMode' },
      { header: 'Amount', accessor: 'amount' }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-brand-border">
          <h3 className="text-xl font-bold text-brand-text-primary">{title}</h3>
          <p className="text-sm text-brand-text-secondary mt-1">{period}</p>
          <div className="mt-3 text-3xl font-bold text-brand-accent">₹{total.toLocaleString()}</div>
        </div>
        <DataTable columns={columns} data={tableData} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1>
        <p className="text-brand-text-secondary mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1>
        <div className="flex gap-2 bg-white rounded-lg border border-brand-border p-1">
          <button
            onClick={() => setActiveTab('day')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'day'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'week'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'month'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Month
          </button>
        </div>
      </div>
      
      <div>
        {activeTab === 'day' && chartData?.day && renderTable(
          'Today\'s Collection',
          new Date(chartData.day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          chartData.day.modes
        )}
        {activeTab === 'week' && chartData?.week && renderTable(
          'This Week\'s Collection',
          chartData.week.period,
          chartData.week.modes
        )}
        {activeTab === 'month' && chartData?.month && renderTable(
          'This Month\'s Collection',
          chartData.month.period,
          chartData.month.modes
        )}
      </div>
    </div>
  );
};

export default Dashboard;
