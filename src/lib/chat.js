// Chat REST + WebSocket client.
// Auth: existing Django access JWT (Bearer for REST, ?token=<access> for WS).
import { api, API_BASE_URL, refreshAccess } from './api.js';
import { tokenStorage } from './storage.js';

// ─── REST ──────────────────────────────────────────────────────────────────

export async function listDmConversations({ signal } = {}) {
  const { data } = await api.get('/dm/conversations/', { signal });
  return unwrapList(data);
}

export async function listDmMessages(username, { signal, page } = {}) {
  const { data } = await api.get(
    `/dm/${encodeURIComponent(username)}/messages/`,
    { params: page ? { page } : undefined, signal },
  );
  return unwrapList(data);
}

export async function listRoomMessages(roomName, { signal, page } = {}) {
  const { data } = await api.get(
    `/rooms/${encodeURIComponent(roomName)}/messages/`,
    { params: page ? { page } : undefined, signal },
  );
  return unwrapList(data);
}

// User search for starting a new DM. Backend already excludes the current
// user. Used inline in the chat-list search input.
export async function searchUsers(query, { signal } = {}) {
  const { data } = await api.get('/users/search/', { params: { q: query }, signal });
  return unwrapList(data);
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// ─── WS ────────────────────────────────────────────────────────────────────

function wsBase() {
  const httpBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return httpBase.replace(/^http/i, 'ws');
}

function chatSocketUrl({ kind, key }) {
  const token = tokenStorage.getAccess();
  const segment = kind === 'dm'
    ? `dm/${encodeURIComponent(key)}`
    : `room/${encodeURIComponent(key)}`;
  return `${wsBase()}/ws/chat/${segment}/?token=${encodeURIComponent(token || '')}`;
}

// Returns a controller: { send, close, state, onMessage, onState, onError, onUnauthorized }.
// - On close 4401: tries refreshAccess() once, reconnects with new token. If
//   refresh fails (or 4401 again), state goes to 'unauthorized' and the
//   onUnauthorized handler fires — caller should clear auth and redirect.
// - On close 4403: state goes to 'forbidden' permanently (no retry).
// - Other closes: exponential backoff 1s/2s/4s/8s/16s/30s max.
export function openChatSocket({ kind, key }) {
  const listeners = {
    message: new Set(),
    state: new Set(),
    error: new Set(),
    unauthorized: new Set(),
  };
  let ws = null;
  let closedByUser = false;
  let attempts = 0;
  let refreshTried = false;
  let reconnectTimer = null;
  let state = 'connecting';

  function setState(next) {
    if (state === next) return;
    state = next;
    listeners.state.forEach((cb) => { try { cb(next); } catch {} });
  }

  function connect() {
    setState(attempts > 0 ? 'reconnecting' : 'connecting');
    let socket;
    try {
      // URL is rebuilt each attempt so refreshed tokens get picked up.
      socket = new WebSocket(chatSocketUrl({ kind, key }));
    } catch {
      setState('error');
      return;
    }
    ws = socket;

    socket.onopen = () => {
      attempts = 0;
      refreshTried = false;
      setState('open');
    };

    socket.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      // Server-side errors (e.g. empty content) come through the open socket.
      if (data?.type === 'error') {
        const detail = data.detail || 'Ошибка';
        listeners.error.forEach((cb) => { try { cb(detail); } catch {} });
        return;
      }
      listeners.message.forEach((cb) => { try { cb(data); } catch {} });
    };

    socket.onerror = () => { /* close will follow */ };

    socket.onclose = async (e) => {
      if (closedByUser) { setState('closed'); return; }

      if (e.code === 4403) {
        setState('forbidden');
        return;
      }

      if (e.code === 4404) {
        // Username doesn't exist or it's the current user — no point retrying.
        setState('not_found');
        return;
      }

      if (e.code === 4401) {
        if (refreshTried) {
          setState('unauthorized');
          listeners.unauthorized.forEach((cb) => { try { cb(); } catch {} });
          return;
        }
        refreshTried = true;
        setState('reconnecting');
        try {
          await refreshAccess();
        } catch {
          setState('unauthorized');
          listeners.unauthorized.forEach((cb) => { try { cb(); } catch {} });
          return;
        }
        if (closedByUser) return;
        connect();
        return;
      }

      attempts++;
      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => { if (!closedByUser) connect(); }, delay);
      setState('reconnecting');
    };
  }

  connect();

  return {
    send(content) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ content }));
        return true;
      }
      return false;
    },
    close() {
      closedByUser = true;
      clearTimeout(reconnectTimer);
      if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
    },
    get state() { return state; },
    onMessage(cb)      { listeners.message.add(cb);      return () => listeners.message.delete(cb); },
    onState(cb)        { listeners.state.add(cb);        return () => listeners.state.delete(cb); },
    onError(cb)        { listeners.error.add(cb);        return () => listeners.error.delete(cb); },
    onUnauthorized(cb) { listeners.unauthorized.add(cb); return () => listeners.unauthorized.delete(cb); },
  };
}

// ─── Normalizers ───────────────────────────────────────────────────────────

// Backend (room WS):  {type:"message", id, room, sender:{...}, content, created_at}
// Backend (DM WS):    {type:"dm",      id, sender:{...}, recipient:{...}, content, created_at}
// Backend (history):  same shape minus `type`.
export function normalizeMessage(raw, { meId }) {
  const senderId = raw.sender?.id;
  const isMine = meId != null && senderId === meId;
  const fn = raw.sender?.first_name || '';
  const ln = raw.sender?.last_name || '';
  const fullName = `${fn} ${ln}`.trim();
  return {
    id: raw.id != null ? `srv-${raw.id}` : `srv-${Date.now()}-${Math.random()}`,
    serverId: raw.id,
    authorId: isMine ? 'me' : `u${senderId}`,
    authorName: fullName || raw.sender?.username || '',
    authorUsername: raw.sender?.username,
    kind: 'text',
    text: raw.content || '',
    sentAt: new Date(raw.created_at || Date.now()).getTime(),
    status: isMine ? 'delivered' : undefined,
  };
}

// Backend response shape per integration spec:
//   { partner: {id,username,first_name,last_name},
//     last_message: "string",
//     last_message_at: "ISO",
//     unread_count: number }
export function normalizeConversation(raw) {
  const u = raw.partner || raw.user || raw.peer || {};
  const fn = u.first_name || '';
  const ln = u.last_name || '';
  const name = `${fn} ${ln}`.trim() || u.username || '?';
  const lastMessage = typeof raw.last_message === 'string'
    ? raw.last_message
    : (raw.last_message?.content || '');
  const lastAt = raw.last_message_at
    || raw.last_message?.created_at
    || null;
  return {
    id: `dm:${u.username}`,
    kind: 'direct',
    backendKind: 'dm',
    backendKey: u.username,
    peer: u,
    name,
    unread: raw.unread_count || 0,
    preview: lastMessage,
    previewTime: lastAt ? new Date(lastAt).getTime() : 0,
    previewSelf: false,
  };
}

export function normalizeRoom(raw) {
  return {
    id: `room:${raw.name}`,
    kind: 'group',
    backendKind: 'room',
    backendKey: raw.name,
    room: raw,
    name: raw.title || raw.name,
    unread: raw.unread_count || 0,
    preview: typeof raw.last_message === 'string'
      ? raw.last_message
      : (raw.last_message?.content || ''),
    previewTime: raw.last_message_at
      ? new Date(raw.last_message_at).getTime()
      : (raw.last_message?.created_at
          ? new Date(raw.last_message.created_at).getTime()
          : 0),
    previewSelf: false,
    members: (raw.students_count ?? raw.member_count ?? 0) + 1,
  };
}
