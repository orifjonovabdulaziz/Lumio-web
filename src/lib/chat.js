// Chat REST helpers + payload normalizers.
//
// Live data (sending, receiving, read-receipts, room subscriptions) goes
// through chatHub — the single multiplexed WebSocket. REST is used only for
// loading history once on chat open and for the inbox bootstrap.
import { api } from './api.js';

// ─── REST ──────────────────────────────────────────────────────────────────

export async function listDmConversations({ signal } = {}) {
  const { data } = await api.get('/dm/conversations/', { signal });
  return unwrapList(data);
}

// History endpoint quirks (per backend spec):
//  * PageNumberPagination, page_size=20, ordered ASC by created_at — so
//    ?page=1 returns the OLDEST 20 messages, ?page=N (last page) returns the
//    newest. To show the latest history on chat open we need the LAST page.
//  * `?after_id=N` filters to messages with id > N. Still paginated, so a
//    long reconnect gap can spill across pages — we walk `next` until empty.

function messagesUrl(kind, key) {
  return kind === 'dm'
    ? `/dm/${encodeURIComponent(key)}/messages/`
    : `/rooms/${encodeURIComponent(key)}/messages/`;
}

async function fetchPage(url, params, signal) {
  const { data } = await api.get(url, {
    params: params && Object.keys(params).length ? params : undefined,
    signal,
  });
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null };
  }
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    count: typeof data?.count === 'number' ? data.count : 0,
    next: data?.next || null,
  };
}

// Initial history load — returns ~page_size most recent messages.
// Costs at most 3 GETs:
//   1. page=1 to learn count (and serve single-page chats outright)
//   2. last page (= ceil(count/pageSize))
//   3. previous page if the last page is partial (so we always show a full
//      window's worth of recent history, not e.g. a single message when
//      count = N*pageSize+1)
export async function listLatestMessages({ kind, key, signal }) {
  const url = messagesUrl(kind, key);
  const first = await fetchPage(url, {}, signal);
  if (!first.next) return first.results;
  const pageSize = first.results.length || 20;
  const lastPage = Math.max(2, Math.ceil(first.count / pageSize));
  if (lastPage === 2) {
    const last = await fetchPage(url, { page: 2 }, signal);
    return [...first.results, ...last.results];
  }
  const last = await fetchPage(url, { page: lastPage }, signal);
  if (last.results.length >= pageSize) return last.results;
  const prev = await fetchPage(url, { page: lastPage - 1 }, signal);
  return [...prev.results, ...last.results];
}

// Single most-recent message — for inbox previews when the parent listing
// endpoint doesn't include last_message metadata (currently the case for
// /rooms/, while /dm/conversations/ already has last_message inline).
// 1 GET for chats up to page_size; 2 GETs for longer ones.
export async function fetchLastMessage({ kind, key, signal }) {
  const url = messagesUrl(kind, key);
  const first = await fetchPage(url, {}, signal);
  if (!first.next) return first.results[first.results.length - 1] || null;
  const pageSize = first.results.length || 20;
  const lastPage = Math.max(2, Math.ceil(first.count / pageSize));
  const last = await fetchPage(url, { page: lastPage }, signal);
  if (last.results.length) return last.results[last.results.length - 1];
  return first.results[first.results.length - 1] || null;
}

// Reconnect catchup — pull every message with id > afterId, walking pagination
// until exhausted. Capped to keep a pathological gap from hammering the API.
export async function listMessagesAfter({ kind, key, afterId, signal }) {
  if (!afterId) return [];
  const url = messagesUrl(kind, key);
  const out = [];
  let page = 1;
  while (page <= 50) {
    const params = { after_id: afterId };
    if (page > 1) params.page = page;
    const res = await fetchPage(url, params, signal);
    out.push(...res.results);
    if (!res.next) break;
    page++;
  }
  return out;
}

// Per-room unread counts for inbox badges. Returns rows mapping room name
// to unread count — backend shape may be array or object, normalised below.
export async function listRoomsUnread({ signal } = {}) {
  const { data } = await api.get('/rooms/unread/', { signal });
  if (Array.isArray(data)) {
    const map = {};
    for (const row of data) {
      const name = row.room ?? row.name;
      if (name) map[name] = row.unread_count ?? row.unread ?? 0;
    }
    return map;
  }
  if (data && typeof data === 'object') return data;
  return {};
}

// Who has read a specific room message (for hover/expanded UI).
export async function listMessageReaders(roomName, messageId, { signal } = {}) {
  const { data } = await api.get(
    `/rooms/${encodeURIComponent(roomName)}/messages/${messageId}/reads/`,
    { signal },
  );
  return unwrapList(data);
}

// User search for starting a new DM — backend already excludes the current
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

// ─── Normalizers ───────────────────────────────────────────────────────────

// Backend message shape (room.message, dm.message, history rows):
//   {id, sender:{id,username,first_name,last_name}, content, created_at,
//    [room? recipient? read_at?], ...}
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
    recipientId: raw.recipient?.id,
    kind: 'text',
    text: raw.content || '',
    sentAt: new Date(raw.created_at || Date.now()).getTime(),
    // For my own DMs: read_at !== null means partner has read it → 'read'.
    // Plain delivered otherwise. Updated live by dm.read events.
    status: isMine
      ? (raw.read_at ? 'read' : 'delivered')
      : undefined,
  };
}

// Backend conversation shape:
//   { partner: {id,username,first_name,last_name}, last_message: "string",
//     last_message_at: "ISO", unread_count: number }
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
