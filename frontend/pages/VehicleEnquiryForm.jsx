import React, { useState, useEffect } from "react";
import { enquiryApi } from "../api/enquiryApi.js";
import { customerApi } from "../api/customerApi.js";
import toast from "react-hot-toast";

const VehicleEnquiryForm = ({ setCurrentView }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customerName: "",
    enquiryType: "",
    vehicleModel: "",
    executiveName: "",
    leadSources: [],
    mobileNumber: ""
  });

  const enquiryTypes = ["BIG_WING", "INSURANCE", "ACCESSORIES", "HSRP"];
  const leadSources = ["WALK_IN", "PHONE_CALL", "WEBSITE", "INSTAGRAM", "GOOGLE_BUSINESS", "FACEBOOK", "REFERENCE"];
  
  const bigWingModels = ["Activa", "Activa 125", "Dio", "Dio 125", "Shine 100", "Shine 125", "SP160", "Unicorn", "Livo"];
  const accessoriesModels = ["Activa 110", "Activa 125", "Dio", "Shine 100", "Shine (123 cc)", "SP 125", "Unicorn", "CB125", "Hornet", "SP 160"];
  const bigWingExecutives = ["Vinushree", "Chandana", "Jeevitha", "Murali", "Anusha", "Aadharsh", "Tejaswini", "Punith", "Babyrani"];
  const accessoriesExecutives = ["Amrutha", "Sangeetha"];
  
  const getVehicleModels = () => {
    return formData.enquiryType === "BIG_WING" ? bigWingModels : accessoriesModels;
  };
  
  const getExecutives = () => {
    return formData.enquiryType === "BIG_WING" ? bigWingExecutives : accessoriesExecutives;
  };

  const handleEnquiryTypeChange = (type) => {
    setFormData({ ...formData, enquiryType: type, vehicleModel: "", executiveName: "" });
    setCurrentStep(0);
  };

  const handleMobileSubmit = async () => {
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    
    try {
      const customer = await customerApi.getByMobile(formData.mobileNumber);
      if (customer) {
        setExistingCustomer(customer);
        setFormData({ ...formData, customerName: customer.name });
        toast.success(`Welcome back, ${customer.name}!`);
      } else {
        setExistingCustomer(null);
      }
      
      if (formData.enquiryType === 'BIG_WING') {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      if (formData.enquiryType === 'BIG_WING') {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await enquiryApi.create(formData);
      toast.success("Enquiry created successfully!");
      setCurrentView("enquiry_management");
    } catch (error) {
      toast.error("Failed to create enquiry");
      console.error("Error creating enquiry:", error);
    }
  };

  const handleLeadSourceChange = (source) => {
    setFormData(prev => ({
      ...prev,
      leadSources: prev.leadSources.includes(source)
        ? prev.leadSources.filter(s => s !== source)
        : [...prev.leadSources, source]
    }));
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-4">      
          <div>
            <label className="block text-sm font-medium mb-2">Enquiry Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {enquiryTypes.map((type, index) => {
                const colors = [
                  { bg: 'bg-blue-600', border: 'border-blue-600', hover: 'hover:bg-blue-50' },
                  { bg: 'bg-green-600', border: 'border-green-600', hover: 'hover:bg-green-50' },
                  { bg: 'bg-purple-600', border: 'border-purple-600', hover: 'hover:bg-purple-50' },
                  { bg: 'bg-orange-600', border: 'border-orange-600', hover: 'hover:bg-orange-50' }
                ];
                const color = colors[index];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleEnquiryTypeChange(type)}
                    className={`p-3 border rounded text-sm font-medium transition-colors ${
                      formData.enquiryType === type 
                        ? `${color.bg} text-white ${color.border}` 
                        : `${color.bg.replace('600', '100')} ${color.border} text-gray-700 ${color.hover}`
                    }`}
                  >
                    {type.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number *</label>
            <p className="text-sm text-gray-600 mb-2">Thank you, Sir/Madam. Could I have your mobile number?</p>
            <input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");
                if (numericValue.length <= 10) {
                  setFormData({ ...formData, mobileNumber: numericValue });
                }
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              maxLength="10"
              placeholder="Enter 10 digit mobile number"
              required
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
              onClick={handleMobileSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 2 && formData.enquiryType === 'BIG_WING') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold">Big Wing Enquiry Details</h3>
          
          {existingCustomer && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-green-700 text-sm">Welcome back! We found your details:</p>
              <p className="font-medium">{existingCustomer.name} - {formData.mobileNumber}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Customer Name {!existingCustomer && '*'}</label>
            <p className="text-sm text-gray-600 mb-2">{existingCustomer ? 'Confirm your name:' : 'Sure, May I know your name, please?'}</p>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
              required={!existingCustomer}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vehicle Model *</label>
            <p className="text-sm text-gray-600 mb-2">May I know the model you're interested in?</p>
            <select
              value={formData.vehicleModel}
              onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Vehicle Model</option>
              {getVehicleModels().map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lead Source</label>
            <p className="text-sm text-gray-600 mb-2">May I know how you came to know about Ananda Honda?</p>
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
            <p className="text-sm text-gray-600 mb-2">I am assigning our sales executive who will assist you.</p>
            <select
              value={formData.executiveName}
              onChange={(e) => setFormData({ ...formData, executiveName: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Executive</option>
              {getExecutives().map(executive => (
                <option key={executive} value={executive}>{executive}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit Enquiry
            </button>
          </div>
        </form>
      );
    }

    if (currentStep === 3 && ['ACCESSORIES', 'INSURANCE', 'HSRP'].includes(formData.enquiryType)) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold">Accessories, Insurance, HSRP</h3>
          
          {existingCustomer && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-green-700 text-sm">Welcome back! We found your details:</p>
              <p className="font-medium">{existingCustomer.name} - {formData.mobileNumber}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Customer Name {!existingCustomer && '*'}</label>
            <p className="text-sm text-gray-600 mb-2">{existingCustomer ? 'Confirm your name:' : 'Sure, May I know your name, please?'}</p>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
              required={!existingCustomer}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vehicle Model</label>
            <p className="text-sm text-gray-600 mb-2">May I know the model you're interested in?</p>
            <select
              value={formData.vehicleModel}
              onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vehicle Model</option>
              {getVehicleModels().map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lead Source</label>
            <p className="text-sm text-gray-600 mb-2">May I know how you came to know about Ananda Honda?</p>
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
            <p className="text-sm text-gray-600 mb-2">I am assigning our sales executive who will assist you.</p>
            <select
              value={formData.executiveName}
              onChange={(e) => setFormData({ ...formData, executiveName: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Executive</option>
              {getExecutives().map(executive => (
                <option key={executive} value={executive}>{executive}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit Enquiry
            </button>
          </div>
        </form>
      );
    }

    return null;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Enquiry</h1>
        <button
          onClick={() => setCurrentView("dashboard")}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-lg">New Enquiry</h3>
        <p className="text-gray-600">Welcome to Ananda Honda</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default VehicleEnquiryForm;