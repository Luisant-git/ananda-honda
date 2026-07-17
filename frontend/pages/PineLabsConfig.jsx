import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config';

const PineLabsConfig = () => {
  const [activeTab, setActiveTab] = useState('sale');
  const [formData, setFormData] = useState({
    type: 'sale',
    merchantId: '',
    securityToken: '',
    clientId: '',
    storeId: '',
    hardwareSn: '',
    environment: 'UAT',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchConfig(activeTab);
  }, [activeTab]);

  const fetchConfig = async (type) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/pine-labs-config?type=${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (data) {
          setFormData({ ...data, type });
        } else {
          setFormData({
            type,
            merchantId: '',
            securityToken: '',
            clientId: '',
            storeId: '',
            hardwareSn: '',
            environment: 'UAT',
            status: 'Active',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch config', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/pine-labs-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      
      toast.success('Configuration saved successfully');
      fetchConfig(activeTab);
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Failed to save config', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate test connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (formData.merchantId && formData.securityToken && formData.clientId && formData.storeId) {
        toast.success('Connection to Pine Labs successful!');
      } else {
        toast.error('Please fill required credentials before testing');
      }
    } catch (error) {
      toast.error('Connection failed. Please check credentials.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = formData.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`${config.API_BASE_URL}/pine-labs-config/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus, type: activeTab })
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success(`Pine Labs integration is now ${newStatus}`);
      fetchConfig(activeTab);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pine Labs Configuration</h1>
        <button
          onClick={handleToggleStatus}
          className={`px-4 py-2 rounded-md font-medium text-white ${
            formData.status === 'Active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {formData.status === 'Active' ? 'Deactivate Integration' : 'Activate Integration'}
        </button>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('sale')}
            className={`${
              activeTab === 'sale'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            } px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200`}
          >
            Sale Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`${
              activeTab === 'service'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            } px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200`}
          >
            Service Configuration
          </button>
        </nav>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
              <input
                type="text"
                name="merchantId"
                value={formData.merchantId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Token</label>
              <input
                type="text"
                name="securityToken"
                value={formData.securityToken}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
              <input
                type="text"
                name="storeId"
                value={formData.storeId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hardware S.N</label>
              <input
                type="text"
                name="hardwareSn"
                value={formData.hardwareSn || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
              <select
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UAT">UAT (Testing)</option>
                <option value="Production">Production</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <input
                type="text"
                value={formData.status}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed text-gray-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-6 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 rounded-md font-medium transition-colors"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PineLabsConfig;
