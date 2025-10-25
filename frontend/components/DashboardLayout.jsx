import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import CustomerDetails from '../pages/CustomerDetails';
import PaymentMode from '../pages/PaymentMode';
import TypeOfPayment from '../pages/TypeOfPayment';
import TypeOfCollection from '../pages/TypeOfCollection';
import PaymentCollection from '../pages/PaymentCollection';
import ChangePassword from '../pages/ChangePassword';
import Reports from '../pages/Reports';

const DashboardLayout = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
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
      case 'payment_collection':
        return <PaymentCollection />;
      case 'reports':
        return <Reports />;
      case 'change_password':
        return <ChangePassword />;
      case 'dashboard':
      default:
        return <div className="p-6"><h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1><p className="text-brand-text-secondary mt-2">Welcome to your Ananda Honda Dashboard.</p></div>;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
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