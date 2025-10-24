import React, { useState } from 'react';
import { DashboardIcon, MasterIcon, PaymentIcon, ReportIcon, SettingsIcon, ChevronDownIcon, CloseIcon } from './icons/Icons';

const Sidebar = ({ currentView, setCurrentView, isSidebarOpen, setSidebarOpen }) => {
  const [openMenus, setOpenMenus] = useState({
    master: true,
    settings: false,
    reports: false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const NavLink = ({ view, label, icon, isSubmenu = false }) => {
    const isActive = currentView === view;
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setCurrentView(view);
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        }}
        className={`flex items-center p-2 text-base font-normal rounded-lg transition-colors duration-150
          ${isSubmenu ? 'pl-11' : ''}
          ${isActive ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'}`}
      >
        {!isSubmenu && <span className="mr-3">{icon}</span>}
        <span>{label}</span>
      </a>
    );
  };
  
  const NavGroup = ({ menuKey, label, icon, children }) => {
    const isOpen = openMenus[menuKey];
    return (
      <li>
        <button
          type="button"
          className="flex items-center w-full p-2 text-base font-normal text-brand-text-secondary rounded-lg hover:bg-brand-hover hover:text-brand-text-primary transition-all duration-150"
          onClick={() => toggleMenu(menuKey)}
        >
          {icon}
          <span className="flex-1 ml-3 text-left whitespace-nowrap">{label}</span>
          <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <ul className={`py-2 space-y-2 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
          {children}
        </ul>
      </li>
    );
  };


  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`bg-brand-surface text-brand-text-primary w-64 fixed top-0 left-0 h-full z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 flex flex-col border-r border-brand-border`}>
         <div className="flex items-center justify-between p-4 border-b border-brand-border">
            <h1 className="text-xl font-bold">Ananda Honda</h1>
             <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-brand-text-secondary hover:text-brand-text-primary">
                <CloseIcon />
            </button>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            <li><NavLink view="dashboard" label="Dashboard" icon={<DashboardIcon />} /></li>
            
            <NavGroup menuKey="master" label="Master" icon={<MasterIcon />}>
              <li><NavLink view="customer_details" label="Customer Details" isSubmenu /></li>
              <li><NavLink view="payment_mode" label="Payment Mode" isSubmenu /></li>
              <li><NavLink view="type_of_payment" label="Type of Payment" isSubmenu /></li>
            </NavGroup>

            <li><NavLink view="payment_collection" label="Payment Collection" icon={<PaymentIcon />} /></li>

            <NavGroup menuKey="reports" label="Report" icon={<ReportIcon />}>
                <li><NavLink view="reports" label="Reports" isSubmenu /></li>
            </NavGroup>

            <NavGroup menuKey="settings" label="Settings" icon={<SettingsIcon />}>
               <li><NavLink view="change_password" label="Change Password" isSubmenu /></li>
            </NavGroup>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;