import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/executives`;

export const executiveApi = {
  // Get all executives
  getAll: async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch executives');
    return response.json();
  },

  // Get executive by ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch executive');
    return response.json();
  },

  // Create new executive
  create: async (executiveData) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(executiveData)
    });
    if (!response.ok) throw new Error('Failed to create executive');
    return response.json();
  },

  // Update executive
  update: async (id, executiveData) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(executiveData)
    });
    if (!response.ok) throw new Error('Failed to update executive');
    return response.json();
  },

  // Delete executive
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete executive');
    return response.json();
  }
};