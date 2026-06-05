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
        serviceType: jobCard.serviceType || null,
        status: jobCard.status === 'Closed' ? 'Pending' : jobCard.status
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

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(jobCard => ({
        ...jobCard,
        status: jobCard.status === 'Closed' ? 'Pending' : jobCard.status
      }));
    } else if (data && data.status === 'Closed') {
      data.status = 'Pending';
    }
    return data;
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

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(jobCard => ({
        ...jobCard,
        status: jobCard.status === 'Closed' ? 'Pending' : jobCard.status
      }));
    } else if (data && Array.isArray(data.data)) {
      data.data = data.data.map(jobCard => ({
        ...jobCard,
        status: jobCard.status === 'Closed' ? 'Pending' : jobCard.status
      }));
    }
    return data;
  },

  getOne: async (id) => {
    const response = await fetch(`${API_URL}/${id}?include=serviceType`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service job card');
    }

    const data = await response.json();
    if (data && data.status === 'Closed') {
      data.status = 'Pending';
    }
    return data;
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

  getActiveJobCards: async (search = '') => {
    let url = `${API_URL}/active`;
    if (search) url += `?search=${encodeURIComponent(search)}`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(jobCard => ({
        ...jobCard,
        status: jobCard.status === 'Closed' ? 'Pending' : jobCard.status
      }));
    }
    return data;
  },
};