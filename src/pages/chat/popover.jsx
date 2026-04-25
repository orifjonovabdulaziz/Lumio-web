// ChatTrigger — drop-in for the topbar chat icon. Renders the icon button and
// a popover with the recent conversations list. Selecting a chat navigates to
// the full-screen page (popover doesn't open WS — that lives on the page).
import React from 'react';
import { useRouter } from '../../router.jsx';
import { useAuth } from '../../lib/auth.js';
import { ChatIco } from './icons.jsx';
import { ChatList } from './list.jsx';
import { useChats } from './hooks.js';
import { setPendingActive } from './mock.js';

export function ChatTrigger({ unread: unreadProp }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const wrapRef = React.useRef(null);
  const { navigate } = useRouter();
  const { user, bootstrapping } = useAuth();

  const { chats, loading } = useChats({ enabled: open && !bootstrapping && !!user });

  const totalUnread = React.useMemo(
    () => chats.reduce((s, c) => s + (c.unread || 0), 0),
    [chats],
  );
  const unread = open ? totalUnread : (unreadProp ?? 0);

  React.useEffect(() => {
    if (!open) return;
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  function openFull(chatId) {
    if (chatId) setPendingActive(chatId);
    setOpen(false);
    navigate('/chat');
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <IconBadgeButton
        label="Сообщения" count={unread} active={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 400, maxWidth: 'calc(100vw - 24px)',
          height: 540, maxHeight: 'calc(100vh - 100px)',
          background: 'white', border: '1px solid var(--line-strong)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
          zIndex: 30, display: 'flex', flexDirection: 'column',
        }}>
          <ChatList
            chats={chats}
            activeId={null}
            onSelect={(id) => openFull(id)}
            onPickUser={(u) => openFull(`dm:${u.username}`)}
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
        </div>
      )}
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
