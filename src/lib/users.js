import { api } from './api.js';

export async function searchStudents({ q = '', page = 1, signal } = {}) {
  const { data } = await api.get('/users/students/', {
    params: { q: q || undefined, page },
    signal,
  });
  return data;
}
