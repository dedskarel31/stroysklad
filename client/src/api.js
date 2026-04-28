import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const TOKEN_KEY = 'stroysklad_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматически добавляем JWT ко всем запросам, если пользователь авторизован.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractApiError(error) {
  return error?.response?.data?.message || error?.message || 'Ошибка запроса к серверу';
}

export async function login(loginValue, password) {
  try {
    const response = await api.post('/login', { login: loginValue, password });
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function fetchStock() {
  try {
    const response = await api.get('/stock');
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function fetchMaterials() {
  try {
    const response = await api.get('/materials');
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function createOperation(payload) {
  try {
    const response = await api.post('/operations', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export { api, API_BASE };
