// src/api/serviceTypeApi.js
import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-types`;

export const serviceTypeApi = {
  // GET ALL
  getAll: async () => {
    try {
      const res = await fetch(API_URL, { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch service types');
      const data = await res.json();
      console.log('Service types fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching service types:', error);
      return [];
    }
  },

  // GET BY ID
  getById: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch service type');
    return res.json();
  },

  // CREATE
  create: async (data) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create service type');
    return res.json();
  },

  // UPDATE
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update service type');
    return res.json();
  },

  // DELETE
  delete: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete service type');
    return res.json();
  },
};