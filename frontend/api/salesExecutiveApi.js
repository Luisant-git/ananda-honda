// api/vehicleCatalogueApi.js (or a separate api/salesExecutiveApi.js)

export const salesExecutiveApi = {
  // Get all sales executives
  // Pass includeInactive=true to get inactive executives as well
  getSalesExecutives: async (includeInactive = false) => {
    const url = `https://crm.api.anandahonda.cloud/api/v1/lookups/sales-executives?includeInactive=${includeInactive}`;
    const response = await fetch(url, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch sales executives');
    return response.json();
  },

  // get branches
  getBranches: async (includeInactive = false) => {
    const url = `https://crm.api.anandahonda.cloud/api/v1/lookups/referred-branches?includeInactive=${includeInactive}`;
    const response = await fetch(url, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch branches');
    return response.json();
  },
};


