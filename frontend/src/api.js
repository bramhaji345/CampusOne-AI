import axios from 'axios';

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/$/, '');
  }

  if (import.meta.env.PROD) {
    console.warn(
      '[CampusOne-AI] NOTICE: VITE_API_URL is not set. Defaulting to relative "/api". ' +
      'If your backend is hosted separately, configure VITE_API_URL in your hosting environment variables.'
    );
    return '/api';
  }

  return 'http://127.0.0.1:5000/api';
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user_profile');
      sessionStorage.removeItem('user_profile');
    }
    return Promise.reject(err);
  }
);

export default api;
