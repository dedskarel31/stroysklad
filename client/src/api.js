const API_BASE = 'http://localhost:3001/api';

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

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Ошибка запроса к серверу');
  }
  return data;
}

export function login(loginValue, password) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginValue, password }),
  });
}

export function fetchStock() {
  return request('/stock');
}

export function fetchMaterials() {
  return request('/materials');
}

export function createOperation(payload) {
  return request('/operations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
