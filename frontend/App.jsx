import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

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
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      {isAuthenticated ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
      <Toaster position="top-center" />
    </div>
  );
};

export default App;