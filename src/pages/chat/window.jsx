// ChatWindow — right column: header + scrollable thread + input.
//
// Backend-disabled features (rendered as inactive or hidden):
//   pin/mute/archive/delete chat   — menu items disabled
//   pinned messages                — bar hidden
//   reactions / replies            — props not wired; bubbles render text only
//   typing indicator / online      — no events from backend, hidden
//   видеозвонок                    — заглушка (alert)
//   drag & drop файлов             — отключено
import React from 'react';
import { ChatIco } from './icons.jsx';
import { MessageBubble, SystemMessage } from './message.jsx';
import { MessageInput } from './input.jsx';
import { formatDateSeparator, nameHue, pluralize } from './format.js';
import { ME_ID } from './mock.js';

export function ChatWindow({
  chat, messages, error,
  onSend,
  templates, onAddTemplate,
  onBack, showBack,
  offline, loading, wsState, isConnected, pendingSends,
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [headerMenuOpen, setHeaderMenuOpen] = React.useState(false);
  const scrollRef = React.useRef(null);
  const headerMenuRef = React.useRef(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages?.length, chat?.id]);

  React.useEffect(() => { setSearchOpen(false); setSearchQuery(''); }, [chat?.id]);

  React.useEffect(() => {
    if (!headerMenuOpen) return;
    function onDown(e) { if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) setHeaderMenuOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [headerMenuOpen]);

  // After-hours hint: if peer wrote between 22:00–08:00 and we haven't replied.
  const afterHours = React.useMemo(() => {
    if (!messages?.length) return false;
    const last = messages[messages.length - 1];
    if (last.authorId === ME_ID) return false;
    const h = new Date(last.sentAt).getHours();
    return h >= 22 || h < 8;
  }, [messages]);

  if (!chat) {
    return <EmptyConversation />;
  }

  const isGroup = chat.kind === 'group';
  const subtitle = isGroup
    ? (chat.members
        ? `${chat.members} ${pluralize(chat.members, ['участник', 'участника', 'участников'])}`
        : 'групповой чат')
    : (chat.peer?.username ? `@${chat.peer.username}` : '');

  const groups = groupMessages(messages || []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0, position: 'relative',
      background: 'oklch(0.98 0.003 260)',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: 'white',
        borderBottom: '1px solid var(--line)',
      }}>
        {showBack && (
          <button onClick={onBack} aria-label="Назад" style={iconBtnStyle}>
            <ChatIco.chevronLeft />
          </button>
        )}

        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: isGroup ? 'var(--primary-soft)' : `oklch(0.86 0.08 ${nameHue(chat.name)})`,
          color: isGroup ? 'var(--primary-soft-ink)' : `oklch(0.32 0.14 ${nameHue(chat.name)})`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 14,
        }}>
          {isGroup ? <ChatIco.users width={16} height={16} /> : (chat.name?.[0] || '?').toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14.5, fontWeight: 580, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{chat.name}</div>
          {subtitle && (
            <div style={{
              fontSize: 11.5, color: 'var(--mute)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{subtitle}</div>
          )}
        </div>

        <DisabledIconBtn label="Видеозвонок — скоро" icon={ChatIco.video} />
        <button
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Поиск по чату" title="Поиск по чату"
          style={{ ...iconBtnStyle, background: searchOpen ? 'oklch(0.96 0.004 260)' : 'transparent' }}
        ><ChatIco.search /></button>
        <div ref={headerMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setHeaderMenuOpen((v) => !v)}
            aria-label="Меню" title="Меню"
            style={iconBtnStyle}
          ><ChatIco.moreV /></button>
          {headerMenuOpen && (
            <HeaderMenu onClose={() => setHeaderMenuOpen(false)} />
          )}
        </div>
      </div>

      {searchOpen && (
        <div style={{
          flexShrink: 0, padding: '8px 14px', background: 'white',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <ChatIco.search width={14} height={14} style={{ color: 'var(--mute)' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по сообщениям"
            autoFocus
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 13.5, color: 'var(--ink)',
            }}
          />
          <button
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            aria-label="Закрыть поиск"
            style={{ ...iconBtnStyle, width: 28, height: 28 }}
          ><ChatIco.x width={14} height={14} /></button>
        </div>
      )}

      {/* Scrollable thread */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2,
          position: 'relative',
        }}
        role="log" aria-live="polite"
      >
        {loading ? (
          <ThreadSkeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : groups.length === 0 ? (
          <div style={{
            margin: 'auto', textAlign: 'center', color: 'var(--mute)', fontSize: 13,
            padding: 40,
          }}>
            Сообщений пока нет. Напишите первое.
          </div>
        ) : (
          groups.map((g) => (
            g.kind === 'date' ? (
              <div key={g.key} style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 6px' }}>
                <span style={{
                  fontSize: 11.5, fontWeight: 540, color: 'var(--mute)',
                  background: 'white', border: '1px solid var(--line)',
                  padding: '3px 10px', borderRadius: 999,
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
                searchQuery={searchQuery}
                /* reply / reactions / retry — нет в бэкенде, обработчики не передаём */
              />
            )
          ))
        )}
      </div>

      {afterHours && (
        <div style={{
          flexShrink: 0, padding: '8px 14px',
          background: 'oklch(0.97 0.004 260)', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12.5, color: 'var(--mute)',
        }}>
          <ChatIco.moon width={14} height={14} />
          Сообщение не в рабочие часы — учитель ответит утром.
        </div>
      )}

      <MessageInput
        onSend={onSend}
        templates={templates}
        onAddTemplate={onAddTemplate}
        offline={offline}
        isConnected={isConnected}
        pendingSends={pendingSends}
        disabled={!isConnected || error?.kind === 'not_found' || error?.kind === 'forbidden'}
      />
    </div>
  );
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 10,
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'var(--ink-soft)', flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
};

function DisabledIconBtn({ label, icon: Ico }) {
  return (
    <button
      disabled aria-label={label} title={label}
      style={{
        ...iconBtnStyle, cursor: 'not-allowed',
        color: 'var(--line-strong)', opacity: 0.6,
      }}
    ><Ico /></button>
  );
}

// ─── Thread grouping ───────────────────────────────────────────────────────
export function groupMessages(messages) {
  const out = [];
  let lastDateKey = '';
  const list = messages.slice().sort((a, b) => a.sentAt - b.sentAt);

  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const dKey = new Date(m.sentAt).toDateString();
    if (dKey !== lastDateKey) {
      out.push({ kind: 'date', key: `d-${dKey}`, label: formatDateSeparator(m.sentAt) });
      lastDateKey = dKey;
    }
    if (m.kind === 'system') {
      out.push({ kind: 'system', key: m.id, text: m.text });
      continue;
    }

    const prev = list[i - 1];
    const next = list[i + 1];
    const sameAuthorPrev = prev && prev.authorId === m.authorId && (m.sentAt - prev.sentAt) < 2 * 60 * 1000
      && prev.kind !== 'system'
      && new Date(prev.sentAt).toDateString() === dKey;
    const sameAuthorNext = next && next.authorId === m.authorId && (next.sentAt - m.sentAt) < 2 * 60 * 1000
      && next.kind !== 'system'
      && new Date(next.sentAt).toDateString() === dKey;

    out.push({
      kind: 'message', message: m,
      showAuthor: !sameAuthorPrev,
      showAvatar: !sameAuthorNext,
      showTail: !sameAuthorNext,
    });
  }
  return out;
}

// ─── Header menu ───────────────────────────────────────────────────────────
// Pin / mute / archive / delete have no backend yet — rendered disabled.
function HeaderMenu() {
  const items = [
    { label: 'Закрепить чат',           icon: ChatIco.pin,     disabled: true },
    { label: 'Отключить уведомления',   icon: ChatIco.bellOff, disabled: true },
    { type: 'divider' },
    { label: 'Архивировать',            icon: ChatIco.archive, disabled: true },
    { label: 'Удалить чат',             icon: ChatIco.trash,   disabled: true, danger: true },
  ];
  return (
    <div role="menu" style={{
      position: 'absolute', right: 0, top: 'calc(100% + 4px)',
      minWidth: 240, padding: 4, zIndex: 20,
      background: 'white', border: '1px solid var(--line-strong)', borderRadius: 12,
      boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
    }}>
      <div style={{
        padding: '8px 10px 4px', fontSize: 11, fontWeight: 540, color: 'var(--mute)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>Скоро</div>
      {items.map((it, i) =>
        it.type === 'divider'
          ? <div key={`d${i}`} style={{ height: 1, background: 'var(--line)', margin: '4px 4px' }} />
          : <MenuRow key={i} {...it} />
      )}
    </div>
  );
}

function MenuRow({ label, icon: Ico, danger, disabled }) {
  return (
    <button
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8, fontFamily: 'inherit',
        background: 'transparent',
        color: disabled
          ? 'var(--mute)'
          : (danger ? 'oklch(0.55 0.18 25)' : 'var(--ink)'),
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontSize: 13, textAlign: 'left',
      }}
    >
      <Ico width={14} height={14} />
      <span>{label}</span>
    </button>
  );
}

// ─── Empty / loading / error states ────────────────────────────────────────
function EmptyConversation() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      padding: 40, textAlign: 'center', color: 'var(--mute)',
      background: 'oklch(0.98 0.003 260)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ChatIco.inbox width={28} height={28} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 580, color: 'var(--ink)' }}>
          Выберите чат
        </div>
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
          Слева — список диалогов с учениками и группами.
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }) {
  const isNotFound = error?.kind === 'not_found';
  return (
    <div style={{
      margin: 'auto', maxWidth: 360, textAlign: 'center',
      padding: 32, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'var(--danger-bg)', color: 'var(--danger)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><ChatIco.alertCircle width={20} height={20} /></div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 580, color: 'var(--ink)' }}>
          {isNotFound ? 'Чат недоступен' : 'Не удалось загрузить'}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 4 }}>
          {isNotFound
            ? 'Возможно, вы не участник этой комнаты.'
            : 'Проверьте подключение и попробуйте снова.'}
        </div>
      </div>
    </div>
  );
}

function ThreadSkeleton() {
  const rows = [
    { mine: false, w: 220 }, { mine: false, w: 320 },
    { mine: true,  w: 180 }, { mine: false, w: 260 },
    { mine: true,  w: 240 }, { mine: false, w: 300 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: r.mine ? 'flex-end' : 'flex-start',
        }}>
          <div style={{
            width: r.w, height: 36, borderRadius: 14,
            background: 'linear-gradient(90deg, oklch(0.95 0.004 260), oklch(0.97 0.004 260), oklch(0.95 0.004 260))',
            backgroundSize: '200% 100%',
            animation: 'lumio-skeleton 1.4s ease-in-out infinite',
          }} />
        </div>
      ))}
    </div>
  );
}
