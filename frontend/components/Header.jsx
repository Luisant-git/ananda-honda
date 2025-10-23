import React, { useState, useEffect } from 'react';
import { MenuIcon, UserIcon } from './icons/Icons';

const Header = ({ user, onLogout, toggleSidebar }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).replace(/,/g, '');
  };

  return (
    <header className="bg-brand-surface text-brand-text-primary shadow-sm z-10 border-b border-brand-border">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
            <button onClick={toggleSidebar} className="text-brand-text-secondary hover:text-brand-text-primary focus:outline-none md:hidden mr-4">
                <MenuIcon />
            </button>
            <h1 className="text-xl font-semibold hidden md:block">Ananda Honda</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-brand-text-secondary hidden sm:block">{formatDate(currentDateTime)}</span>
          <div className="relative group">
            <button className="flex items-center space-x-2 text-brand-text-secondary hover:text-brand-text-primary">
              <UserIcon />
              <span className="font-medium">{user?.username || 'User'}</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-brand-surface border border-brand-border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible z-50">
                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="block px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-accent hover:text-white">Logout</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;