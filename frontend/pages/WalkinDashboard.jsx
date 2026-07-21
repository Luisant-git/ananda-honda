import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { customerApi } from '../api/customerApi';

const WalkinDashboard = ({ data: stats, setCurrentView }) => {
  if (!stats || !stats.salesExecutiveList) {
    return <div className="p-4 text-center">Loading Walkin Dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Enquiry */}
        <div 
          onClick={() => setCurrentView && setCurrentView('walk_in_customer')}
          className="cursor-pointer bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Total Enquiry</p>
          <h3 className="text-4xl font-bold text-blue-600">{stats.totalEnquiry}</h3>
        </div>

        {/* Today's Enquiry */}
        <div 
          onClick={() => setCurrentView && setCurrentView('walk_in_customer')}
          className="cursor-pointer bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Today's Enquiry</p>
          <h3 className="text-4xl font-bold text-green-600">{stats.todaysEnquiry}</h3>
        </div>

        {/* Allocated Enquiries */}
        <div 
          onClick={() => setCurrentView && setCurrentView('walk_in_customer')}
          className="cursor-pointer bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Allocated Enquiries</p>
          <h3 className="text-4xl font-bold text-purple-600">{stats.allocatedEnquiries}</h3>
        </div>

        {/* Booked Allocated Customers */}
        <div 
          onClick={() => setCurrentView && setCurrentView('walk_in_customer')}
          className="cursor-pointer bg-brand-surface border border-brand-border/50 rounded-xl p-6 shadow-card hover:shadow-floating transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Booked Allocated Customers</p>
          <h3 className="text-4xl font-bold text-orange-600">{stats.totalBookedCustomers || 0}</h3>
        </div>
      </div>

      <div className="bg-brand-surface rounded-xl shadow-card border border-brand-border overflow-hidden">
        <div className="bg-gradient-to-r from-brand-accent to-brand-accent-hover p-4 border-b border-brand-accent-hover/50">
          <h3 className="text-xl font-bold text-white tracking-wide">
            Sales Executive List ({stats.totalSalesExecutive})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                  Executive Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                  Total Allocated Enquiries
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                  Booked Allocated Customers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
              {stats.salesExecutiveList.length > 0 ? (
                stats.salesExecutiveList.map((exec, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-text-primary">
                      {exec.executiveName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-brand-text-primary">
                      {exec.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-orange-600">
                      {exec.bookedCount || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No sales executive data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalkinDashboard;
