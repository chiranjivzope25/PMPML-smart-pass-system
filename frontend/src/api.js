import axios from 'axios';

// In production on Vercel, requests to '/api' route directly to the serverless FastAPI backend.
// In local development, it connects to http://127.0.0.1:8000.
// Can also be explicitly overridden by setting VITE_API_URL environment variable.
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/api');

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
