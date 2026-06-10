import config from "../config";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const pineLabsApi = {
  initiate: async (data) => {
    const response = await fetch(`${config.API_BASE_URL}/pine-labs/initiate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw err || new Error("Failed to initiate");
    }
    return response.json();
  },

  checkStatus: async (transactionId) => {
    const response = await fetch(`${config.API_BASE_URL}/pine-labs/status/${transactionId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw err || new Error("Failed to check status");
    }
    return response.json();
  },

  cancel: async (transactionId) => {
    const response = await fetch(`${config.API_BASE_URL}/pine-labs/cancel/${transactionId}`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw err || new Error("Failed to cancel");
    }
    return response.json();
  },
};
