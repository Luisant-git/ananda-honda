import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { customerApi } from '../api/customerApi';

const WalkinDashboard = ({ data: stats }) => {
  if (!stats || !stats.salesExecutiveList) {
    return <div className="p-4 text-center">Loading Walkin Dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enquiry */}
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Total Enquiry</p>
          <h3 className="text-3xl font-bold text-blue-600">{stats.totalEnquiry}</h3>
        </div>

        {/* Today's Enquiry */}
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Today's Enquiry</p>
          <h3 className="text-3xl font-bold text-green-600">{stats.todaysEnquiry}</h3>
        </div>

        {/* Allocated Enquiries */}
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Allocated Enquiries</p>
          <h3 className="text-3xl font-bold text-purple-600">{stats.allocatedEnquiries}</h3>
        </div>

        {/* Booked Allocated Customers */}
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-brand-text-secondary mb-2">Booked Allocated Customers</p>
          <h3 className="text-3xl font-bold text-orange-600">{stats.totalBookedCustomers || 0}</h3>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <div className="bg-brand-accent p-4 border-b">
          <h3 className="text-lg font-bold text-white">
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
