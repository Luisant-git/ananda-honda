import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dashboardApi } from '../api/dashboardApi';
import { menuPermissionApi } from '../api/menuPermissionApi';
const Dashboard = () => {
  const today = new Date().toISOString().split('T')[0];
  const [chartData, setChartData] = useState({ modes: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [expandedMode, setExpandedMode] = useState(null); // store the mode name or index
  const [permissions, setPermissions] = useState(null);
const [activeTab, setActiveTab] = useState(null);

useEffect(() => {
  if (!activeTab) return;
  fetchDashboardData();
}, [activeTab]);

useEffect(() => {
  const fetchPerms = async () => {
    const res = await menuPermissionApi.get();
    const perms = res.permissions || res;
    setPermissions(perms);

if (perms?.dashboard?.sales === true) setActiveTab('sales');
else if (perms?.dashboard?.service === true) setActiveTab('services');
else setActiveTab(null);
  };

  fetchPerms();
}, []);
  const fetchDashboardData = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both from and to dates');
      return;
    }
    setLoading(true);
    try {
      const data = activeTab === 'sales' 
        ? await dashboardApi.getDashboardStats(fromDate, toDate)
        : await dashboardApi.getServicesDashboardStats(fromDate, toDate);
      setChartData(data);
      setExpandedMode(null); // collapse any expanded row
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
    setExpandedMode(null);
    setLoading(true);
    try {
      const data = activeTab === 'sales'
        ? await dashboardApi.getDashboardStats(today, today)
        : await dashboardApi.getServicesDashboardStats(today, today);
      setChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setExpandedMode(null);
  };

  const toggleExpand = (modeName) => {
    setExpandedMode(prev => (prev === modeName ? null : modeName));
  };

  const downloadXML = () => {
    try {
      const total = (chartData.modes || []).reduce((sum, m) => sum + m.amount, 0);
      const type = activeTab === 'sales' ? 'Sales' : 'Services';
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<dashboard>\n';
      xmlContent += `  <type>${type}</type>\n`;
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
      a.download = `${activeTab}_dashboard_${fromDate}_to_${toDate}.xml`;
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
    // Filter modes based on search term
    const filteredModes = (modes || []).filter(mode =>
      mode.mode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const reportTitle = activeTab === 'sales' ? 'Sales Payment Collection Report' : 'Services Payment Collection Report';

    return (
      <div className="bg-brand-surface rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <div className="bg-brand-accent p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">{reportTitle}</h3>
              <p className="text-white text-xs sm:text-sm mt-1 opacity-90">
                {fromDate && toDate ? `${new Date(fromDate).toLocaleDateString('en-GB')} - ${new Date(toDate).toLocaleDateString('en-GB')}` : 'Select date range'}
              </p>
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-white rounded-lg px-3 py-2 text-xs sm:text-sm text-brand-text-primary focus:ring-2 focus:ring-white focus:outline-none flex-1 sm:flex-none"
              />
              <button
                onClick={downloadXML}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-xs sm:text-sm whitespace-nowrap"
              >
                XML
              </button>
            </div>
          </div>
        </div>
        
        {/* Desktop/Tablet Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">S.No</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Payment Mode</th>
                <th className="px-3 md:px-6 py-3 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
              {filteredModes.map((mode, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {/* Main row - clickable */}
                  <tr
                    className="hover:bg-brand-hover transition-colors cursor-pointer"
                    onClick={() => toggleExpand(mode.mode)}
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-brand-text-primary">
                      {rowIndex + 1}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-semibold text-brand-text-primary">
                      <span className="flex items-center gap-2">
                        {mode.mode}
                        {mode.types && mode.types.length > 0 && (
                          <svg
                            className={`w-4 h-4 transition-transform ${expandedMode === mode.mode ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-bold text-right text-brand-text-primary">
                      ₹{mode.amount.toLocaleString()}
                    </td>
                  </tr>
                  {/* Expanded sub-row showing types */}
                  {expandedMode === mode.mode && mode.types && mode.types.length > 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 bg-gray-50">
                        <div className="border-l-2 border-brand-accent pl-4">
                          <h4 className="text-sm font-semibold text-brand-text-primary mb-2">Types of Payment</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2 pr-4">Type</th>
                                <th className="pb-2 pr-4 text-right">Amount</th>
                                <th className="pb-2 text-right">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mode.types.map((type, i) => (
                                <tr key={i} className="border-b last:border-b-0">
                                  <td className="py-2 pr-4 font-medium text-brand-text-primary">
                                    {type.type}
                                  </td>
                                  <td className="py-2 pr-4 text-right text-brand-text-primary">
                                    ₹{type.amount.toLocaleString()}
                                  </td>
                                  <td className="py-2 text-right text-brand-text-secondary">
                                    {type.count}
                                  </td>
                                </tr>
                              ))}
                              {mode.types.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="py-2 text-gray-400">No types available</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-brand-border">
          {filteredModes.map((mode, rowIndex) => (
            <div key={rowIndex}>
              {/* Main card - clickable */}
              <div
                className="bg-white p-4 hover:bg-brand-hover transition-colors cursor-pointer"
                onClick={() => toggleExpand(mode.mode)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-brand-text-secondary">#{rowIndex + 1}</span>
                  <span className="text-sm font-bold text-brand-text-primary">₹{mode.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-text-primary">{mode.mode}</div>
                  {mode.types && mode.types.length > 0 && (
                    <svg
                      className={`w-4 h-4 text-brand-text-secondary transition-transform ${expandedMode === mode.mode ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
              {/* Expanded types for mobile */}
              {expandedMode === mode.mode && mode.types && mode.types.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 border-t">
                  <h5 className="text-xs font-semibold text-brand-text-secondary mb-2">Types of Payment</h5>
                  {mode.types.map((type, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b last:border-b-0">
                      <span className="text-sm text-brand-text-primary">{type.type}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-brand-text-primary">₹{type.amount.toLocaleString()}</span>
                        <span className="text-xs text-brand-text-secondary ml-2">({type.count})</span>
                      </div>
                    </div>
                  ))}
                  {mode.types.length === 0 && (
                    <p className="text-sm text-gray-400">No types available</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
const hasDashboardAccess =
  !!(permissions?.dashboard?.sales || permissions?.dashboard?.service);

if (!permissions) return null; // or: return <div>Loading...</div>

if (!hasDashboardAccess) return null; // hides whole dashboard page
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Dashboard</h1>
      
      {/* Tabs */}
{(permissions?.dashboard?.sales && permissions?.dashboard?.service) && (
  <div className="bg-brand-surface rounded-lg shadow-sm border border-brand-border overflow-hidden">
    <div className="flex border-b border-brand-border">
      {permissions?.dashboard?.sales && (
        <button onClick={() => handleTabChange('sales')} className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'sales' ? 'bg-brand-accent text-white' : 'bg-gray-50'}`}>
          Sales Dashboard
        </button>
      )}

      {permissions?.dashboard?.service && (
        <button onClick={() => handleTabChange('services')} className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'services' ? 'bg-brand-accent text-white' : 'bg-gray-50'}`}>
          Services Dashboard
        </button>
      )}
    </div>
  </div>
)}

      {/* Date Filter Section */}
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
      
      {/* Summary Cards */}
      {renderSummaryCards(chartData.modes, chartData.totalCount)}
      
      {/* Data Table */}
      {renderTable(chartData.modes)}
    </div>
  );
};

export default Dashboard;