import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/menu-permission`;

export const menuPermissionApi = {
  get: async () => {
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch menu permissions');
    }
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_URL}/all`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch all menu permissions');
    }
    return response.json();
  },

  upsert: async (role, permissions) => {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role, permissions })
    });
    if (!response.ok) {
      throw new Error('Failed to update menu permissions');
    }
    return response.json();
  }
};
