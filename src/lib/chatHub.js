// chatHub — singleton multiplexed WebSocket for chat.
//
// One connection per logged-in user, opened once and held for the session.
// Routes RPC actions (subscribe/send/markRead) over the same socket as push
// events (room.message, dm.message, dm.read). The Django channel autosubscribes
// the personal user.<id> group on open, so DMs flow without explicit subscribe.
// Rooms must be subscribed via subscribe.room before their messages start.
//
// Lifecycle: caller wires connect()/disconnect() to auth bootstrap (see app.jsx).
import { API_BASE_URL, refreshAccess } from './api.js';
import { tokenStorage } from './storage.js';

function wsBase() {
  const httpBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return httpBase.replace(/^http/i, 'ws');
}

function buildUrl() {
  const token = tokenStorage.getAccess();
  return `${wsBase()}/ws/chat/?token=${encodeURIComponent(token || '')}`;
}

let idCounter = 0;
function nextReqId() {
  idCounter = (idCounter + 1) % 0xfffffff;
  return `r${idCounter}-${Date.now().toString(36)}`;
}

const ACK_TIMEOUT_MS = 10000;

class ChatHub {
  constructor() {
    this.ws = null;
    this.state = 'idle';      // idle | connecting | open | reconnecting | unauthorized | closed
    this.pending = new Map(); // reqId -> {resolve, reject, timer}
    this.subs = new Map();    // event -> Set<handler>
    this.rooms = new Set();   // subscribed room names — re-subscribed on reconnect
    this.attempts = 0;
    this.refreshTried = false;
    this.reconnectTimer = null;
    this.closedByUser = false;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  connect() {
    // Idempotent: skip if already connecting / open / queued for reconnect.
    // Without this, if connect() is called during the backoff window
    // (this.ws.readyState === CLOSED) we would open a *second* socket in
    // parallel with the scheduled reconnect — a known cause of zombie
    // entries in the user.<id> channel group on the backend.
    if (this.state === 'open' || this.state === 'connecting' || this.state === 'reconnecting') return;
    this.closedByUser = false;
    clearTimeout(this.reconnectTimer);
    this._open();
  }

  disconnect() {
    this.closedByUser = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      try { this.ws.close(1000); } catch {}
    }
    this.ws = null;
    this.rooms.clear();
    this._rejectAllPending(new Error('hub disconnected'));
    this._setState('closed');
  }

  // ── RPC actions ───────────────────────────────────────────────────────────
  subscribeRoom(name) {
    this.rooms.add(name);
    return this._request('subscribe.room', { topic: `room:${name}` });
  }

  unsubscribeRoom(name) {
    this.rooms.delete(name);
    return this._request('unsubscribe.room', { topic: `room:${name}` });
  }

  sendRoom(name, content) {
    return this._request('send.room', { topic: `room:${name}`, content });
  }

  sendDM(username, content) {
    return this._request('send.dm', { topic: `dm:${username}`, content });
  }

  markReadDM(username) {
    return this._request('mark_read.dm', { topic: `dm:${username}` });
  }

  // Bulk-mark room messages up to and including upToMessageId as read.
  // Idempotent — backend coalesces.
  markReadRoom(name, upToMessageId) {
    return this._request('mark_read.room', {
      topic: `room:${name}`,
      up_to_message_id: upToMessageId,
    });
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  // Returns an unsubscribe function. Events: room.message, dm.message, dm.read,
  // and meta events: state, connected, disconnected, unauthorized.
  on(event, handler) {
    if (!this.subs.has(event)) this.subs.set(event, new Set());
    this.subs.get(event).add(handler);
    return () => { this.subs.get(event)?.delete(handler); };
  }

  // ── Internals ─────────────────────────────────────────────────────────────
  _open() {
    // Defensive: kill any prior socket reference before creating a new one.
    // Otherwise a stale callback or an out-of-order reconnect could orphan a
    // still-OPEN socket — backend sees two connections from the same user.
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      try { this.ws.close(1000); } catch {}
    }
    this.ws = null;

    this._setState(this.attempts > 0 ? 'reconnecting' : 'connecting');
    let socket;
    try { socket = new WebSocket(buildUrl()); }
    catch { this._setState('reconnecting'); this._scheduleReconnect(); return; }

    this.ws = socket;
    socket.onopen = () => {
      this.attempts = 0;
      this.refreshTried = false;
      this._setState('open');
      this._emit('connected');
      // Re-subscribe to rooms we had before the disconnect.
      for (const room of this.rooms) {
        try {
          socket.send(JSON.stringify({
            id: nextReqId(), action: 'subscribe.room', topic: `room:${room}`,
          }));
        } catch {}
      }
    };
    socket.onmessage = (e) => this._onMessage(e.data);
    socket.onerror = () => { /* close will follow */ };
    socket.onclose = (e) => this._onClose(e);
  }

  async _onClose(e) {
    this._emit('disconnected', { code: e.code, reason: e.reason });
    this._rejectAllPending(new Error('socket closed'));

    if (this.closedByUser) { this._setState('closed'); return; }

    // Auth failure — try refresh once, then fall through to unauthorized.
    if (e.code === 4401) {
      if (this.refreshTried) {
        this._setState('unauthorized');
        this._emit('unauthorized');
        return;
      }
      this.refreshTried = true;
      this._setState('reconnecting');
      try { await refreshAccess(); }
      catch {
        this._setState('unauthorized');
        this._emit('unauthorized');
        return;
      }
      if (this.closedByUser) return;
      this._open();
      return;
    }

    // Any other close — exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max.
    this._scheduleReconnect();
  }

  _scheduleReconnect() {
    this.attempts++;
    const delay = Math.min(1000 * Math.pow(2, this.attempts - 1), 30000);
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.closedByUser) this._open();
    }, delay);
    this._setState('reconnecting');
  }

  _onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg?.type === 'ack') {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.ok) p.resolve(msg.data || {});
      else p.reject(Object.assign(new Error(msg.error || 'request failed'),
                                  { code: 'ack_error', detail: msg.error }));
    } else if (msg?.type === 'event' && msg.event) {
      this._emit(msg.event, msg.data);
    }
  }

  _request(action, body, timeoutMs = ACK_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      if (this.state !== 'open' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(Object.assign(new Error('not connected'), { code: 'not_connected' }));
        return;
      }
      const id = nextReqId();
      const payload = { id, action, ...body };
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(Object.assign(new Error('timeout'), { code: 'timeout' }));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  _rejectAllPending(err) {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      try { p.reject(err); } catch {}
    }
    this.pending.clear();
  }

  _setState(next) {
    if (this.state === next) return;
    this.state = next;
    this._emit('state', next);
  }

  _emit(event, ...args) {
    const set = this.subs.get(event);
    if (!set) return;
    for (const cb of set) {
      try { cb(...args); } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[chatHub] handler threw', err);
      }
    }
  }
}

export const chatHub = new ChatHub();

// Dev convenience — inspect from devtools console.
if (typeof window !== 'undefined') {
  window.__chatHub = chatHub;
}
