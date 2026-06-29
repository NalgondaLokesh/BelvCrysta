export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  SIGNUP: `${API_BASE_URL}/auth/signup`,
  
  // Crystal endpoints
  GENERATE: `${API_BASE_URL}/generate`,
  ELEMENTS: `${API_BASE_URL}/elements`,
  HISTORY: `${API_BASE_URL}/history`,
  SAVE: `${API_BASE_URL}/save`,
  DELETE: `${API_BASE_URL}/delete`,
};
