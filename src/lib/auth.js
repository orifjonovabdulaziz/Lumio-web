import React from 'react';
import { api, setAuthFailureHandler } from './api.js';
import { tokenStorage } from './storage.js';

const listeners = new Set();

const state = {
  user: tokenStorage.getUser(),
  access: tokenStorage.getAccess(),
  refresh: tokenStorage.getRefresh(),
  bootstrapping: !!tokenStorage.getRefresh() && !tokenStorage.getUser(),
};

function emit() {
  const snap = { ...state };
  listeners.forEach((fn) => fn(snap));
}

export function getAuth() {
  return { ...state };
}

export function useAuth() {
  const [s, setS] = React.useState(getAuth());
  React.useEffect(() => {
    const fn = (v) => setS(v);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return s;
}

function setTokens({ access, refresh }) {
  state.access = access;
  tokenStorage.setAccess(access);
  if (refresh !== undefined) {
    state.refresh = refresh;
    tokenStorage.setRefresh(refresh);
  }
  emit();
}

function setUser(user) {
  state.user = user;
  tokenStorage.setUser(user);
  emit();
}

function clearAuth() {
  state.user = null;
  state.access = null;
  state.refresh = null;
  tokenStorage.clear();
  emit();
}

export async function loadMe() {
  const { data } = await api.get('/auth/me/');
  setUser(data);
  return data;
}

export async function login({ username, password }) {
  const { data } = await api.post('/auth/token/', { username, password });
  setTokens({ access: data.access, refresh: data.refresh });
  await loadMe();
}

export async function register(payload) {
  await api.post('/auth/register/', payload);
  await login({ username: payload.username, password: payload.password });
}

export function logout() {
  clearAuth();
}

export async function updateMe(patch) {
  const { data } = await api.patch('/auth/me/', patch);
  setUser(data);
  return data;
}

export async function bootstrap() {
  if (!tokenStorage.getRefresh()) {
    if (state.bootstrapping) {
      state.bootstrapping = false;
      emit();
    }
    return;
  }
  try {
    await loadMe();
  } catch {
    clearAuth();
  } finally {
    if (state.bootstrapping) {
      state.bootstrapping = false;
      emit();
    }
  }
}

setAuthFailureHandler(() => {
  clearAuth();
  if (window.location.hash !== '#/sign-in') {
    window.location.hash = '/sign-in';
  }
});
