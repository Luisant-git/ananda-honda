import React, { useState, useEffect } from 'react';
import { vehicleModelApi } from '../api/vehicleModelApi.js';
import SearchableDropdown from './SearchableDropdown.jsx';

const EnquiryForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [vehicleModels, setVehicleModels] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    enquiryType: '',
    customerName: '',
    mobileNumber: '',
    vehicleModelId: '',
    leadSources: [],
    executiveName: ''
  });

  // Hardcoded values
  const enquiryTypes = ['BIG_WING', 'INSURANCE', 'ACCESSORIES', 'HSRP'];
  const leadSources = ['WALK_IN', 'PHONE_CALL', 'WEBSITE', 'INSTAGRAM', 'GOOGLE_BUSINESS', 'FACEBOOK', 'REFERENCE'];
  const bigWingExecutives = ['Vinushree', 'Chandana', 'Jeevitha', 'Murali', 'Anusha', 'Aadharsh', 'Tejaswini', 'Punith', 'Babyrani'];
  const accessoriesExecutives = ['Amrutha', 'Sangeetha'];

  useEffect(() => {
    fetchVehicleModels();
    if (initialData) {
      setFormData({
        enquiryType: initialData.enquiryType || '',
        customerName: initialData.customerName || '',
        mobileNumber: initialData.mobileNumber || '',
        vehicleModelId: initialData.vehicleModelId?.toString() || '',
        leadSources: initialData.leadSources || [],
        executiveName: initialData.executiveName || ''
      });
      // If editing, skip to appropriate step based on enquiry type
      if (initialData.enquiryType) {
        setCurrentStep(initialData.enquiryType === 'BIG_WING' ? 2 : 3);
      }
    }
  }, [initialData]);

  const fetchVehicleModels = async () => {
    try {
      const vehicleModelsRes = await vehicleModelApi.getAll();
      setVehicleModels(vehicleModelsRes.filter(vm => vm.status === 'Active'));
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
    }
  };

  const handleEnquiryTypeChange = (type) => {
    setFormData({ ...formData, enquiryType: type });
    if (type === 'BIG_WING') {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      vehicleModelId: formData.vehicleModelId ? parseInt(formData.vehicleModelId) : null
    };
    onSubmit(submitData);
  };

  const handleLeadSourceChange = (source) => {
    setFormData(prev => ({
      ...prev,
      leadSources: prev.leadSources.includes(source)
        ? prev.leadSources.filter(s => s !== source)
        : [...prev.leadSources, source]
    }));
  };



  const getBigWingModels = () => {
    const bigWingModels = ['Activa', 'Activa 125', 'Dio', 'Dio 125', 'Shine 100', 'Shine 125', 'SP160', 'Unicorn', 'Livo'];
    return vehicleModels.filter(vm => bigWingModels.includes(vm.model));
  };

  const getAccessoriesModels = () => {
    const accessoriesModels = ['Activa 110', 'Activa 125', 'Dio', 'Shine 100', 'Shine (123 cc)', 'SP 125', 'Unicorn', 'CB125', 'Hornet', 'SP 160'];
    return vehicleModels.filter(vm => accessoriesModels.includes(vm.model));
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Welcome to Ananda Honda</h3>
        <p className="text-gray-600">Good morning/afternoon, sir/madam. How may I help you today?</p>
        
        <div>
          <label className="block text-sm font-medium mb-2">Enquiry Type *</label>
          <div className="space-y-2">
            {enquiryTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="enquiryType"
                  value={type}
                  checked={formData.enquiryType === type}
                  onChange={(e) => handleEnquiryTypeChange(e.target.value)}
                  className="mr-2"
                />
                {type.replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2 && formData.enquiryType === 'BIG_WING') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold">Big Wing Enquiry Details</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <p className="text-sm text-gray-600 mb-2">Sure, May I know your name, please?</p>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mobile Number *</label>
          <p className="text-sm text-gray-600 mb-2">Thank you, Sir/Madam. Could I have your mobile number as well?</p>
          <input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Model *</label>
          <p className="text-sm text-gray-600 mb-2">May I know the model you're interested in?</p>
          <SearchableDropdown
            options={getBigWingModels().map(vm => ({ value: vm.id.toString(), label: vm.model }))}
            value={formData.vehicleModelId}
            onChange={(value) => setFormData({ ...formData, vehicleModelId: value })}
            placeholder="Select Vehicle Model"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lead Source</label>
          <p className="text-sm text-gray-600 mb-2">May I know how you came to know about Ananda Honda, sir?</p>
          <div className="grid grid-cols-2 gap-2">
            {leadSources.map(source => (
              <label key={source} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.leadSources.includes(source)}
                  onChange={() => handleLeadSourceChange(source)}
                  className="mr-2"
                />
                {source.replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Executive</label>
          <p className="text-sm text-gray-600 mb-2">Thank you for the details sir/madam I am assigning our sales executive, Mr./Mrs/Miss ___, who will assist you.</p>
          <SearchableDropdown
            options={bigWingExecutives.map(name => ({ value: name, label: name }))}
            value={formData.executiveName}
            onChange={(value) => setFormData({ ...formData, executiveName: value })}
            placeholder="Select Executive"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </form>
    );
  }

  if (currentStep === 3 && ['ACCESSORIES', 'INSURANCE', 'HSRP'].includes(formData.enquiryType)) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold">Accessories, Insurance, HSRP</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <p className="text-sm text-gray-600 mb-2">Sure, May I know your name, please?</p>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mobile Number *</label>
          <p className="text-sm text-gray-600 mb-2">Thank you, Sir/Madam. Could I have your mobile number as well?</p>
          <input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Model *</label>
          <p className="text-sm text-gray-600 mb-2">What is the Model you are Looking For {formData.enquiryType}?</p>
          <SearchableDropdown
            options={getAccessoriesModels().map(vm => ({ value: vm.id.toString(), label: vm.model }))}
            value={formData.vehicleModelId}
            onChange={(value) => setFormData({ ...formData, vehicleModelId: value })}
            placeholder="Select Vehicle Model"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Executive</label>
          <p className="text-sm text-gray-600 mb-2">Thank you for the details sir/madam I am assigning our {formData.enquiryType}/HSRP/Insurance, Mr./Mrs/Miss ___, who will assist you.</p>
          <SearchableDropdown
            options={accessoriesExecutives.map(name => ({ value: name, label: name }))}
            value={formData.executiveName}
            onChange={(value) => setFormData({ ...formData, executiveName: value })}
            placeholder="Select Executive"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </form>
    );
  }

  return null;
};

export default EnquiryForm;