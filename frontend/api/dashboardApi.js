import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

export const dashboardApi = {
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/payment-collections/stats/dashboard`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  }
};
