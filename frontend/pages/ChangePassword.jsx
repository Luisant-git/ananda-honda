import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';

const ChangePassword = () => {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.changePassword(formData.newPassword);
      toast.success('Password changed successfully!');
      setFormData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Password change failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Change Password</h1>
      
      <div className="bg-brand-surface p-6 rounded-lg shadow-sm max-w-2xl mx-auto border border-brand-border">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-text-secondary mb-2">New Password*</label>
            <input
              type="password"
              id="new-password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="New Password"
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-3 focus:ring-brand-accent focus:border-brand-accent"
              required
            />
          </div>
          <div>
            <label htmlFor="reenter-password" className="block text-sm font-medium text-brand-text-secondary mb-2">Re-Enter Password*</label>
            <input
              type="password"
              id="reenter-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Re-Enter Password"
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-3 focus:ring-brand-accent focus:border-brand-accent"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Changing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;