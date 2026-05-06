import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/sales-invoices`;

export const salesInvoiceApi = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/upload`, {
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

  getAll: async (search = '') => {
    const url = search ? `${API_URL}?search=${encodeURIComponent(search)}` : API_URL;
    const response = await fetch(url, { credentials: 'include' });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },

  clearAll: async () => {
    const response = await fetch(`${API_URL}/clear`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },
};
