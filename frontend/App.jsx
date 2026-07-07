import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { authApi } from './api/authApi';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let wasAuthenticated = false;
    const validateSession = async () => {
      try {
        const userData = await authApi.validate();
        setUser(userData);
        setIsAuthenticated(true);
        wasAuthenticated = true;
      } catch (error) {
        if (wasAuthenticated) {
          toast.error(error.message || 'Session expired');
        }
        setIsAuthenticated(false);
        setUser(null);
        wasAuthenticated = false;
      }
    };
    validateSession();
    const interval = setInterval(validateSession, 30000);
    return () => clearInterval(interval);
  }, []);

  // Set brand theme dynamically
  useEffect(() => {
    if (user?.brand === 'REDWINGS') {
      document.body.classList.add('theme-redwings');
      document.body.classList.remove('theme-bigwings');
      document.title = "REDWINGS CRM";
    } else {
      document.body.classList.add('theme-bigwings');
      document.body.classList.remove('theme-redwings');
      document.title = "BIGWINGS CRM";
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      {isAuthenticated ? (
        <DashboardLayout user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <Toaster position="top-center" />
    </div>
  );
};

export default App;