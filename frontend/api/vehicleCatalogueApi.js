// api/vehicleCatalogueApi.js

export const vehicleCatalogueApi = {
  // ─── Vehicle Models ───────────────────────────────────────────
// In vehicleCatalogueApi.js, add console logs
getVehicleModels: async () => {
  console.log("Fetching vehicle models...");
  const response = await fetch(`https://crm.api.anandahonda.cloud/api/v1/lookups/vehicle-models`, {
    credentials: 'include'
  });
  console.log("Models response status:", response.status);
  if (!response.ok) throw new Error('Failed to fetch vehicle models');
  const data = await response.json();
  console.log("Models data:", data);
  return data;
},

  // ─── Vehicle Variants ─────────────────────────────────────────
  // Get all variants (without model filter)
  getAllVehicleVariants: async () => {
    const response = await fetch(`https://crm.api.anandahonda.cloud/api/v1/lookups/vehicle-variants`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch all vehicle variants');
    return response.json();
  },

  // Get variants by specific model ID
  getVehicleVariantsByModel: async (modelId) => {
    const response = await fetch(`https://crm.api.anandahonda.cloud/api/v1/lookups/vehicle-variants?modelId=${modelId}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch vehicle variants for model');
    return response.json();
  },

  // ─── Vehicle Colours ──────────────────────────────────────────
  getVehicleColours: async () => {
    const response = await fetch(`https://crm.api.anandahonda.cloud/api/v1/lookups/vehicle-colours`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch vehicle colours');
    return response.json();
  },

  // ─── Sales Executives ─────────────────────────────────────────
  getSalesExecutives: async () => {
    const response = await fetch(`https://crm.api.anandahonda.cloud/api/v1/lookups/sales-executives`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch sales executives');
    return response.json();
  }
};