import React, { useState, useEffect } from 'react';
import { DashboardIcon, MasterIcon, PaymentIcon, ReportIcon, SettingsIcon, ChevronDownIcon, CloseIcon, MenuIcon } from './icons/Icons';
import { menuPermissionApi } from '../api/menuPermissionApi';
import hondaLogo from '../assets/honda.png';
import hondaRedLogo from '../assets/honda_red.png';

const Sidebar = ({ currentView, setCurrentView, isSidebarOpen, setSidebarOpen, isSidebarCollapsed, setSidebarCollapsed, user }) => {
  const [openMenus, setOpenMenus] = useState(() => {
    const savedMenus = localStorage.getItem('openMenus');
    if (savedMenus) {
      try {
        return JSON.parse(savedMenus);
      } catch (e) {
        console.error('Error parsing openMenus from localStorage:', e);
      }
    }
    return {
      master: true,
      payment_collection: false,
      settings: false,
      reports: false,
      service_report: false,
      service_payment: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('openMenus', JSON.stringify(openMenus));
  }, [openMenus]);
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await menuPermissionApi.get();
        const perms = res?.permissions || res;
        setPermissions(perms);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };
    fetchPermissions();
  }, [user]);

  const toggleMenu = (menu) => {
    setOpenMenus(prev => {
      const isCurrentlyOpen = prev[menu];
      
      // Sub-menus should only toggle themselves without affecting main menus
      if (menu === 'service_report' || menu === 'service_payment') {
        return { ...prev, [menu]: !isCurrentlyOpen };
      }

      // Opening a new main menu
      if (!isCurrentlyOpen) {
        return {
          master: menu === 'master',
          payment_collection: menu === 'payment_collection',
          settings: menu === 'settings',
          reports: menu === 'reports',
          // preserve sub-menu state if opening its parent, otherwise close it
          service_report: menu === 'reports' ? prev.service_report : false,
          service_payment: menu === 'payment_collection' ? prev.service_payment : false,
        };
      } 
      
      // Closing a main menu
      return { ...prev, [menu]: false };
    });
  };

  const hasDashboardAccess =
    !!(permissions?.dashboard?.sales || permissions?.dashboard?.service || permissions?.dashboard?.service_business);
  const hasAnyReportAccess = !!(permissions?.reports && Object.values(permissions.reports).some(value => value === true));

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
        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3 mx-2' : 'px-4 py-2.5 mx-3'} my-1 rounded-lg transition-all duration-200 group relative overflow-hidden ${
          isActive
            ? 'bg-brand-accent text-white shadow-md font-medium'
            : 'text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary'
        } ${isSubmenu ? `text-sm ${isSidebarCollapsed ? '' : 'ml-10 pl-3 pr-2'}` : 'text-[15px]'} ${isSidebarCollapsed && isSubmenu ? 'hidden' : ''}`}
      >
        {isActive && !isSubmenu && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full"></div>}
        <div className={`flex-shrink-0 ${!isSidebarCollapsed ? (isSubmenu ? 'mr-3' : 'mr-4') : ''} ${isActive ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-accent transition-colors'}`}>
          {icon}
        </div>
        {!isSidebarCollapsed && <span className="flex-1 whitespace-nowrap tracking-wide">{label}</span>}
      </a>
    );
  };

  const NavGroup = ({ label, icon, menuKey, children }) => {
    const isOpen = openMenus[menuKey];
    return (
      <div className="mb-2">
        <button
          onClick={() => toggleMenu(menuKey)}
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3 mx-2' : 'justify-between px-4 py-3 mx-3'} my-1 rounded-lg transition-all duration-200 group hover:bg-brand-hover text-brand-text-primary`}
          style={{ width: isSidebarCollapsed ? 'calc(100% - 16px)' : 'calc(100% - 24px)' }}
        >
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className={`${!isSidebarCollapsed ? 'mr-4' : ''} text-brand-text-secondary group-hover:text-brand-accent transition-colors ${isOpen ? 'text-brand-accent' : ''}`}>
              {icon}
            </div>
            {!isSidebarCollapsed && <span className={`font-semibold tracking-wide whitespace-nowrap text-left text-[15px] ${isOpen ? 'text-brand-accent' : ''}`}>{label}</span>}
          </div>
          {!isSidebarCollapsed && (
            <ChevronDownIcon
              className={`w-4 h-4 text-brand-text-secondary transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-brand-accent' : ''
              }`}
            />
          )}
        </button>
        {!isSidebarCollapsed && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const logoToUse = user?.brand === 'REDWINGS' ? hondaRedLogo : hondaLogo;

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      <div
        className={`fixed md:relative top-0 left-0 h-full bg-white border-r border-brand-border z-30 transform transition-transform duration-300 ease-in-out flex flex-col shadow-floating md:flex-shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${isSidebarCollapsed ? 'md:w-20' : 'w-72 md:w-[290px]'}`}
      >
        <div className={`flex items-center border-b border-brand-border bg-white sticky top-0 z-10 shadow-sm ${isSidebarCollapsed ? 'justify-center px-0 h-16' : 'justify-between px-5 py-3'}`}>
          {!isSidebarCollapsed && (
            <div className="flex flex-col items-center justify-center">
                <img src={logoToUse} alt="Honda Logo" className="h-20 w-auto object-contain" />
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center w-full ${user?.brand === 'REDWINGS' ? 'text-red-600' : 'text-blue-600'}`}>
                  {user?.brand === 'REDWINGS' ? 'Redwing' : 'Bigwing'}
                </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1 text-brand-text-secondary hover:text-brand-accent transition-colors rounded-lg hover:bg-brand-hover">
              <MenuIcon />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-brand-text-secondary hover:text-brand-accent transition-colors rounded-lg hover:bg-brand-hover">
              <CloseIcon />
            </button>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <NavLink view="quick_start" label="Quick Start" icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              } />
            </li>
            {hasDashboardAccess && (
              <li>
                <NavLink view="dashboard" label="Dashboard" icon={<DashboardIcon />} />
              </li>
            )}

            {permissions?.master && (
              <NavGroup menuKey="master" label="Master" icon={<MasterIcon />}>
                {permissions.master.branch_master !== false && <li><NavLink view="branch_master" label="Branch Master" isSubmenu /></li>}
                {permissions.master.customer_details && <li><NavLink view="customer_details" label="Customer Details" isSubmenu /></li>}
                {permissions.master.walk_in_customer && <li><NavLink view="walk_in_customer" label="Walk-in Customers" isSubmenu /></li>}
                {/* Fixed: Now wrapped in permission check */}
                {permissions.master.sales_invoice_master && <li><NavLink view="sales_invoice_master" label="Sales Invoice Master" isSubmenu /></li>}
                {permissions.master.jobcard_master && (
                  <li>
                    <NavLink
                      view="service_jobcard_master"
                      label="Service Import"
                      isSubmenu
                    />
                  </li>
                )}
                {permissions.master.payment_mode && <li><NavLink view="payment_mode" label="Payment Mode" isSubmenu /></li>}
                {permissions.master.type_of_payment && <li><NavLink view="type_of_payment" label="Type of Payment" isSubmenu /></li>}
                {permissions.master.type_of_collection && <li><NavLink view="type_of_collection" label="Type of Collection" isSubmenu /></li>}
                {permissions.master.vehicle_model && <li><NavLink view="vehicle_model" label="Vehicle Model" isSubmenu /></li>}
                {permissions.master.service_payment_mode && <li><NavLink view="service_payment_mode" label="S - Payment Mode" isSubmenu /></li>}
                {permissions.master.service_type_of_payment && <li><NavLink view="service_type_of_payment" label="S - Payment Type" isSubmenu /></li>}
                {permissions.master.payment_type && <li><NavLink view="payment_type" label="Payment Type Master" isSubmenu /></li>}
                {permissions?.master?.service_type_of_collection && <li><NavLink view="service_type_of_collection" label="S - Type of Collection" isSubmenu /></li>}
                {permissions.master.service_type && 
                  <li>
                    <NavLink
                      view="service_type"
                      label="S - Type of Service"
                      isSubmenu
                    />
                  </li>
                }
                {/* S - Type of Part */}
                {permissions.master.service_type_of_part && 
                  <li>
                    <NavLink
                      view="service_type_of_part"
                      label="S - Type of Part"
                      isSubmenu
                    />
                  </li>
                }
                {permissions?.master?.location_master && <li><NavLink view="location_master" label="Locations" isSubmenu /></li>}
              </NavGroup>
            )}

            {(permissions?.payment_collection?.sales || permissions?.payment_collection?.service) && (
              <NavGroup menuKey="payment_collection" label="Payment Collection" icon={<PaymentIcon />}>
                {permissions?.payment_collection?.sales && <li><NavLink view="payment_collection" label="Sales Payments" isSubmenu /></li>}
                {(permissions?.payment_collection?.service?.full_payment_menu || permissions?.payment_collection?.service?.advance_payment_menu) && (
                  <li>
                    <NavLink view="service_payment_collection" label="Service Payments" isSubmenu />
                  </li>
                )}
                {permissions?.payment_collection?.service?.service_plan_payment_menu && (
                  <li>
                    <NavLink view="service_payment_collection_xyz" label="Additional Service Plan" isSubmenu />
                  </li>
                )}
                <li><NavLink view="pine_labs_transactions" label="Pine Labs Txns" isSubmenu /></li>
              </NavGroup>
            )}

            {/* Reports - Main Parent */}
            {hasAnyReportAccess && (
              <NavGroup menuKey="reports" label="Reports" icon={<ReportIcon />}>
                
                {/* Sales Report */}
                {permissions?.reports?.payment_collection_report && (
                  <li><NavLink view="reports" label="Sales Report" isSubmenu /></li>
                )}
                
                {/* Service Report */}
                {permissions?.reports?.service_payment_collection_report && (
                  <li>
                    <div>
                      <div
                        onClick={() => toggleMenu('service_report')}
                        className={`flex items-center justify-between w-full p-2.5 mx-3 rounded-lg transition-colors duration-200 cursor-pointer text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary text-sm font-medium`}
                        style={{ paddingLeft: '2.5rem', width: 'calc(100% - 24px)' }}
                      >
                        <span className="flex-1 text-left">Service Report</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transform transition-transform duration-200 ${
                            openMenus.service_report ? 'rotate-180 text-brand-accent' : ''
                          }`}
                        />
                      </div>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          openMenus.service_report ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}
                      >
                        <ul className="space-y-1 mt-1">
                          {permissions?.reports?.service_reports && (
                            <li>
                              <NavLink view="service_reports" label="Service plan Report" isSubmenu />
                            </li>
                          )}
                          {permissions?.reports?.full_payment_report && (
                            <li>
                              <NavLink view="full_payment_report" label="Full Payment Report" isSubmenu />
                            </li>
                          )}
                          {permissions?.reports?.part_payment_report && (
                            <li>
                              <NavLink view="part_payment_report" label="Advance Payment Report" isSubmenu />
                            </li>
                          )}
                          {permissions?.reports?.overall_service_report && (
                            <li>
                              <NavLink view="overall_service_report" label="Overall Service Report" isSubmenu />
                            </li>
                          )}
                          {permissions?.reports?.service_feedback_report && (
                            <li>
                              <NavLink view="service_feedback_report" label="Service Feedback Report" isSubmenu />
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </li>
                )}
                
                {/* Service Reminder Report */}
                {permissions?.reports?.service_reminder_report && (
                  <li><NavLink view="service_reminder_report" label="Service Reminder Report" isSubmenu /></li>
                )}
                
              </NavGroup>
            )}

            {permissions?.settings && (
              <NavGroup menuKey="settings" label="Settings" icon={<SettingsIcon />}>
                {permissions.settings.change_password && <li><NavLink view="change_password" label="Change Password" isSubmenu /></li>}
                {permissions.settings.user_management && <li><NavLink view="user_management" label="User Management" isSubmenu /></li>}
                {permissions.settings.menu_permission && <li><NavLink view="menu_permission" label="Menu Permission" isSubmenu /></li>}
                {permissions.settings.feedback_notification && <li><NavLink view="feedback_notification" label="Feedback Notification" isSubmenu /></li>}
                <li><NavLink view="pine_labs_config" label="Pine Labs Config" isSubmenu /></li>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'DEVELOPER') && (
                  <li><NavLink view="developer_logs" label="Developer Logs" isSubmenu /></li>
                )}
              </NavGroup>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;