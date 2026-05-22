// api/serviceTypeOfPartApi.js

import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/service-type-of-parts`;

// Helper function to ensure ID is number
const ensureNumericId = (id) => {
  return typeof id === 'string' ? parseInt(id, 10) : id;
};

// ✅ COMMON RESPONSE HANDLER
const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'API Error');
  }
  return res.json();
};

export const serviceTypeOfPartApi = {
  // ✅ GET ALL (WITH PAGINATION + SEARCH + STATUS FILTER)
  getAll: async ({ page = 1, limit = 10, search = '', status = '' } = {}) => {
    const params = new URLSearchParams();

    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      credentials: 'include',
    });

    return handleResponse(res);
  },

  // ✅ GET BY PART NO
  getByPartNo: async (partNo) => {
    const res = await fetch(`${API_URL}/by-part-no/${partNo}`, {
      credentials: 'include',
    });

    return handleResponse(res);
  },

  // ✅ GET ENABLED/AVAILABLE PARTS FOR DROPDOWN
  getEnabledParts: async ({ search = '' } = {}) => {
    const params = new URLSearchParams({ page: 1, limit: 999999 });
    if (search) params.append('search', search);

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      credentials: 'include',
    });

    const data = await handleResponse(res);
    return data.data || [];
  },

  // ✅ CREATE
  create: async (data) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        partNo: data.partNo,
        partDescription: data.partDescription,
        Model: data.Model,
        status: data.status,
        statusDate: data.statusDate,
      }),
    });

    return handleResponse(res);
  },

  // ✅ BULK CREATE
  bulkCreate: async (parts) => {
    const res = await fetch(`${API_URL}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parts }),
    });

    return handleResponse(res);
  },

  // ✅ UPDATE - FIXED: Ensure numeric ID
  update: async (id, data) => {
    const numericId = ensureNumericId(id);
    const res = await fetch(`${API_URL}/${numericId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        partNo: data.partNo,
        partDescription: data.partDescription,
        Model: data.Model,
      }),
    });

    return handleResponse(res);
  },

update: async (id, data) => {
  console.log('API update called with data:', data); // Debug log
  
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  const res = await fetch(`${API_URL}/${numericId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      partNo: data.partNo,
      partDescription: data.partDescription,
      Model: data.Model,
      status: data.status, // Make sure this is included
      statusDate: data.statusDate
    }),
  });

  return handleResponse(res);
},

  // ✅ DELETE - FIXED: Ensure numeric ID
  delete: async (id) => {
    const numericId = ensureNumericId(id);
    const res = await fetch(`${API_URL}/${numericId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    return handleResponse(res);
  },
};