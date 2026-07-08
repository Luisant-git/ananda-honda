import React, { useState, useMemo } from 'react';
import { SortAscIcon, SortDescIcon } from './icons/Icons';

const DataTable = ({ columns, data, actionButtons, pagination, rowClassName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  
  const isBackendPagination = pagination && pagination.total !== undefined;

  // Helper function to get nested value
  const getNestedValue = (obj, path) => {
    if (!obj) return '';
    if (typeof path === 'function') return path(obj);
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return '';
      value = value[part];
    }
    return value;
  };

  const sortedAndFilteredData = useMemo(() => {
    if (isBackendPagination) return data;
    
    let filteredData = data.filter(item =>
      columns.some(col => {
        const value = getNestedValue(item, col.accessor);
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        const aVal = getNestedValue(a, sortConfig.key);
        const bVal = getNestedValue(b, sortConfig.key);
        
        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig, isBackendPagination, columns]);

  const totalEntries = isBackendPagination ? pagination.total : sortedAndFilteredData.length;
  const totalPages = isBackendPagination ? pagination.totalPages : Math.ceil(totalEntries / entriesPerPage);
  const startIndex = isBackendPagination ? (pagination.page - 1) * pagination.limit + 1 : (currentPage - 1) * entriesPerPage + 1;
  const endIndex = isBackendPagination ? Math.min(startIndex + data.length - 1, totalEntries) : Math.min(startIndex + entriesPerPage - 1, totalEntries);
  const currentData = isBackendPagination ? data : sortedAndFilteredData.slice(startIndex - 1, endIndex);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const SortIndicator = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />;
  };

  // Get cell value for display
  const getCellValue = (item, col) => {
    let value;
    if (typeof col.accessor === 'function') {
      value = col.accessor(item);
    } else {
      value = getNestedValue(item, col.accessor);
    }
    if (col.render) {
      return col.render(value, item);
    }
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  return (
    <div className="bg-brand-surface p-4 sm:p-6 rounded-xl shadow-card border border-brand-border/50">
      {!isBackendPagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="entries" className="text-brand-text-secondary text-sm">Show</label>
            <select
              id="entries"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent p-2"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-brand-text-secondary text-sm">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="search" className="text-brand-text-secondary text-sm">Search:</label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent p-2 w-48"
            />
          </div>
        </div>
      )}

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left text-brand-text-secondary">
          <thead className="text-xs text-brand-text-secondary uppercase bg-brand-hover">
            <tr>
              {columns.map((col, index) => (
                <th key={index} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(typeof col.accessor === 'function' ? col.accessor.name : col.accessor)}>
                  <div className="flex items-center gap-2">
                    {col.header}
                    <SortIndicator columnKey={typeof col.accessor === 'function' ? col.accessor.name : col.accessor} />
                  </div>
                </th>
              ))}
              {actionButtons && <th scope="col" className="px-6 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, rowIndex) => (
              <tr key={rowIndex} className={`bg-white border-b border-brand-border hover:bg-brand-hover ${rowClassName ? rowClassName(item) : ''}`}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {getCellValue(item, col)}
                  </td>
                ))}
                {actionButtons && (
                  <td className="px-6 py-4">{actionButtons(item)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {currentData.map((item, rowIndex) => (
          <div key={rowIndex} className="bg-white border border-brand-border/50 rounded-xl p-4 shadow-soft">
            <div className="grid grid-cols-1 gap-3">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-1 text-sm">
                  <span className="text-brand-text-secondary font-medium">{col.header}</span>
                  <span className="text-brand-text-primary">{getCellValue(item, col)}</span>
                </div>
              ))}
            </div>
            {actionButtons && (
              <div className="mt-4 flex flex-wrap gap-2">{actionButtons(item)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
        <span className="text-brand-text-secondary text-sm mb-4 sm:mb-0">
          Showing {startIndex} to {endIndex} of {totalEntries} entries
        </span>
        <div className="flex items-center">
          <button
            onClick={() => {
              if (isBackendPagination) {
                pagination.onPageChange(pagination.page - 1);
              } else {
                setCurrentPage(prev => Math.max(prev - 1, 1));
              }
            }}
            disabled={isBackendPagination ? pagination.page === 1 : currentPage === 1}
            className="px-3 py-1 rounded-l-lg bg-white text-brand-text-primary hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed border border-r-0 border-brand-border"
          >
            Previous
          </button>
          <span className="px-4 py-1 bg-brand-accent text-white border-y border-brand-accent">{isBackendPagination ? pagination.page : currentPage}</span>
          <button
            onClick={() => {
              if (isBackendPagination) {
                pagination.onPageChange(pagination.page + 1);
              } else {
                setCurrentPage(prev => Math.min(prev + 1, totalPages));
              }
            }}
            disabled={isBackendPagination ? pagination.page === totalPages : (currentPage === totalPages || totalEntries === 0)}
            className="px-3 py-1 rounded-r-lg bg-white text-brand-text-primary hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed border border-l-0 border-brand-border"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;