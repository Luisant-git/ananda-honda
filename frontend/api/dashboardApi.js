import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

export const dashboardApi = {
  getDashboardStats: async (fromDate, toDate) => {
    const response = await fetch(`${API_BASE_URL}/payment-collections/stats/dashboard?fromDate=${fromDate}&toDate=${toDate}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

   
    getServicesDashboardStats: async (fromDate, toDate, paymentType) => {
    let url = `${API_BASE_URL}/service-payment-collections/stats/dashboard?fromDate=${fromDate}&toDate=${toDate}`;
    if (paymentType) {
      url += `&paymentType=${encodeURIComponent(paymentType)}`;
    }
    const response = await fetch(url, { credentials: 'include'});
    if (!response.ok) {
      throw new Error('Failed to fetch services dashboard stats');
    }
    return response.json();
  },

  getBusinessDashboardStats: async (fromDate, toDate) => {
    const response = await fetch(
      `${API_BASE_URL}/service-payment-collections/stats/business-dashboard?fromDate=${fromDate}&toDate=${toDate}`, { credentials: 'include'});
    if (!response.ok) {
      throw new Error('Failed to fetch business dashboard stats');
    }
    return response.json();
  }
};
