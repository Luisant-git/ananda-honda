import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';

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

  const renderDayChart = () => {
    if (!chartData?.dayWise) return null;
    const maxAmount = Math.max(...chartData.dayWise.map(d => d.amount), 1);
    const total = chartData.dayWise.reduce((sum, d) => sum + d.amount, 0);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-text-primary">Day-wise Collection</h3>
            <p className="text-sm text-brand-text-secondary mt-1">Last 7 days revenue trend</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-brand-text-secondary">Total</p>
            <p className="text-2xl font-bold text-brand-accent">₹{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-blue-200 shadow-lg">
          <svg className="w-full" viewBox="0 0 700 180" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 1, 2, 3].map(i => (
              <line key={i} x1="50" y1={30 + i * 35} x2="650" y2={30 + i * 35} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {/* Line path */}
            <polyline
              points={chartData.dayWise.map((d, i) => `${50 + i * 100},${150 - (d.amount / maxAmount) * 110}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Area fill */}
            <polygon
              points={`50,150 ${chartData.dayWise.map((d, i) => `${50 + i * 100},${150 - (d.amount / maxAmount) * 110}`).join(' ')} 650,150`}
              fill="url(#lineGradient)"
            />
            {/* Data points */}
            {chartData.dayWise.map((day, index) => (
              <g key={index}>
                <circle
                  cx={50 + index * 100}
                  cy={150 - (day.amount / maxAmount) * 110}
                  r="5"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-7 transition-all cursor-pointer"
                />
                <text x={50 + index * 100} y={165} textAnchor="middle" fontSize="11" fill="#6b7280">
                  {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </text>
                <text x={50 + index * 100} y={140 - (day.amount / maxAmount) * 110} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937">
                  ₹{day.amount.toLocaleString()}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderMonthChart = () => {
    if (!chartData?.monthWise) return null;
    const maxAmount = Math.max(...chartData.monthWise.map(m => m.amount), 1);
    const total = chartData.monthWise.reduce((sum, m) => sum + m.amount, 0);
    const avg = total / chartData.monthWise.length;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-text-primary">Month-wise Collection</h3>
            <p className="text-sm text-brand-text-secondary mt-1">Last 12 months revenue analysis</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-sm text-brand-text-secondary">Total</p>
              <p className="text-2xl font-bold text-brand-accent">₹{total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-text-secondary">Average</p>
              <p className="text-2xl font-bold text-green-600">₹{Math.round(avg).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-blue-200 shadow-lg">
          <div className="flex items-end justify-between h-48 gap-3">
            {chartData.monthWise.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="text-xs font-bold text-brand-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{month.amount.toLocaleString()}
                </div>
                <div className="relative w-full flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 shadow-lg hover:shadow-xl cursor-pointer"
                    style={{ height: `${(month.amount / maxAmount) * 160}px`, minHeight: '6px' }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{month.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-brand-text-secondary font-medium transform -rotate-45 origin-top-left mt-4 whitespace-nowrap">
                  {month.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderYearChart = () => {
    if (!chartData?.yearWise) return null;
    const maxAmount = Math.max(...chartData.yearWise.map(y => y.amount), 1);
    const total = chartData.yearWise.reduce((sum, y) => sum + y.amount, 0);
    const maxGrowth = Math.max(...chartData.yearWise.map((y, i) => {
      if (i === 0) return 0;
      const prev = chartData.yearWise[i - 1].amount;
      return prev > 0 ? Math.abs((y.amount - prev) / prev * 100) : 0;
    }));
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-text-primary">Year-wise Collection</h3>
            <p className="text-sm text-brand-text-secondary mt-1">5 years revenue & growth analysis</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-brand-text-secondary">Total (5 Years)</p>
            <p className="text-2xl font-bold text-brand-accent">₹{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-blue-200 shadow-lg">
          <div className="relative h-60">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-t border-gray-200"></div>
              ))}
            </div>
            
            <div className="relative h-full flex items-end justify-between gap-8">
              {chartData.yearWise.map((year, index) => {
                const prevAmount = index > 0 ? chartData.yearWise[index - 1].amount : 0;
                const growth = index > 0 && prevAmount > 0 ? ((year.amount - prevAmount) / prevAmount * 100) : 0;
                const barHeight = (year.amount / maxAmount) * 70;
                const growthHeight = maxGrowth > 0 ? (Math.abs(growth) / maxGrowth) * 25 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-4 group">
                    {/* Growth indicator */}
                    {index > 0 && (
                      <div className="flex flex-col items-center">
                        <div className={`text-lg font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
                        </div>
                        <div 
                          className={`w-16 rounded-t-lg transition-all ${growth >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                          style={{ height: `${growthHeight}%` }}
                        ></div>
                      </div>
                    )}
                    
                    {/* Revenue bar */}
                    <div className="flex-1 w-full flex flex-col justify-end items-center">
                      <div className="text-sm font-bold text-brand-text-primary mb-2">
                        ₹{year.amount.toLocaleString()}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-300 hover:from-blue-700 hover:to-blue-500 shadow-lg hover:shadow-2xl cursor-pointer relative"
                        style={{ height: `${barHeight}%`, minHeight: '20px' }}
                      >
                        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity rounded-t-xl"></div>
                      </div>
                    </div>
                    
                    {/* Year label */}
                    <div className="text-base font-bold text-brand-text-primary bg-blue-100 px-4 py-2 rounded-lg">
                      {year.year}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
            onClick={() => setActiveTab('month')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'month'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'year'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:bg-brand-hover'
            }`}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="bg-brand-surface rounded-lg shadow-sm border border-brand-border p-6">
        {activeTab === 'day' && renderDayChart()}
        {activeTab === 'month' && renderMonthChart()}
        {activeTab === 'year' && renderYearChart()}
      </div>
    </div>
  );
};

export default Dashboard;