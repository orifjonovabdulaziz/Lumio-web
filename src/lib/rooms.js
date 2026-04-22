import { api } from './api.js';

export async function listRooms({ page = 1, signal } = {}) {
  const { data } = await api.get('/rooms/', { params: { page }, signal });
  return data;
}

export async function getRoom(name, { signal } = {}) {
  const { data } = await api.get(`/rooms/${encodeURIComponent(name)}/`, { signal });
  return data;
}

export async function createRoom(payload) {
  const { data } = await api.post('/rooms/', payload);
  return data;
}

export async function updateRoom(name, patch) {
  const { data } = await api.patch(`/rooms/${encodeURIComponent(name)}/`, patch);
  return data;
}

export async function deleteRoom(name) {
  await api.delete(`/rooms/${encodeURIComponent(name)}/`);
}

export async function getRoster(name, { signal } = {}) {
  const { data } = await api.get(`/rooms/${encodeURIComponent(name)}/students/`, { signal });
  return data;
}

export async function addStudents(name, studentIds) {
  const { data } = await api.post(
    `/rooms/${encodeURIComponent(name)}/students/add/`,
    { student_ids: studentIds },
  );
  return data;
}

export async function removeStudent(name, studentId) {
  await api.delete(`/rooms/${encodeURIComponent(name)}/students/${studentId}/`);
}

export async function getLiveKitToken(name) {
  const { data } = await api.post(`/rooms/${encodeURIComponent(name)}/token/`, {});
  return data;
}
