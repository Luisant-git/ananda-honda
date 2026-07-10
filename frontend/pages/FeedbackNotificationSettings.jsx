import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/feedback-notification`;

const FeedbackNotificationSettings = () => {
  const [settings, setSettings] = useState({
    ADMIN: '',
    CRM_MANAGER: '',
    GENERAL_MANAGER: '',
    SERVICE_MANAGER: ''
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
        CRM_MANAGER: '',
        GENERAL_MANAGER: '',
        SERVICE_MANAGER: ''
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
    { key: 'CRM_MANAGER', label: 'CRM Manager' },
    { key: 'GENERAL_MANAGER', label: 'General Manager' },
    { key: 'SERVICE_MANAGER', label: 'Service Manager' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Notifications</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Configure the WhatsApp numbers that will automatically receive customer feedback alerts and reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rolesToConfigure.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
            {/* Decorative background accent */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-accent transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-in-out"></div>
            
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {label}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Notified on Satisfied/Dissatisfied</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-medium text-sm">
                    +91
                  </span>
                  <input
                    type="text"
                    placeholder="10-digit number"
                    maxLength="10"
                    value={settings[key]}
                    onChange={(e) => handleChange(key, e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => handleSave(key)}
                  disabled={isLoading}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center min-w-[80px]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackNotificationSettings;
