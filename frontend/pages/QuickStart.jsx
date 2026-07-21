import React, { useState, useEffect } from 'react';
import { menuPermissionApi } from '../api/menuPermissionApi';
import { 
  DashboardIcon, 
  MasterIcon, 
  PaymentIcon, 
  ReportIcon, 
  SettingsIcon 
} from '../components/icons/Icons';
import { Users, FileText, Upload, CreditCard, PieChart, Shield, Lock, FileBarChart, Settings, PenTool, LayoutDashboard } from 'lucide-react';

const QuickStart = ({ setCurrentView, user }) => {
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

  if (!permissions) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  const checkPerm = (path) => {
    if (!path) return true;
    const parts = path.split('.');
    let curr = permissions;
    for (const part of parts) {
      if (curr === undefined || curr === null) return false;
      curr = curr[part];
    }
    return !!curr;
  };

  const hasDashboardAccess = 
    permissions?.dashboard?.sales || 
    permissions?.dashboard?.service || 
    permissions?.dashboard?.service_business;

  const categories = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 text-brand-accent" />,
      show: hasDashboardAccess,
      items: [
        { view: 'dashboard', label: 'Overview Dashboard', desc: 'View complete business metrics and KPIs.', icon: <PieChart className="w-8 h-8 text-blue-500" />, bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' }
      ]
    },
    {
      title: "Master Data",
      icon: <Users className="w-5 h-5 text-brand-accent" />,
      show: !!permissions?.master,
      items: [
        { view: 'customer_details', label: 'Customer Details', desc: 'Manage CRM contacts and leads.', icon: <Users className="w-8 h-8 text-green-600" />, perm: 'master.customer_details', bgColor: 'bg-green-50 hover:bg-green-100 border-green-200' },
        { view: 'sales_invoice_master', label: 'Sales Invoice Master', desc: 'Manage sales invoices.', icon: <FileText className="w-8 h-8 text-purple-600" />, perm: 'master.sales_invoice_master', bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
        { view: 'service_jobcard_master', label: 'Service Import', desc: 'Import Jobcards and Invoices.', icon: <Upload className="w-8 h-8 text-pink-600" />, perm: 'master.jobcard_master', bgColor: 'bg-pink-50 hover:bg-pink-100 border-pink-200' },
        { view: 'payment_type', label: 'Payment Type Master', desc: 'Manage payment type master records.', icon: <PenTool className="w-8 h-8 text-fuchsia-600" />, perm: 'master.payment_type', bgColor: 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200' },
      ]
    },
    {
      title: "Payment Collection",
      icon: <CreditCard className="w-5 h-5 text-brand-accent" />,
      show: !!permissions?.payment_collection,
      items: [
        { view: 'payment_collection', label: 'Sales Payment Collection', desc: 'Manage payments for vehicle sales.', icon: <CreditCard className="w-8 h-8 text-indigo-600" />, perm: 'payment_collection.sales', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
        { view: 'service_payment_collection_full', label: 'Full Payment (Service)', desc: 'Process and view completed service payments.', icon: <CreditCard className="w-8 h-8 text-teal-600" />, perm: 'payment_collection.service.full_payment_menu', bgColor: 'bg-teal-50 hover:bg-teal-100 border-teal-200' },
        { view: 'service_payment_collection_advance', label: 'Advance Payment (Service)', desc: 'Record advance payments for services.', icon: <CreditCard className="w-8 h-8 text-cyan-600" />, perm: 'payment_collection.service.advance_payment_menu', bgColor: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200' },
        { view: 'service_payment_collection_xyz', label: 'Value Added Service', desc: 'Record value added service payments for RSA, AMC, EW.', icon: <CreditCard className="w-8 h-8 text-sky-600" />, perm: 'payment_collection.service.service_plan_payment_menu', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      ]
    },
    {
      title: "Reports",
      icon: <FileBarChart className="w-5 h-5 text-brand-accent" />,
      show: !!permissions?.reports,
      items: [
        { view: 'reports', label: 'Sales Report', desc: 'View sales collection reports.', icon: <FileBarChart className="w-8 h-8 text-rose-600" />, perm: 'reports.payment_collection_report', bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200' },
        { view: 'full_payment_report', label: 'Service Full Payment Report', desc: 'View completed service payments.', icon: <FileBarChart className="w-8 h-8 text-amber-600" />, perm: 'reports.full_payment_report', bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
        { view: 'part_payment_report', label: 'Service Advance Payment Report', desc: 'View advance payment collection reports.', icon: <FileBarChart className="w-8 h-8 text-yellow-600" />, perm: 'reports.part_payment_report', bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
        { view: 'service_reports', label: 'Value Added Service Report', desc: 'View value added service payment reports filtered by RSA, AMC, and EW.', icon: <FileBarChart className="w-8 h-8 text-sky-600" />, perm: 'reports.service_reports', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
        { view: 'service_reminder_report', label: 'Service Reminder Report', desc: 'View upcoming service reminders.', icon: <FileBarChart className="w-8 h-8 text-emerald-600" />, perm: 'reports.service_reminder_report', bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
      ]
    },
    {
      title: "Settings",
      icon: <Settings className="w-5 h-5 text-brand-accent" />,
      show: !!permissions?.settings,
      items: [
        { view: 'user_management', label: 'User Management', desc: 'Manage system users and roles.', icon: <Users className="w-8 h-8 text-slate-700" />, perm: 'settings.user_management', bgColor: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
        { view: 'menu_permission', label: 'Menu Permissions', desc: 'Configure access control.', icon: <Shield className="w-8 h-8 text-red-600" />, perm: 'settings.menu_permission', bgColor: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { view: 'change_password', label: 'Change Password', desc: 'Update your account password.', icon: <Lock className="w-8 h-8 text-sky-600" />, perm: 'settings.change_password', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text-primary">Welcome to Quick Start</h1>
        <p className="text-brand-text-secondary mt-1">
          Navigate quickly to any module you have access to. Select a card below to jump straight into your workflow.
        </p>
      </div>

      <div className="space-y-10">
        {categories.map((category, idx) => {
          if (!category.show) return null;
          
          const availableItems = category.items.filter(item => checkPerm(item.perm));
          if (availableItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-brand-border pb-2">
                {category.icon}
                <h2 className="text-xl font-bold text-brand-text-primary">{category.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableItems.map((item, itemIdx) => (
                  <div 
                    key={itemIdx}
                    onClick={() => setCurrentView(item.view)}
                    className={`${item.bgColor || 'bg-brand-surface border-brand-border'} border rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col h-full`}
                  >
                    <div className="mb-4 p-3 bg-white/60 rounded-lg w-fit group-hover:scale-110 group-hover:bg-white transition-all duration-300 shadow-sm">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 transition-colors">{item.label}</h3>
                    <p className="text-sm text-gray-600 flex-1">{item.desc}</p>
                    <div className="mt-4 flex items-center text-gray-800 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                      Open Module <span className="ml-1">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickStart;
