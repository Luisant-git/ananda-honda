import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import CustomerDetails from '../pages/CustomerDetails';
import PaymentMode from '../pages/PaymentMode';
import TypeOfPayment from '../pages/TypeOfPayment';
import TypeOfCollection from '../pages/TypeOfCollection';
import VehicleModel from '../pages/VehicleModel';
import PaymentCollection from '../pages/PaymentCollection';
import ServicePaymentCollection from '../pages/ServicePaymentCollection';
import ServicePaymentMode from '../pages/ServicePaymentMode';
import ServiceTypeOfPayment from '../pages/ServiceTypeOfPayment';
import PaymentType from '../pages/PaymentType';
import ChangePassword from '../pages/ChangePassword';
import Reports from '../pages/Reports';
import ServiceReports from '../pages/ServiceReports';
import Dashboard from '../pages/Dashboard';
import UserManagement from '../pages/UserManagement';
import FeedbackNotificationSettings from '../pages/FeedbackNotificationSettings';
import MenuPermission from '../pages/MenuPermission';
import EnquiryManagement from '../pages/EnquiryManagement';
import VehicleEnquiryForm from '../pages/VehicleEnquiryForm';
import ServiceTypeOfCollection from '../pages/ServiceTypeOfCollection';
import SalesInvoiceMaster from '../pages/SalesInvoiceMaster';
import ServiceImport from '../pages/ServiceImport';
import ServiceType from '../pages/ServiceType';
import FullPaymentReport from '../pages/FullPaymentReport';
import PartPaymentReport from '../pages/PartPaymentReport';
import ServiceTypeOfPart from '../pages/ServiceTypeOfPart';
import ServiceReminderReport from '../pages/ServiceReminderReport';
import ServiceFeedbackReport from '../pages/ServiceFeedbackReport';
import OverallServiceReport from '../pages/OverallServiceReport';
import QuickStart from '../pages/QuickStart';
import LocationMaster from '../pages/LocationMaster';
import PineLabsConfig from '../pages/PineLabsConfig';
import PineLabsTransactions from '../pages/PineLabsTransactions';
import BranchMaster from '../pages/BranchMaster';
import DeveloperLogs from '../pages/DeveloperLogs';

const DashboardLayout = ({ user, onLogout }) => {
  const isEnquiry = user?.role === 'ENQUIRY';
  const [currentView, _setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('currentView');
    return savedView || (isEnquiry ? 'customer_details' : 'quick_start');
  });
  const [viewHistory, setViewHistory] = useState([]);
  
  const setCurrentView = (newView) => {
    if (newView !== currentView) {
      if (newView === 'quick_start' || newView === 'dashboard') {
        setViewHistory([]);
      } else {
        setViewHistory(prev => [...prev, currentView]);
      }
      _setCurrentView(newView);
    }
  };

  const handleBack = () => {
    if (viewHistory.length > 0) {
      const newHistory = [...viewHistory];
      const prev = newHistory.pop();
      setViewHistory(newHistory);
      _setCurrentView(prev);
    } else {
      _setCurrentView('quick_start');
    }
  };

  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);
  const renderView = () => {
    switch (currentView) {
      case 'branch_master':
        return <BranchMaster user={user} />;
      case 'customer_details':
        return <CustomerDetails key="customer_details" user={user} />;
      case 'walk_in_customer':
        return <CustomerDetails key="walk_in_customer" user={user} defaultStatus="Walk in Customer" title="Walk-in Customers" />;
      case 'vehicle_enquiry_form':
        return <VehicleEnquiryForm setCurrentView={setCurrentView} />;
      case 'payment_mode':
        return <PaymentMode user={user} />;
      case 'type_of_payment':
        return <TypeOfPayment user={user} />;
      case 'type_of_collection':
        return <TypeOfCollection user={user} />;
      case 'vehicle_model':
        return <VehicleModel user={user} />;
      case 'payment_collection':
        return <PaymentCollection user={user} />;
      case 'service_payment_collection':
        return <ServicePaymentCollection user={user} />;
      case 'service_payment_collection_full':
        return <ServicePaymentCollection user={user} subType="full" />;
      case 'service_payment_collection_advance':
        return <ServicePaymentCollection user={user} subType="advance" />;
      case 'service_payment_collection_xyz':
        return <ServicePaymentCollection user={user} subType="xyz" />;
      case 'service_payment_mode':
        return <ServicePaymentMode user={user} />;
      case 'service_type_of_payment':
        return <ServiceTypeOfPayment user={user} />;
      case 'payment_type':
        return <PaymentType user={user} />;
      case 'service_type_of_collection':               
        return <ServiceTypeOfCollection user={user} />;
      case 'service_type_of_part':
        return <ServiceTypeOfPart user={user} />;
      case 'sales_invoice_master':
        return <SalesInvoiceMaster user={user} />;
      case 'service_jobcard_master':
        return <ServiceImport user={user} />;
      case 'service_type':
        return <ServiceType user={user} />;
      case 'location_master':
        return <LocationMaster user={user} />;
      case 'enquiry_management':
        return <EnquiryManagement user={user} setCurrentView={setCurrentView} />;
      case 'reports':
        return <Reports user={user} />;
      case 'service_reports':
        return <ServiceReports user={user} />;
      case 'full_payment_report':
        return <FullPaymentReport user={user} />;
      case 'part_payment_report':
       return <PartPaymentReport user={user} />;
      case 'overall_service_report':
       return <OverallServiceReport user={user} />;
      case 'service_reminder_report':  
        return <ServiceReminderReport user={user} />;
      case 'service_feedback_report':
        return <ServiceFeedbackReport user={user} />;
      case 'change_password':
        return <ChangePassword />;
      case 'user_management':
        return <UserManagement user={user} />;
      case 'menu_permission':
        return <MenuPermission />;
      case 'quick_start':
        return <QuickStart setCurrentView={setCurrentView} user={user} />;
      case 'pine_labs_config':
        return <PineLabsConfig />;
      case 'pine_labs_transactions':
        return <PineLabsTransactions />;
      case 'feedback_notification':
        return <FeedbackNotificationSettings />;
      case 'developer_logs':
        return <DeveloperLogs />;
      case 'dashboard':
      default:
        return <Dashboard setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg p-4 sm:p-6 flex flex-col">
          {currentView !== 'quick_start' && currentView !== 'dashboard' && (
            <div className="mb-4 shrink-0">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-brand-text-secondary hover:text-brand-accent transition-colors font-bold px-3 py-1.5 rounded-lg hover:bg-brand-hover inline-flex border border-transparent hover:border-brand-border"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>
          )}
          <div className="flex-1 flex flex-col">
            {renderView()}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;