import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import CustomerDetails from '../pages/CustomerDetails';
import PaymentMode from '../pages/PaymentMode';
import TypeOfPayment from '../pages/TypeOfPayment';
import TypeOfCollection from '../pages/TypeOfCollection';
import VehicleModel from '../pages/VehicleModel';
import PaymentCollection from '../pages/PaymentCollection';
import ChangePassword from '../pages/ChangePassword';
import Reports from '../pages/Reports';
import Dashboard from '../pages/Dashboard';
import UserManagement from '../pages/UserManagement';
import MenuPermission from '../pages/MenuPermission';

const DashboardLayout = ({ user, onLogout }) => {
  const isEnquiry = user?.role === 'ENQUIRY';
  const [currentView, setCurrentView] = useState(isEnquiry ? 'customer_details' : 'dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const renderView = () => {
    switch (currentView) {
      case 'customer_details':
        return <CustomerDetails user={user} />;
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
      case 'reports':
        return <Reports />;
      case 'change_password':
        return <ChangePassword />;
      case 'user_management':
        return <UserManagement />;
      case 'menu_permission':
        return <MenuPermission />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg p-4 sm:p-6">
          {renderView()}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;