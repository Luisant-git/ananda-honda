import React, { useState, useEffect } from 'react';
import { DashboardIcon, MasterIcon, PaymentIcon, ReportIcon, SettingsIcon, ChevronDownIcon, CloseIcon, MenuIcon } from './icons/Icons';
import { menuPermissionApi } from '../api/menuPermissionApi';

const Sidebar = ({ currentView, setCurrentView, isSidebarOpen, setSidebarOpen, isSidebarCollapsed, setSidebarCollapsed, user }) => {
  const [openMenus, setOpenMenus] = useState({
    master: true,
    payment_collection: false,
    settings: false,
    reports: false,
  });
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const perms = await menuPermissionApi.get();
        setPermissions(perms);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };
    fetchPermissions();
  }, [user]);

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
        className={`flex items-center p-2 text-base font-normal rounded-lg transition-colors duration-150 ${isSidebarCollapsed ? 'justify-center' : ''}
          ${isSubmenu ? (isSidebarCollapsed ? '' : 'pl-11') : ''}
          ${isActive ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'}`}
        title={isSidebarCollapsed ? label : ''}
      >
        {!isSubmenu && <span className={isSidebarCollapsed ? '' : 'mr-3'}>{icon}</span>}
        {!isSidebarCollapsed && <span>{label}</span>}
      </a>
    );
  };
  
  const NavGroup = ({ menuKey, label, icon, children }) => {
    const isOpen = openMenus[menuKey];
    
    if (isSidebarCollapsed) {
      return (
        <li>
          <div className="flex items-center justify-center p-2 text-base font-normal text-brand-text-secondary rounded-lg hover:bg-brand-hover hover:text-brand-text-primary transition-all duration-150" title={label}>
            {icon}
          </div>
        </li>
      );
    }
    
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
        <ul className={`py-2 space-y-2 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 overflow-visible' : 'max-h-0 overflow-hidden'}`}>
          {isOpen && children}
        </ul>
      </li>
    );
  };


  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`bg-brand-surface text-brand-text-primary ${isSidebarCollapsed ? 'w-16' : 'w-64'} fixed top-0 left-0 h-full z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 flex flex-col border-r border-brand-border`}>
         <div className="flex items-center justify-between p-4 border-b border-brand-border">
            {!isSidebarCollapsed && <h1 className="text-xl font-bold">Ananda Motowings Private Limited</h1>}
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1 text-brand-text-secondary hover:text-brand-text-primary">
                <MenuIcon />
              </button>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-brand-text-secondary hover:text-brand-text-primary">
                <CloseIcon />
              </button>
            </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {permissions?.dashboard && <li><NavLink view="dashboard" label="Dashboard" icon={<DashboardIcon />} /></li>}
            
            {permissions?.master && (
              <NavGroup menuKey="master" label="Master" icon={<MasterIcon />}>
                {permissions.master.customer_details && <li><NavLink view="customer_details" label="Customer Details" isSubmenu /></li>}
                {permissions.master.payment_mode && <li><NavLink view="payment_mode" label="Payment Mode" isSubmenu /></li>}
                {permissions.master.type_of_payment && <li><NavLink view="type_of_payment" label="Type of Payment" isSubmenu /></li>}
                {permissions.master.type_of_collection && <li><NavLink view="type_of_collection" label="Type of Collection" isSubmenu /></li>}
                {permissions.master.vehicle_model && <li><NavLink view="vehicle_model" label="Vehicle Model" isSubmenu /></li>}
                {permissions.master.create_enquiry && <li><NavLink view="vehicle_enquiry_form" label="Create Enquiry" isSubmenu /></li>}
              </NavGroup>
            )}

            {(permissions?.payment_collection?.sales || permissions?.payment_collection?.service) && (
              <NavGroup menuKey="payment_collection" label="Payment Collection" icon={<PaymentIcon />}>
                {permissions?.payment_collection?.sales && <li><NavLink view="payment_collection" label="Sales" isSubmenu /></li>}
                {permissions?.payment_collection?.service && <li><NavLink view="service_payment_collection" label="Service" isSubmenu /></li>}
              </NavGroup>
            )}

            {(permissions?.reports?.payment_collection_report || permissions?.reports?.service_payment_collection_report || permissions?.reports?.enquiry_report) && (
              <NavGroup menuKey="reports" label="Report" icon={<ReportIcon />}>
                  {permissions?.reports?.payment_collection_report && <li><NavLink view="reports" label="Sales Report" isSubmenu /></li>}
                  {permissions?.reports?.service_payment_collection_report && <li><NavLink view="service_reports" label="Service Report" isSubmenu /></li>}
                  {permissions?.reports?.enquiry_report && <li><NavLink view="enquiry_management" label="Enquiry Report" isSubmenu /></li>}
              </NavGroup>
            )}

            {permissions?.settings && (
              <NavGroup menuKey="settings" label="Settings" icon={<SettingsIcon />}>
                 {permissions.settings.change_password && <li><NavLink view="change_password" label="Change Password" isSubmenu /></li>}
                 {permissions.settings.user_management && <li><NavLink view="user_management" label="User Management" isSubmenu /></li>}
                 {permissions.settings.menu_permission && <li><NavLink view="menu_permission" label="Menu Permission" isSubmenu /></li>}
              </NavGroup>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;