import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/feedback-notification`;

const FeedbackNotificationSettings = () => {
  const [settings, setSettings] = useState({
    ADMIN: '',
    CASHIER_SERVICE: '',
    CASHIER_SALES: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      const newSettings = {
        ADMIN: '',
        CASHIER_SERVICE: '',
        CASHIER_SALES: ''
      };
      
      data.forEach(item => {
        if (newSettings[item.role] !== undefined) {
          newSettings[item.role] = item.mobileNumber;
        }
      });
      
      setSettings(newSettings);
    } catch (error) {
      toast.error('Failed to load feedback notification settings');
    }
  };

  const handleSave = async (role) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobileNumber: settings[role] })
      });
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success(`Saved notification number for ${role.replace('_', ' ')}`);
    } catch (error) {
      toast.error(`Failed to save notification number for ${role.replace('_', ' ')}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (role, value) => {
    setSettings(prev => ({
      ...prev,
      [role]: value
    }));
  };

  const rolesToConfigure = [
    { key: 'ADMIN', label: 'Admin' },
    { key: 'CASHIER_SERVICE', label: 'Cashier Service' },
    { key: 'CASHIER_SALES', label: 'Cashier Sales' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-brand-text-primary mb-2">Feedback Notifications</h1>
      <p className="text-brand-text-secondary mb-6">
        Configure the WhatsApp numbers that will receive customer feedback notifications.
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6 space-y-6">
        {rolesToConfigure.map(({ key, label }) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="mb-3 sm:mb-0">
              <h3 className="font-semibold text-gray-800">{label}</h3>
              <p className="text-sm text-gray-500">Receives feedback when customer clicks Satisfied/Dissatisfied</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="10-digit Phone Number"
                value={settings[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 sm:w-64 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              />
              <button
                onClick={() => handleSave(key)}
                disabled={isLoading}
                className="bg-brand-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-accent-hover disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackNotificationSettings;
