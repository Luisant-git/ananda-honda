import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/enquiries`;

export const enquiryApi = {
  // Get all enquiries
  getAll: async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch enquiries');
    return response.json();
  },

  // Get enquiry by ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch enquiry');
    return response.json();
  },

  // Get enquiries by customer ID
  getByCustomer: async (customerId) => {
    const response = await fetch(`${API_URL}/customer/${customerId}`);
    if (!response.ok) throw new Error('Failed to fetch customer enquiries');
    return response.json();
  },

  // Create new enquiry
  create: async (enquiryData) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiryData)
    });
    if (!response.ok) throw new Error('Failed to create enquiry');
    return response.json();
  },

  // Update enquiry
  update: async (id, enquiryData) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiryData)
    });
    if (!response.ok) throw new Error('Failed to update enquiry');
    return response.json();
  },

  // Delete enquiry
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete enquiry');
    return response.json();
  }
};