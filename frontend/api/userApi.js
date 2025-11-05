import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/users`;

export const userApi = {
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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Create failed');
    }
    return response.json();
  },

  toggleActive: async (id) => {
    const response = await fetch(`${API_URL}/${id}/toggle-active`, {
      method: 'PATCH',
      credentials: 'include'
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Toggle failed');
    }
    return response.json();
  }
};
