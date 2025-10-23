import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { EmailIcon, LockIcon } from '../components/icons/Icons';
import { authApi } from '../api/authApi.js';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: 'billing', password: '', branch: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await authApi.login({ username: formData.username, password: formData.password });
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Login successful!');
      onLogin(user);
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-text-primary">Ananda Honda</h1>
        </div>
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border">
          <h2 className="text-xl font-semibold text-center text-brand-text-secondary mb-6">Sign in to start your session</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <select 
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                required
              >
                <option value="" disabled>Select Branch</option>
                <option value="Main Branch">Main Branch</option>
                <option value="Service Center">Service Center</option>
              </select>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-secondary">
                <EmailIcon />
              </span>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                required
              />
            </div>
            <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-secondary">
                    <LockIcon />
                </span>
                <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-white border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    required
                />
            </div>
            <div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full px-4 py-3 font-bold text-white bg-brand-accent rounded-lg hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-accent transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
            <div className="text-center">
              <a href="#" className="text-sm text-brand-accent hover:underline">
                I forgot my password
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;