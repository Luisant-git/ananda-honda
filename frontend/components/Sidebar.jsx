import React, { useState, useEffect } from 'react';
import { DashboardIcon, MasterIcon, PaymentIcon, ReportIcon, SettingsIcon, ChevronDownIcon, CloseIcon, MenuIcon } from './icons/Icons';
import { menuPermissionApi } from '../api/menuPermissionApi';
import hondaLogo from '../assets/honda.png';

const Sidebar = ({ currentView, setCurrentView, isSidebarOpen, setSidebarOpen, isSidebarCollapsed, setSidebarCollapsed, user }) => {
  const [openMenus, setOpenMenus] = useState({
    master: true,
    payment_collection: false,
    settings: false,
    reports: false,
    service_report: false,
  });
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
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const hasDashboardAccess =
    !!(permissions?.dashboard?.sales || permissions?.dashboard?.service || permissions?.dashboard?.service_business);

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
        <li className="mt-2">
          <div
            className="flex items-center justify-center p-2 text-base font-normal text-brand-text-secondary rounded-lg hover:bg-brand-hover hover:text-brand-text-primary transition-all duration-150"
            title={label}
          >
            {icon}
          </div>
        </li>
      );
    }

    if (!permissions) return null;

    return (
      <li className="mt-2">
        <button
          type="button"
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-brand-text-secondary rounded-lg hover:bg-brand-hover hover:text-brand-text-primary transition-all duration-150"
          onClick={() => toggleMenu(menuKey)}
        >
          <span className="mr-3 text-lg">{icon}</span>
          <span className="flex-1 text-left whitespace-nowrap">{label}</span>
          <ChevronDownIcon
            className={`w-5 h-5 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          className={`mt-1 transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <ul className="space-y-1">
            {isOpen && children}
          </ul>
        </div>
      </li>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`bg-brand-surface text-brand-text-primary ${isSidebarCollapsed ? 'w-16' : 'w-64'} fixed top-0 left-0 h-full z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 flex flex-col border-r border-brand-border`}>
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          {!isSidebarCollapsed && <img src={hondaLogo} alt="Ananda Motowings Private Limited" className="h-16 object-contain" />}
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
                {permissions.master.customer_details && <li><NavLink view="customer_details" label="Customer Details" isSubmenu /></li>}
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
                {permissions.master.service_type_of_payment && <li><NavLink view="service_type_of_payment" label="S - Type of Payment" isSubmenu /></li>}
                {permissions?.master?.service_type_of_collection && (<li><NavLink view="service_type_of_collection" label="S - Type of Collection" isSubmenu /></li>)}
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
                {permissions?.payment_collection?.sales && <li><NavLink view="payment_collection" label="Sales" isSubmenu /></li>}
                {permissions?.payment_collection?.service && <li><NavLink view="service_payment_collection" label="Service" isSubmenu /></li>}
              </NavGroup>
            )}

            {/* Reports - Main Parent */}
            {(permissions?.reports?.payment_collection_report || 
              permissions?.reports?.service_payment_collection_report || 
              permissions?.reports?.full_payment_report ||
              permissions?.reports?.part_payment_report ||
              permissions?.reports?.service_reminder_report) && (
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
                        className={`flex items-center w-full p-2 text-base font-normal rounded-lg transition-colors duration-150 cursor-pointer text-brand-text-secondary hover:bg-brand-hover hover:text-brand-text-primary`}
                        style={{ paddingLeft: '2.75rem' }}
                      >
                        <span className="flex-1 text-left">Service Report</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transform transition-transform duration-200 ${
                            openMenus.service_report ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          openMenus.service_report ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}
                      >
                        <ul className="space-y-1 mt-1">
                          {permissions?.reports?.full_payment_report && (
                            <li>
                              <NavLink view="full_payment_report" label="Full Payment Report" isSubmenu />
                            </li>
                          )}
                          {permissions?.reports?.part_payment_report && (
                            <li>
                              <NavLink view="part_payment_report" label="Part Payment Report" isSubmenu />
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
              </NavGroup>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;