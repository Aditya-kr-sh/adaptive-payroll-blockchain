import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor for Multi-Tenancy
api.interceptors.request.use(
  (config) => {
    const domain = localStorage.getItem('orgDomain');
    if (domain) {
      config.headers['X-Org-Domain'] = domain;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
