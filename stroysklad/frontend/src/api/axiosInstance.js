// Настроенный экземпляр Axios (соответствует листингу 3.5 диплома)
import axios from 'axios';

// VITE_API_URL может быть с /api или без — нормализуем
const raw = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const baseURL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;

const api = axios.create({ baseURL });

// Request interceptor — добавляет Authorization
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — на 401 чистим localStorage и редиректим на /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('full_name');
      localStorage.removeItem('username');
      // Не редиректим, если уже на /login (избегаем циклов)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
