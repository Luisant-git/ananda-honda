import React, { useState } from 'react';

const DateFilterButtons = ({ setFromDate, setToDate, onFilterSelect }) => {
  const [activeFilter, setActiveFilter] = useState('');

  const setDateFilter = (type) => {
    setActiveFilter(type);
    const today = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let from = '';
    let to = formatDate(today);

    if (type === 'today') {
      from = formatDate(today);
    } else if (type === 'week') {
      // Sunday of the current week
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      from = formatDate(firstDay);
      to = formatDate(new Date());
    } else if (type === 'month') {
      // 1st of the current month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      from = formatDate(firstDay);
      to = formatDate(new Date());
    }

    setFromDate(from);
    setToDate(to);
    if (onFilterSelect) onFilterSelect(from, to);
  };

  const getButtonStyle = (type) => {
    const isActive = activeFilter === type;
    return `
      relative flex items-center justify-center px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out
      ${isActive 
        ? 'bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-md shadow-brand-accent/20 ring-1 ring-brand-accent ring-offset-1' 
        : 'bg-white text-gray-600 hover:text-brand-accent hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
      }
    `;
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 items-center bg-white p-1.5 sm:p-2 rounded-xl shadow-sm border border-gray-200 w-full sm:w-fit">
      <span className="text-sm font-medium text-gray-500 mr-1 sm:mr-2 flex items-center gap-1 pl-2">
        <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Quick Filters:</span>
      </span>
      <button 
        onClick={() => setDateFilter('today')} 
        className={getButtonStyle('today')}
      >
        Today
      </button>
      <button 
        onClick={() => setDateFilter('week')} 
        className={getButtonStyle('week')}
      >
        This Week
      </button>
      <button 
        onClick={() => setDateFilter('month')} 
        className={getButtonStyle('month')}
      >
        This Month
      </button>
      
      {activeFilter && (
        <button 
          onClick={() => {
            setActiveFilter('');
            setFromDate('');
            setToDate('');
            if (onFilterSelect) onFilterSelect('', '');
          }}
          className="ml-auto sm:ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Clear Filter"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default DateFilterButtons;
