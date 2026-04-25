// Data hooks — load conversations + per-chat threads, manage WS lifecycle.
//
// Per integration spec: NO optimistic UI. Messages are appended only when
// they arrive via WS (server broadcasts to everyone including the sender).
import React from 'react';
import { listRooms } from '../../lib/rooms.js';
import {
  listDmConversations, listDmMessages, listRoomMessages,
  openChatSocket, normalizeMessage, normalizeConversation, normalizeRoom,
} from '../../lib/chat.js';

// ─── Conversations + rooms list ────────────────────────────────────────────
export function useChats({ enabled }) {
  const [chats, setChats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const refresh = React.useCallback(async (opts = {}) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const [dms, rooms] = await Promise.all([
        listDmConversations().catch(() => []),
        listRooms().then((r) => Array.isArray(r) ? r : (r?.results || [])).catch(() => []),
      ]);
      const merged = [
        ...dms.map(normalizeConversation),
        ...rooms.map(normalizeRoom),
      ].sort((a, b) => b.previewTime - a.previewTime);
      setChats((prev) => {
        // Preserve any locally-upserted ephemeral chats (new DMs started via
        // student search before they have a server-side conversation entry).
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

  React.useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

  // Refresh on tab focus / network restore.
  React.useEffect(() => {
    if (!enabled) return;
    function onVis() { if (!document.hidden) refresh({ silent: true }); }
    function onOnline() { refresh({ silent: true }); }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, refresh]);

  // Poll every 30s while enabled (and tab is visible).
  // Per spec: "Опциональный поллинг каждые 30с только если у юзера открыт сам список".
  React.useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (!document.hidden) refresh({ silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  const setChatField = React.useCallback((id, patch) => {
    setChats((s) => s.map((c) => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const bumpPreview = React.useCallback((id, { text, time, self }) => {
    setChats((s) => s.map((c) => c.id === id
      ? { ...c, preview: text, previewTime: time, previewSelf: self }
      : c));
  }, []);

  // Used when starting a new DM via student search — adds a placeholder chat
  // before any history exists.
  const upsertChat = React.useCallback((chat) => {
    setChats((s) => {
      if (s.some((c) => c.id === chat.id)) return s;
      return [{ ...chat, ephemeral: true }, ...s];
    });
  }, []);

  return { chats, loading, error, refresh, setChatField, bumpPreview, upsertChat };
}

// ─── Per-chat thread + WS ──────────────────────────────────────────────────
export function useChatThread({ chat, meId, online, onUnauthorized, onWsError }) {
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [wsState, setWsState] = React.useState('idle');
  const [pendingSends, setPendingSends] = React.useState(0);
  const socketRef = React.useRef(null);
  const meIdRef = React.useRef(meId);
  meIdRef.current = meId;
  const onUnauthorizedRef = React.useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;
  const onWsErrorRef = React.useRef(onWsError);
  onWsErrorRef.current = onWsError;

  const key = chat?.backendKey;
  const kind = chat?.backendKind;

  // Load history + open WS in lockstep, with a buffer for any WS messages
  // that arrive while history is still loading (otherwise setMessages(history)
  // would overwrite live-arrived messages).
  //
  // Deps are [key, kind, online] only — NOT `chat`. The parent re-derives
  // `activeChat` via `chats.find(...)` so its identity changes on every
  // chats refresh (poll, bumpPreview, etc.). Including `chat` would tear
  // down + reopen the WS on every poll tick.
  React.useEffect(() => {
    if (!key || !online) {
      setMessages([]); setWsState('idle'); setPendingSends(0);
      return;
    }

    let cancelled = false;
    let historyLoaded = false;
    const buffer = [];
    setMessages([]);
    setLoading(true);
    setError(null);
    setPendingSends(0);

    function ingest(norm) {
      if (norm.authorId === 'me') {
        setPendingSends((c) => Math.max(0, c - 1));
      }
      setMessages((s) => {
        if (s.some((m) => m.serverId === norm.serverId)) return s;
        return [...s, norm];
      });
    }

    // Open WS immediately so we don't miss live messages during history fetch.
    const sock = openChatSocket({ kind, key });
    socketRef.current = sock;

    const offState = sock.onState((s) => setWsState(s));
    const offMsg = sock.onMessage((data) => {
      // Server uses type:"message" (room) and type:"dm". Filter strictly so
      // we don't mis-ingest, e.g., a presence event added later.
      if (data?.type && data.type !== 'message' && data.type !== 'dm') return;
      if (data?.id == null || data?.content == null || !data?.created_at) return;
      const norm = normalizeMessage(data, { meId: meIdRef.current });
      if (!historyLoaded) { buffer.push(norm); return; }
      ingest(norm);
    });
    const offErr = sock.onError((detail) => onWsErrorRef.current?.(detail));
    const offUnauth = sock.onUnauthorized(() => onUnauthorizedRef.current?.());

    // Load history in parallel.
    const ctrl = new AbortController();
    const loader = kind === 'dm'
      ? listDmMessages(key, { signal: ctrl.signal })
      : listRoomMessages(key, { signal: ctrl.signal });

    loader.then((rows) => {
      if (cancelled) return;
      const list = rows.map((r) => normalizeMessage(r, { meId: meIdRef.current }));
      list.sort((a, b) => a.sentAt - b.sentAt);

      // Merge: history + WS-buffered (dedup by serverId), preserving order.
      setMessages((existing) => {
        const seen = new Set(list.map((m) => m.serverId));
        const fromBuffer = buffer.filter((m) => !seen.has(m.serverId));
        fromBuffer.forEach((m) => seen.add(m.serverId));
        // `existing` may have items from WS that arrived between `setMessages([])`
        // and the buffer flag flip (vanishingly small window) — keep them too.
        const fromExisting = existing.filter((m) =>
          !seen.has(m.serverId) && m.serverId != null);
        return [...list, ...fromBuffer, ...fromExisting].sort((a, b) => a.sentAt - b.sentAt);
      });
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
      offState(); offMsg(); offErr(); offUnauth();
      sock.close();
      socketRef.current = null;
      setWsState('idle');
    };
  }, [key, kind, online]);

  // Send via WS only — no optimistic insert. Echo from the server is what
  // appears in the thread.
  function send(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return false;
    const sock = socketRef.current;
    if (!sock) return false;
    const ok = sock.send(trimmed);
    if (ok) setPendingSends((c) => c + 1);
    return ok;
  }

  const isConnected = wsState === 'open';

  return { messages, loading, error, wsState, isConnected, pendingSends, send };
}
