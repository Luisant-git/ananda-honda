// api/serviceReminderApi.js
import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-reminders`;

export const serviceReminderApi = {
  // Single GET endpoint with query params
// api/serviceReminderApi.js
getAll: async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.serviceType) params.append('serviceType', filters.serviceType);
  if (filters.invoiceId) params.append('invoiceId', filters.invoiceId);
  
  const url = params.toString() ? `${API_URL}?${params}` : API_URL;
  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json();
  // Always return an array
  return Array.isArray(data) ? data : [];
},

  // Get by ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch reminder');
    return response.json();
  },

  // Get summary
  getSummary: async () => {
    const response = await fetch(`${API_URL}/summary`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch summary');
    return response.json();
  },

  // Trigger reminders manually
  trigger: async () => {
    const response = await fetch(`${API_URL}/trigger`, { method: 'POST', credentials: 'include' });
    if (!response.ok) throw new Error('Failed to trigger reminders');
    return response.json();
  },

  // Resend a failed reminder
  resend: async (id) => {
    const response = await fetch(`${API_URL}/${id}/resend`, { method: 'POST', credentials: 'include' });
    if (!response.ok) throw new Error('Failed to resend reminder');
    return response.json();
  },

  // Update reminder status
  updateStatus: async (id, status, errorMessage) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, errorMessage })
    });
    if (!response.ok) throw new Error('Failed to update reminder status');
    return response.json();
  },

  // Delete a reminder
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!response.ok) throw new Error('Failed to delete reminder');
    return response.json();
  }
};