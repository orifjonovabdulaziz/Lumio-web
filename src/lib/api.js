import axios from 'axios';
import { tokenStorage } from './storage.js';
import { API_BASE } from '../config/api.js';

// Re-export for back-compat — existing imports of `API_BASE_URL` still work.
export const API_BASE_URL = API_BASE;

const PUBLIC_PATHS = [
  '/auth/register/',
  '/auth/token/',
  '/auth/token/refresh/',
  '/auth/token/verify/',
];

function isPublic(url = '') {
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const url = config.url || '';
  if (!isPublic(url)) {
    const access = tokenStorage.getAccess();
    if (access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

let refreshPromise = null;
let onAuthFailure = null;

export function setAuthFailureHandler(fn) {
  onAuthFailure = fn;
}

export async function refreshAccess() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error('No refresh token');

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE}/auth/token/refresh/`,
        { refresh },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
      )
      .then((r) => {
        tokenStorage.setAccess(r.data.access);
        return r.data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error;
    if (!response || !config) throw error;
    if (response.status !== 401) throw error;
    if (config._retry) throw error;
    if (isPublic(config.url || '')) throw error;
    if (!tokenStorage.getRefresh()) {
      onAuthFailure?.();
      throw error;
    }

    try {
      const access = await refreshAccess();
      config._retry = true;
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
      return api(config);
    } catch (refreshErr) {
      tokenStorage.clear();
      onAuthFailure?.();
      throw error;
    }
  },
);
