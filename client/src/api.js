import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const TOKEN_KEY = 'stroysklad_token';
export const USER_KEY = 'stroysklad_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getToken()) {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

function extractApiError(error) {
  return error?.response?.data?.message || error?.message || 'Ошибка запроса к серверу';
}

function saveAuthSession({ token, user }) {
  setToken(token);
  setUser(user);
}

export async function login(loginValue, password) {
  try {
    const response = await api.post('/login', { login: loginValue, password });
    saveAuthSession(response.data);
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function register(loginValue, password) {
  try {
    const response = await api.post('/register', { login: loginValue, password });
    saveAuthSession(response.data);
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function fetchMe() {
  try {
    const response = await api.get('/me');
    setUser(response.data.user);
    return response.data.user;
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
