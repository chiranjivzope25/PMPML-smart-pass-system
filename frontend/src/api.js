import axios from 'axios';

// Uses relative '/api' in dev (forwarded by Vite proxy) and in production on Vercel.
// Custom VITE_API_URL can be provided to override.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
