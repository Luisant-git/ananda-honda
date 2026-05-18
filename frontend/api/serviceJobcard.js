// src/api/serviceJobcard.js
import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-job-card`;

export const serviceJobCardApi = {
  create: async (data) => {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create service job card');
    }

    return response.json();
  },

  getAll: async (search = '', includeServiceType = true) => {
    const params = new URLSearchParams();
    
    if (search) {
      params.append('search', search);
    }
    
    if (includeServiceType) {
      params.append('include', 'serviceType');
    }
    
    const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service job cards');
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(jobCard => ({
        ...jobCard,
        serviceType: jobCard.serviceType || null
      }));
    }
    
    return data;
  },

  getByMobileNumber: async (mobileNumber, includeServiceType = true) => {
    const params = new URLSearchParams();
    
    if (includeServiceType) {
      params.append('include', 'serviceType');
    }
    
    const url = params.toString() 
      ? `${API_URL}/by-mobile/${mobileNumber}?${params.toString()}`
      : `${API_URL}/by-mobile/${mobileNumber}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service job card by mobile number');
    }

    return response.json();
  },

  search: async (searchTerm, includeServiceType = true) => {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    
    if (includeServiceType) {
      params.append('include', 'serviceType');
    }
    
    const response = await fetch(`${API_URL}/search?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to search service job cards');
    }

    return response.json();
  },

  getOne: async (id) => {
    const response = await fetch(`${API_URL}/${id}?include=serviceType`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service job card');
    }

    return response.json();
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service job card status');
    }

    return response.json();
  },

  upload: async (file, type = 'REVENUE') => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload?type=${type}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete service job card');
    }

    return response.json();
  },

  clearAll: async () => {
    const response = await fetch(`${API_URL}/clear`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to clear service job cards');
    }

    return response.json();
  },
};