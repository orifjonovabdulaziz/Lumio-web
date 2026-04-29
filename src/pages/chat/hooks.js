// Data hooks built on top of chatHub (multiplexed WS) + REST history.
//
// Per integration spec: NO optimistic UI. Messages are appended only when
// they arrive via WS — server broadcasts to the sender too. Hub auto-injects
// DMs into user.<id> group on connect, so DMs flow without subscribe; rooms
// must be subscribed to receive their messages.
import React from 'react';
import { listRooms } from '../../lib/rooms.js';
import {
  listDmConversations, listLatestMessages, listMessagesAfter, listRoomsUnread,
  fetchLastMessage, searchUsers,
  normalizeMessage, normalizeConversation, normalizeRoom,
} from '../../lib/chat.js';
import { chatHub } from '../../lib/chatHub.js';

// ─── Hub state subscription ────────────────────────────────────────────────
export function useHubState() {
  const [state, setState] = React.useState(chatHub.state);
  React.useEffect(() => {
    setState(chatHub.state);
    return chatHub.on('state', setState);
  }, []);
  return state;
}

// ─── navigator.onLine ──────────────────────────────────────────────────────
export function useOnline() {
  const [online, setOnline] = React.useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine);
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

// ─── Debounced user search (for inline new-DM lookup in chat list) ────────
export function useUserSearch(query, { minLength = 2 } = {}) {
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const q = (query || '').trim();
    if (q.length < minLength) {
      setResults([]); setLoading(false); setError(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const rows = await searchUsers(q, { signal: ctrl.signal });
        setResults(rows);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setError(e); setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [query, minLength]);

  return { results, loading, error };
}

// ─── Inbox: conversations + rooms list, kept live by dm.message events ───
//
// `prefetchPreviews` controls whether we fetch each room's last message in
// the background to fill in `preview`/`previewTime` (see useEffect below).
// Inbox UIs (popover, chat page) want it true. Surface-level consumers
// that only need unread counts (e.g. dashboard badge) pass false to skip
// the per-room GETs.
export function useChats({ enabled, meId, prefetchPreviews = true }) {
  const [chats, setChats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const refresh = React.useCallback(async (opts = {}) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const [dms, rooms, roomUnreads] = await Promise.all([
        listDmConversations().catch(() => []),
        listRooms().then((r) => Array.isArray(r) ? r : (r?.results || [])).catch(() => []),
        listRoomsUnread().catch(() => ({})),
      ]);
      const dmChats = dms.map(normalizeConversation);
      const roomChats = rooms.map(normalizeRoom).map((c) => ({
        ...c,
        unread: roomUnreads[c.backendKey] ?? c.unread ?? 0,
      }));
      const merged = [...dmChats, ...roomChats].sort((a, b) => b.previewTime - a.previewTime);
      setChats((prev) => {
        // Preserve any locally-upserted ephemeral chats (new DMs started via
        // user search before they have a server-side conversation entry).
        const seen = new Set(merged.map((c) => c.id));
        const ephemeral = prev.filter((c) => c.ephemeral && !seen.has(c.id));
        return [...merged, ...ephemeral];
      });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // REST is called ONCE per mount. Live updates flow via WS events below;
  // the inbox does not re-fetch on focus/online/reconnect.
  React.useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

  // ── Eager room subscription + preview prefetch ───────────────────────────
  // Two reasons we need this for every known room:
  //   1. room.message events only flow for subscribed rooms — without an
  //      eager subscribe the inbox preview/unread of rooms the user hasn't
  //      opened never refreshes.
  //   2. Backend's /rooms/ listing doesn't include last_message, so on
  //      initial render rooms have empty previews. We fetch the latest
  //      message per room in the background and patch it in.
  // chatHub.subscribeRoom is idempotent (chatHub.rooms is a Set) and chatHub
  // auto-resubscribes the whole set on reconnect, so calling it on every
  // chats change is cheap. Preview prefetch is gated by a ref so we don't
  // refire for the same room.
  const previewFetched = React.useRef(new Set());
  React.useEffect(() => {
    if (!enabled) {
      previewFetched.current.clear();
      return;
    }
    const ctrl = new AbortController();
    for (const c of chats) {
      if (c.backendKind !== 'room' || !c.backendKey) continue;
      if (!chatHub.rooms.has(c.backendKey)) {
        chatHub.subscribeRoom(c.backendKey).catch(() => {});
      }
      if (!prefetchPreviews) continue;                         // caller doesn't need previews
      if (c.previewTime > 0) continue;                         // backend or WS already filled it
      if (previewFetched.current.has(c.backendKey)) continue;  // attempted this session
      previewFetched.current.add(c.backendKey);
      fetchLastMessage({ kind: 'room', key: c.backendKey, signal: ctrl.signal })
        .then((msg) => {
          if (!msg || ctrl.signal.aborted) return;
          const time = new Date(msg.created_at || Date.now()).getTime();
          const isMine = meId != null && msg.sender?.id === meId;
          setChats((prev) => prev
            .map((x) => {
              if (x.id !== `room:${c.backendKey}`) return x;
              if (x.previewTime >= time) return x;             // a fresher WS push won the race
              return {
                ...x,
                preview: msg.content || '',
                previewTime: time,
                previewSelf: isMine,
              };
            })
            .sort((a, b) => b.previewTime - a.previewTime));
        })
        .catch(() => {});
    }
    return () => ctrl.abort();
  }, [chats, enabled, meId, prefetchPreviews]);

  // ── Live DM updates ──────────────────────────────────────────────────────
  // dm.message: bump preview, increment unread (unless mine).
  // dm.read: when partner reads my messages, no inbox badge to clear (their
  // unread, not mine). Skipped — we only refresh on dm.message.
  // Recovery on hub reconnect: refresh once to catch anything missed.
  React.useEffect(() => {
    if (!enabled) return;
    const offDm = chatHub.on('dm.message', (data) => {
      if (!data?.sender || !data?.recipient) return;
      const isMine = meId != null && data.sender.id === meId;
      const partner = isMine ? data.recipient : data.sender;
      if (!partner?.username) return;
      const id = `dm:${partner.username}`;
      const time = new Date(data.created_at || Date.now()).getTime();
      const text = data.content || '';

      setChats((prev) => {
        const existing = prev.find((c) => c.id === id);
        if (existing) {
          return prev
            .map((c) => c.id === id
              ? {
                  ...c,
                  preview: text,
                  previewTime: time,
                  previewSelf: isMine,
                  // Drop ephemeral flag once the server knows about this chat.
                  ephemeral: false,
                  // Don't bump unread for my own outgoing echo.
                  unread: isMine ? c.unread : (c.unread || 0) + 1,
                }
              : c)
            .sort((a, b) => b.previewTime - a.previewTime);
        }
        // New conversation — synthesise a minimal entry so the chat appears
        // immediately. The next /dm/conversations/ refresh will replace it.
        const fn = partner.first_name || '';
        const ln = partner.last_name || '';
        const name = `${fn} ${ln}`.trim() || partner.username || '?';
        return [
          {
            id, kind: 'direct', backendKind: 'dm', backendKey: partner.username,
            peer: partner, name,
            unread: isMine ? 0 : 1,
            preview: text,
            previewTime: time,
            previewSelf: isMine,
          },
          ...prev,
        ];
      });
    });

    // Room messages: only flow for rooms we've subscribed to (i.e. that the
    // user has opened in this session). Update preview/unread for those.
    const offRoom = chatHub.on('room.message', (data) => {
      if (!data?.room || !data?.sender) return;
      const id = `room:${data.room}`;
      const isMine = meId != null && data.sender.id === meId;
      const time = new Date(data.created_at || Date.now()).getTime();
      const text = data.content || '';
      setChats((prev) => prev
        .map((c) => c.id === id
          ? {
              ...c,
              preview: text,
              previewTime: time,
              previewSelf: isMine,
              unread: isMine ? c.unread : (c.unread || 0) + 1,
            }
          : c)
        .sort((a, b) => b.previewTime - a.previewTime));
    });

    // room.read from myself on another tab → clear unread for that room.
    // From other users — unread isn't ours to clear.
    const offRoomRead = chatHub.on('room.read', (data) => {
      if (!data?.room) return;
      const byMe = meId != null && data.by_user?.id === meId;
      if (!byMe) return;
      setChats((s) => s.map((c) =>
        c.id === `room:${data.room}` ? { ...c, unread: 0 } : c));
    });

    return () => { offDm(); offRoom(); offRoomRead(); };
  }, [enabled, meId, refresh]);

  const setChatField = React.useCallback((id, patch) => {
    setChats((s) => s.map((c) => c.id === id ? { ...c, ...patch } : c));
  }, []);

  // For ephemeral DMs started via user search before they exist server-side.
  const upsertChat = React.useCallback((chat) => {
    setChats((s) => {
      if (s.some((c) => c.id === chat.id)) return s;
      return [{ ...chat, ephemeral: true }, ...s];
    });
  }, []);

  return { chats, loading, error, refresh, setChatField, upsertChat };
}

// ─── Per-chat thread (history + live events via hub) ──────────────────────
export function useChatThread({ chat, meId, online, onSendError }) {
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [pendingSends, setPendingSends] = React.useState(0);
  const meIdRef = React.useRef(meId);
  meIdRef.current = meId;
  const onSendErrorRef = React.useRef(onSendError);
  onSendErrorRef.current = onSendError;

  const hubState = useHubState();
  const isConnected = hubState === 'open';

  const key = chat?.backendKey;
  const kind = chat?.backendKind;

  React.useEffect(() => {
    if (!key || !online) {
      setMessages([]); setPendingSends(0); setLoading(false); setError(null);
      return;
    }

    let cancelled = false;
    let historyLoaded = false;
    const buffer = [];
    // Watermark for room read-receipts — we only ever advance, debounced so
    // a burst of incoming messages collapses into one mark_read.room call.
    let highestSeenId = 0;
    let markTimer = null;

    function scheduleMarkRead() {
      if (kind !== 'room' || !highestSeenId) return;
      clearTimeout(markTimer);
      markTimer = setTimeout(() => {
        chatHub.markReadRoom(key, highestSeenId).catch(() => {});
      }, 500);
    }

    setMessages([]);
    setPendingSends(0);
    setLoading(true);
    setError(null);

    function ingest(norm) {
      if (norm.authorId === 'me') {
        setPendingSends((c) => Math.max(0, c - 1));
      }
      setMessages((s) => {
        if (s.some((m) => m.serverId === norm.serverId)) return s;
        return [...s, norm];
      });
      if (norm.serverId != null && norm.serverId > highestSeenId) {
        highestSeenId = norm.serverId;
        if (kind === 'room') scheduleMarkRead();
      }
    }

    // After a WS reconnect, fetch any messages we missed via ?after_id and
    // append them. NEVER replace existing state — that would clobber sends
    // that came in via WS while reconnect was in flight (and page=1 returns
    // OLDEST messages anyway, so it can't double as a "latest" snapshot).
    async function catchupAfterReconnect() {
      if (!historyLoaded || highestSeenId <= 0) return;
      try {
        const rows = await listMessagesAfter({ kind, key, afterId: highestSeenId });
        if (cancelled) return;
        for (const r of rows) {
          ingest(normalizeMessage(r, { meId: meIdRef.current }));
        }
      } catch {
        /* network blip — next 'connected' will retry */
      }
    }

    // ── Subscribe to events ────────────────────────────────────────────────
    function handleMessage(data) {
      if (kind === 'dm') {
        const inThis =
          data.sender?.username === key || data.recipient?.username === key;
        if (!inThis) return;
      } else if (kind === 'room') {
        if (data.room && data.room !== key) return;
      }
      const norm = normalizeMessage(data, { meId: meIdRef.current });
      if (!historyLoaded) { buffer.push(norm); return; }
      ingest(norm);

      // For DMs: incoming message in this thread → mark as read so unread
      // badges elsewhere stay accurate.
      if (kind === 'dm' && data.recipient?.id === meIdRef.current) {
        chatHub.markReadDM(key).catch(() => {});
      }
    }

    function handleDmRead(data) {
      // Partner read our messages — flip 'delivered' → 'read' on our outgoing.
      if (kind !== 'dm') return;
      // by_user_id is the reader (the partner); partner_id is us. We only
      // care if the reader matches the chat partner.
      if (chat?.peer?.id != null && data.by_user_id !== chat.peer.id) return;
      setMessages((s) => s.map((m) =>
        m.authorId === 'me' && m.status === 'delivered'
          ? { ...m, status: 'read' }
          : m));
    }

    function handleRoomRead(data) {
      // Watermark from another user catching up. For each of OUR messages
      // at or below up_to_message_id → 'delivered' → 'read'.
      if (kind !== 'room' || data.room !== key) return;
      const readerId = data.by_user?.id ?? data.by_user_id;
      if (readerId === meIdRef.current) return; // ignore self (handled in inbox)
      const upTo = data.up_to_message_id;
      if (upTo == null) return;
      setMessages((s) => s.map((m) => {
        if (m.authorId !== 'me') return m;
        if (m.serverId == null || m.serverId > upTo) return m;
        if (m.status === 'read') return m;
        return { ...m, status: 'read' };
      }));
    }

    const offRoom = chatHub.on('room.message', handleMessage);
    const offDm = chatHub.on('dm.message', handleMessage);
    const offDmRead = chatHub.on('dm.read', handleDmRead);
    const offRoomRead = chatHub.on('room.read', handleRoomRead);
    const offConnected = chatHub.on('connected', catchupAfterReconnect);

    // Room subscription happens at the inbox level (useChats) so push events
    // flow even when this thread isn't open. DMs need no subscription —
    // backend auto-attaches the user.<id> group on connect.
    // For DMs: backend already marks unread as read on history GET, but call
    // mark_read.dm anyway as belt-and-suspenders for any race window.
    if (kind === 'dm') {
      chatHub.markReadDM(key).catch(() => {});
    }

    // ── Load history ───────────────────────────────────────────────────────
    // listLatestMessages walks to the last page so we display newest messages,
    // not the oldest 20 that ?page=1 returns (backend paginates ASC).
    const ctrl = new AbortController();
    const loader = listLatestMessages({ kind, key, signal: ctrl.signal });

    loader.then((rows) => {
      if (cancelled) return;
      const list = rows.map((r) => normalizeMessage(r, { meId: meIdRef.current }));
      list.sort((a, b) => a.sentAt - b.sentAt);
      setMessages((existing) => {
        const seen = new Set(list.map((m) => m.serverId));
        const fromBuffer = buffer.filter((m) => !seen.has(m.serverId));
        fromBuffer.forEach((m) => seen.add(m.serverId));
        const fromExisting = existing.filter((m) =>
          !seen.has(m.serverId) && m.serverId != null);
        return [...list, ...fromBuffer, ...fromExisting].sort((a, b) => a.sentAt - b.sentAt);
      });
      // For rooms: catch up watermark to the latest known message.
      if (kind === 'room') {
        const lastId = list.reduce(
          (acc, m) => m.serverId != null && m.serverId > acc ? m.serverId : acc,
          highestSeenId,
        );
        if (lastId > highestSeenId) {
          highestSeenId = lastId;
          scheduleMarkRead();
        }
      }
    }).catch((e) => {
      if (cancelled || ctrl.signal.aborted) return;
      const status = e?.response?.status;
      if (status === 404) {
        setError({ kind: 'not_found', message: 'Чат недоступен' });
        setMessages([]);
      } else {
        setError({ kind: 'load', message: 'Не удалось загрузить историю' });
      }
    }).finally(() => {
      if (cancelled) return;
      historyLoaded = true;
      while (buffer.length) ingest(buffer.shift());
      setLoading(false);
    });

    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(markTimer);
      offRoom(); offDm(); offDmRead(); offRoomRead(); offConnected();
      // Don't unsubscribe — useChats keeps room subscriptions alive so the
      // inbox preview/unread stays live when the user closes this thread.
    };
  }, [key, kind, online, chat?.peer?.id]);

  function send(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || !key || !kind) return false;
    setPendingSends((c) => c + 1);
    const promise = kind === 'dm'
      ? chatHub.sendDM(key, trimmed)
      : chatHub.sendRoom(key, trimmed);
    promise.catch((err) => {
      // Server rejected (e.g. too long) or not connected. Surface via callback
      // so the page can toast — sock stays open per spec.
      setPendingSends((c) => Math.max(0, c - 1));
      const detail = err?.detail || err?.message || 'Не удалось отправить';
      onSendErrorRef.current?.(detail);
    });
    return true;
  }

  return {
    messages, loading, error,
    wsState: hubState, isConnected, pendingSends, send,
  };
}
