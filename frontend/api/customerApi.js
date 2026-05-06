import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/customers`;

export const customerApi = {
  getAll: async () => {
    const response = await fetch(API_URL, { credentials: 'include' });
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { credentials: 'include' });
    return response.json();
  },

  getByMobile: async (mobile) => {
    const response = await fetch(`${API_URL}/mobile/${mobile}`, { credentials: 'include' });
    if (!response.ok) {
      return null;
    }
    return response.json();
  },

  searchByContact: async (contact) => {
    const response = await fetch(`${API_URL}/search/${encodeURIComponent(contact)}`, { credentials: 'include' });
    if (!response.ok) return { customers: [], salesInvoices: [] };
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Delete failed');
    }
    return response.json();
  },
  
  getDetails: async (id) => {
    const response = await fetch(`${API_URL}/${id}/details`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch customer details');
    return response.json();
  }
};