import axios from 'axios';

function normalizeApiBase(raw) {
  const base = (raw || 'http://localhost:3001').trim().replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('full_name');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function getApiError(error) {
  return error?.response?.data?.error || error?.message || 'Ошибка запроса';
}

export function getTokenUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? null;
  } catch {
    return null;
  }
}

export default api;
