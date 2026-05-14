// api/serviceTypeOfPartApi.js

import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-type-of-parts`;

export const serviceTypeOfPartApi = {
  // Get all service parts
  getAll: async () => {
    const response = await fetch(API_URL, { 
      credentials: 'include' 
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch service parts');
    }
    return response.json();
  },

  // Get enabled parts only
  getEnabledParts: async () => {
    const response = await fetch(`${API_URL}/enabled`, { 
      credentials: 'include' 
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch enabled parts');
    }
    return response.json();
  },

  // Get a single service part by ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { 
      credentials: 'include' 
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch service part');
    }
    return response.json();
  },

  // Create a new service part
  create: async (data) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        partNo: data.partNo,
        partDescription: data.partDescription,
        status: data.status
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create service part');
    }
    return response.json();
  },

  // Update a service part
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        partNo: data.partNo,
        partDescription: data.partDescription,
        status: data.status
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service part');
    }
    return response.json();
  },

  // Delete a service part
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete service part');
    }
    return response.json();
  },

  // Bulk create service parts
  bulkCreate: async (parts) => {
    const response = await fetch(`${API_URL}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parts })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bulk create service parts');
    }
    return response.json();
  },

  // Get parts by status
  getPartsByStatus: async (status) => {
    const response = await fetch(`${API_URL}/by-status?status=${status}`, { 
      credentials: 'include' 
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch parts by status');
    }
    return response.json();
  },

  // Get part by part number
  getByPartNo: async (partNo) => {
    const response = await fetch(`${API_URL}/by-part-no/${partNo}`, { 
      credentials: 'include' 
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch part by number');
    }
    return response.json();
  }
};