import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/vehicle-models`;

export const vehicleModelApi = {
  getAll: async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch vehicle models');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch vehicle model');
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create vehicle model');
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update vehicle model');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete vehicle model');
    return response.json();
  },
};