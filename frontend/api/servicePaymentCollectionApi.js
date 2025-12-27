import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-payment-collections`;

export const servicePaymentCollectionApi = {
  getAll: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, { credentials: 'include' });
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

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  delete: async (id, deletedBy) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ deletedBy })
    });
    return response.json();
  },

  restore: async (id) => {
    const response = await fetch(`${API_URL}/${id}/restore`, {
      method: 'PATCH',
      credentials: 'include'
    });
    return response.json();
  },

  getDeleted: async () => {
    const response = await fetch(`${API_URL}/deleted/all`, { credentials: 'include' });
    return response.json();
  }
};