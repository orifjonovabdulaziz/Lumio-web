// ChatTrigger — drop-in for the topbar chat icon. Two views:
//   1. List of conversations + inline user search (default)
//   2. Quick-reply: single conversation, can write without leaving the page.
// Each view's WS lifecycle is owned by `useChatThread`, which closes the
// socket on unmount — so navigating list ↔ conversation cleanly opens/closes.
import React from 'react';
import { useRouter } from '../../router.jsx';
import { useAuth } from '../../lib/auth.js';
import { ChatIco } from './icons.jsx';
import { ChatList } from './list.jsx';
import { useChats, useChatThread, useOnline } from './hooks.js';
import { setPendingActive } from './mock.js';
import { groupMessages } from './window.jsx';
import { MessageBubble, SystemMessage } from './message.jsx';
import { MessageInput } from './input.jsx';
import { nameHue } from './format.js';

export function ChatTrigger({ unread: unreadProp }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(null);
  const wrapRef = React.useRef(null);
  const { navigate } = useRouter();
  const { user, bootstrapping } = useAuth();

  const { chats, loading, upsertChat } = useChats({
    enabled: open && !bootstrapping && !!user,
    meId: user?.id,
  });

  const totalUnread = React.useMemo(
    () => chats.reduce((s, c) => s + (c.unread || 0), 0),
    [chats],
  );
  const unread = open ? totalUnread : (unreadProp ?? 0);

  React.useEffect(() => {
    if (!open) return;
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onEsc(e) {
      if (e.key !== 'Escape') return;
      // First Esc backs out of quick-reply, second closes the popover.
      if (selectedId) setSelectedId(null);
      else setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, selectedId]);

  // Close popover → drop quick-reply selection so the next open shows list.
  React.useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  function openFull(chatId) {
    if (chatId) setPendingActive(chatId);
    setOpen(false);
    navigate('/chat');
  }

  function pickUser(u) {
    const id = `dm:${u.username}`;
    if (!chats.some((c) => c.id === id)) {
      const fn = u.first_name || '';
      const ln = u.last_name || '';
      const name = `${fn} ${ln}`.trim() || u.username || '?';
      upsertChat({
        id, kind: 'direct', backendKind: 'dm', backendKey: u.username,
        peer: u, name, unread: 0, preview: '', previewTime: Date.now(), previewSelf: false,
      });
    }
    setSelectedId(id);
    setQuery('');
  }

  // selectedChat re-derives every render — but useChatThread now keys on
  // backendKey/backendKind only, so this doesn't churn the WS.
  const selectedChat = selectedId ? (chats.find((c) => c.id === selectedId) || null) : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <IconBadgeButton
        label="Сообщения" count={unread} active={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div style={{
          // Anchor to the viewport, not the trigger wrapper — the trigger sits
          // ~140px from the right edge (notifications + avatar follow it), so
          // `right: 0` would cut the popover off the left side on screens
          // narrower than ~540px. Topbars are 68px tall in both dashboards.
          position: 'fixed', top: 76, right: 12,
          width: 400, maxWidth: 'calc(100vw - 24px)',
          height: 540, maxHeight: 'calc(100vh - 88px)',
          background: 'white', border: '1px solid var(--line-strong)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
          zIndex: 30, display: 'flex', flexDirection: 'column',
        }}>
          {selectedChat ? (
            <PopoverConversation
              chat={selectedChat}
              meId={user?.id}
              onBack={() => setSelectedId(null)}
              onExpand={() => openFull(selectedId)}
            />
          ) : (
            <>
              <ChatList
                chats={chats}
                activeId={null}
                onSelect={(id) => setSelectedId(id)}
                onPickUser={pickUser}
                variant="popover"
                query={query}
                onQueryChange={setQuery}
                filter="all"
                onFilterChange={() => {}}
                loading={loading}
              />
              <div style={{
                flexShrink: 0, padding: '8px 10px',
                borderTop: '1px solid var(--line)', background: 'oklch(0.98 0.004 260)',
              }}>
                <button
                  onClick={() => openFull()}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: 'transparent', color: 'var(--primary-ink)',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 560,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >Открыть все сообщения <ChatIco.chevronRight width={14} height={14} /></button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quick-reply view inside the popover ───────────────────────────────────
function PopoverConversation({ chat, meId, onBack, onExpand }) {
  const online = useOnline();
  const scrollRef = React.useRef(null);

  const { messages, loading, error, wsState, isConnected, pendingSends, send } =
    useChatThread({ chat, meId, online });

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, chat?.id]);

  const isGroup = chat.kind === 'group';
  const groups = groupMessages(messages || []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      background: 'oklch(0.98 0.003 260)',
    }}>
      <Header chat={chat} isGroup={isGroup} onBack={onBack} onExpand={onExpand} />

      {!online && <MiniBanner color="danger">Нет соединения</MiniBanner>}
      {online && wsState === 'reconnecting' && <MiniBanner color="warn">Переподключаемся…</MiniBanner>}
      {error?.kind === 'forbidden' && <MiniBanner color="danger">Нет доступа к чату</MiniBanner>}
      {error?.kind === 'not_found' && <MiniBanner color="danger">Чат недоступен</MiniBanner>}

      <div ref={scrollRef} style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {loading ? (
          <Skeleton />
        ) : error ? (
          <InlineError text={error.message || 'Не удалось загрузить'} />
        ) : groups.length === 0 ? (
          <div style={{
            margin: 'auto', padding: 24, textAlign: 'center',
            fontSize: 12.5, color: 'var(--mute)',
          }}>Сообщений пока нет. Напишите первое.</div>
        ) : (
          groups.map((g) =>
            g.kind === 'date' ? (
              <div key={g.key} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 4px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 540, color: 'var(--mute)',
                  background: 'white', border: '1px solid var(--line)',
                  padding: '2px 8px', borderRadius: 999,
                }}>{g.label}</span>
              </div>
            ) : g.kind === 'system' ? (
              <SystemMessage key={g.key} text={g.text} />
            ) : (
              <MessageBubble
                key={g.message.id}
                message={g.message}
                showAvatar={g.showAvatar}
                showAuthor={g.showAuthor}
                showTail={g.showTail}
                isGroupChat={isGroup}
              />
            )
          )
        )}
      </div>

      <MessageInput
        onSend={(payload) => { if (payload.kind === 'text') send(payload.text); }}
        templates={[]}
        onAddTemplate={() => {}}
        offline={!online}
        isConnected={isConnected}
        pendingSends={pendingSends}
        disabled={!isConnected || error?.kind === 'not_found'}
      />
    </div>
  );
}

function Header({ chat, isGroup, onBack, onExpand }) {
  return (
    <div style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', background: 'white',
      borderBottom: '1px solid var(--line)',
    }}>
      <button
        onClick={onBack}
        aria-label="К списку"
        style={miniIconBtn}
      ><ChatIco.chevronLeft width={16} height={16} /></button>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isGroup ? 'var(--primary-soft)' : `oklch(0.86 0.08 ${nameHue(chat.name)})`,
        color: isGroup ? 'var(--primary-soft-ink)' : `oklch(0.32 0.14 ${nameHue(chat.name)})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 13,
      }}>
        {isGroup ? <ChatIco.users width={14} height={14} /> : (chat.name?.[0] || '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 580, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{chat.name}</div>
        {chat.peer?.username && (
          <div style={{
            fontSize: 11.5, color: 'var(--mute)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>@{chat.peer.username}</div>
        )}
      </div>
      <button
        onClick={onExpand}
        aria-label="Открыть в полном режиме" title="Открыть в полном режиме"
        style={miniIconBtn}
      ><ChatIco.chevronRight width={16} height={16} /></button>
    </div>
  );
}

const miniIconBtn = {
  width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'transparent', color: 'var(--ink-soft)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', flexShrink: 0,
};

function MiniBanner({ color, children }) {
  const map = {
    danger: { bg: 'oklch(0.97 0.02 25)', fg: 'var(--danger)' },
    warn:   { bg: 'oklch(0.97 0.05 85)', fg: 'oklch(0.45 0.13 85)' },
  };
  const c = map[color] || map.danger;
  return (
    <div style={{
      flexShrink: 0, padding: '4px 12px',
      background: c.bg, color: c.fg, fontSize: 11.5, fontWeight: 540,
    }}>{children}</div>
  );
}

function InlineError({ text }) {
  return (
    <div style={{
      margin: 'auto', maxWidth: 280, padding: 16, textAlign: 'center',
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--danger-bg)', color: 'var(--danger)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><ChatIco.alertCircle width={16} height={16} /></div>
      <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>{text}</div>
    </div>
  );
}

function Skeleton() {
  const rows = [
    { mine: false, w: 180 }, { mine: true,  w: 140 },
    { mine: false, w: 220 }, { mine: false, w: 160 },
    { mine: true,  w: 200 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: r.mine ? 'flex-end' : 'flex-start',
        }}>
          <div style={{
            width: r.w, height: 30, borderRadius: 12,
            background: 'linear-gradient(90deg, oklch(0.95 0.004 260), oklch(0.97 0.004 260), oklch(0.95 0.004 260))',
            backgroundSize: '200% 100%',
            animation: 'lumio-skeleton 1.4s ease-in-out infinite',
          }} />
        </div>
      ))}
    </div>
  );
}

function IconBadgeButton({ label, count, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      aria-label={label} title={label}
      aria-expanded={active}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: 'relative', width: 40, height: 40, borderRadius: 10,
        background: active || hover ? 'oklch(0.96 0.004 260)' : 'transparent',
        border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-soft)',
        transition: 'background-color 120ms',
      }}
    >
      <ChatIco.inbox />
      {count > 0 && (
        <span style={{
          position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16,
          padding: '0 4px', boxSizing: 'border-box',
          borderRadius: 999, background: 'oklch(0.62 0.18 25)', color: 'white',
          fontSize: 10, fontWeight: 600, lineHeight: '16px', textAlign: 'center',
        }}>{count > 99 ? '99+' : count}</span>
      )}
    </button>
  );
}
