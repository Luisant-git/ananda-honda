import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dashboardApi } from '../api/dashboardApi';
import { customerApi } from '../api/customerApi';
import { menuPermissionApi } from '../api/menuPermissionApi';
import ServiceBusinessDashboard from './ServiceBusinessDashboard';
import WalkinDashboard from './WalkinDashboard';
import DateFilterButtons from '../components/DateFilterButtons';

const Dashboard = () => {
  const today = new Date().toISOString().split('T')[0];
  const [chartData, setChartData] = useState({ modes: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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

if (perms?.dashboard?.sales === true) setActiveTab('walkin'); // Walkin is related to Sales, making it first if sales access is there
else if (perms?.dashboard?.service === true) setActiveTab('services');
else if (perms?.dashboard?.service_business === true) setActiveTab('service_business');
else setActiveTab(null);
  };

  fetchPerms();
}, []);
  const fetchDashboardData = async (fDate, tDate) => {
    let activeFrom = typeof fDate === 'string' ? fDate : fromDate;
    let activeTo = typeof tDate === 'string' ? tDate : toDate;

    // Force default to today if dates are cleared for sales/services
    if (!activeFrom && !activeTo && (activeTab === 'sales' || activeTab === 'services')) {
      activeFrom = today;
      activeTo = today;
      setFromDate(today);
      setToDate(today);
    }

    if ((activeFrom && !activeTo) || (!activeFrom && activeTo)) {
      toast.error('Please select both from and to dates or clear both for overall data');
      return;
    }
    setLoading(true);
    try {
      let data = { modes: [], totalCount: 0 };
      if (activeTab === 'sales') {
        data = await dashboardApi.getDashboardStats(activeFrom, activeTo);
      } else if (activeTab === 'services') {
        data = await dashboardApi.getServicesDashboardStats(activeFrom, activeTo);
      } else if (activeTab === 'service_business') {
        data = await dashboardApi.getBusinessDashboardStats(activeFrom, activeTo);
      } else if (activeTab === 'walkin') {
        data = await customerApi.getWalkinDashboardStats(activeFrom, activeTo);
      }
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
    let resetFrom = '';
    let resetTo = '';
    
    if (activeTab === 'sales' || activeTab === 'services') {
      resetFrom = today;
      resetTo = today;
    }

    setFromDate(resetFrom);
    setToDate(resetTo);
    setSearchTerm('');
    setExpandedMode(null);
    setLoading(true);
    try {
      let data = { modes: [], totalCount: 0 };
      if (activeTab === 'sales') {
        data = await dashboardApi.getDashboardStats(resetFrom, resetTo);
      } else if (activeTab === 'services') {
        data = await dashboardApi.getServicesDashboardStats(resetFrom, resetTo);
      } else if (activeTab === 'service_business') {
        data = await dashboardApi.getBusinessDashboardStats(resetFrom, resetTo);
      } else if (activeTab === 'walkin') {
        data = await customerApi.getWalkinDashboardStats(resetFrom, resetTo);
      }
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
    if (tab === 'sales' || tab === 'services') {
      setFromDate(today);
      setToDate(today);
    } else {
      setFromDate('');
      setToDate('');
    }
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
    const cashAmount = (modes || []).filter(m => m.mode.toLowerCase().includes('cash')).reduce((sum, m) => sum + m.amount, 0);
    const onlineModes = (modes || []).filter(m => !m.mode.toLowerCase().includes('cash') && !m.mode.toLowerCase().includes('cheque'));
    const onlineAmount = onlineModes.reduce((sum, m) => sum + m.amount, 0);

    const onlineBreakdown = [];
    onlineModes.forEach(m => {
      if (m.types && m.types.length > 0) {
        m.types.forEach(t => {
          onlineBreakdown.push({ name: t.type, amount: t.amount, count: t.count });
        });
      } else if (m.amount > 0) {
        onlineBreakdown.push({ name: m.mode, amount: m.amount, count: m.count || 1 });
      }
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-brand-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Total Collection</p>
          <h3 className="text-3xl font-bold text-brand-text-primary">₹{total.toLocaleString()}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-brand-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Transaction Count</p>
          <h3 className="text-3xl font-bold text-brand-text-primary">{totalCount || 0}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Cash Amount</p>
          <h3 className="text-3xl font-bold text-brand-text-primary">₹{cashAmount.toLocaleString()}</h3>
        </div>
        <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Online Amount</p>
          <h3 className="text-3xl font-bold text-brand-text-primary mb-3">₹{onlineAmount.toLocaleString()}</h3>
          
          {onlineBreakdown.length > 0 && (
            <div className="pt-3 border-t border-brand-border/50 space-y-2 mt-auto relative z-10">
              {onlineBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-brand-text-secondary capitalize flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {item.name}
                  </span>
                  <span className="font-semibold text-brand-text-primary">₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
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
      <div className="bg-brand-surface rounded-xl shadow-card border border-brand-border overflow-hidden">
        <div className="bg-gradient-to-r from-brand-accent to-brand-accent-hover p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">{reportTitle}</h3>
              <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium">
                {fromDate && toDate ? `${new Date(fromDate).toLocaleDateString('en-GB')} - ${new Date(toDate).toLocaleDateString('en-GB')}` : 'All Time Overview'}
              </p>
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
  !!(permissions?.dashboard?.sales || permissions?.dashboard?.service || permissions?.dashboard?.service_business);

if (!permissions) return null; // or: return <div>Loading...</div>

if (!hasDashboardAccess) return null; // hides whole dashboard page
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Dashboard</h1>
        <DateFilterButtons setFromDate={setFromDate} setToDate={setToDate} onFilterSelect={fetchDashboardData} />
      </div>
      
      {/* Tabs */}
{(permissions?.dashboard?.sales || permissions?.dashboard?.service || permissions?.dashboard?.service_business) && (
  <div className="bg-brand-surface rounded-xl shadow-soft p-2 mb-6">
    <div className="flex flex-wrap gap-2">
      {permissions?.dashboard?.sales && (
        <button onClick={() => handleTabChange('walkin')} className={`flex-1 min-w-[150px] px-4 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'walkin' ? 'bg-brand-accent text-white shadow-md' : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'}`}>
          Walk-in Dashboard
        </button>
      )}

      {permissions?.dashboard?.sales && (
        <button onClick={() => handleTabChange('sales')} className={`flex-1 min-w-[150px] px-4 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'sales' ? 'bg-brand-accent text-white shadow-md' : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'}`}>
          Sales Dashboard
        </button>
      )}

      {permissions?.dashboard?.service && (
        <button onClick={() => handleTabChange('services')} className={`flex-1 min-w-[150px] px-4 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'services' ? 'bg-brand-accent text-white shadow-md' : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'}`}>
          Services Dashboard
        </button>
      )}

      {permissions?.dashboard?.service_business && (
        <button onClick={() => handleTabChange('service_business')} className={`flex-1 min-w-[150px] px-4 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'service_business' ? 'bg-brand-accent text-white shadow-md' : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'}`}>
          Service Business Dashboard
        </button>
      )}
    </div>
  </div>
)}

      {/* Date Filter Section */}
      <div className="bg-brand-surface p-5 rounded-xl shadow-card border border-brand-border/50 flex flex-wrap items-end gap-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent"></div>
        <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wide">Start Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-brand-hover border border-brand-border text-brand-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-accent focus:bg-white outline-none transition-all w-[160px]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wide">End Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-brand-hover border border-brand-border text-brand-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-accent focus:bg-white outline-none transition-all w-[160px]"
              />
            </div>
          </div>
        <div className="flex gap-3 h-[42px] mt-2 sm:mt-0">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-brand-text-primary hover:bg-black text-white text-sm font-bold px-6 rounded-lg disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            )}
            Filter Data
          </button>
          <button
            onClick={handleReset}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold px-6 rounded-lg transition-colors shadow-sm flex items-center"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Walk-in Dashboard */}
      {activeTab === 'walkin' && <WalkinDashboard data={chartData} />}

      {/* Summary Cards */}
      {activeTab !== 'service_business' && activeTab !== 'walkin' && renderSummaryCards(chartData?.modes || [], chartData?.totalCount || 0)}
      
      {/* Data Table */}
      {/* Table removed per request */}

      {/* Service Business Dashboard */}
      {activeTab === 'service_business' && <ServiceBusinessDashboard data={chartData} />}
    </div>
  );
};

export default Dashboard;