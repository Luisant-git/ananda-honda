import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-type-of-collection`;

export const serviceTypeOfCollectionApi = {
  getAll: async () => {
    const response = await fetch(API_URL, { credentials: 'include' });
    return response.json();
  },

  create: async (data) => {
    // data: { typeOfCollect: string; status: string; disableVehicleModel?: boolean }
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { credentials: 'include' });
    return response.json();
  },

  update: async (id, data) => {
    // data: { typeOfCollect?: string; status?: string; disableVehicleModel?: boolean }
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      // your Nest controller currently throws new Error('Server error')
      // which will likely be returned as plain text, so handle both JSON and text
      let message = 'Delete failed';
      try {
        const errorData = await response.json();
        message = errorData.message || message;
      } catch {
        const text = await response.text();
        if (text) message = text;
      }
      throw new Error(message);
    }

    return response.json();
  },
};