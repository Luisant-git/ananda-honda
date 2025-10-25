import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowRegister(false);
  };
  
  const handleRegister = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowRegister(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      {isAuthenticated ? (
        <DashboardLayout user={user} onLogout={handleLogout} />
      ) : showRegister ? (
        <Register onRegister={handleRegister} onBackToLogin={handleBackToLogin} />
      ) : (
        <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />
      )}
      <Toaster position="top-center" />
    </div>
  );
};

export default App;