// ChatList — left column: search + filter tabs + chat cards.
// Reused by ChatPopover (compact) and ChatPage (full).
//
// Search behavior: when the query is non-empty, the filter tabs hide and the
// list shows two sections — local matches (existing chats/rooms) on top, then
// remote user results from /api/v1/users/search/ below. Clicking a remote
// result opens a new DM via `onPickUser`.
import React from 'react';
import { ChatIco } from './icons.jsx';
import { formatRelative, nameHue } from './format.js';
import { useUserSearch } from './hooks.js';

const FILTERS = [
  { key: 'all',     label: 'Все' },
  { key: 'direct',  label: 'Личные' },
  { key: 'group',   label: 'Группы' },
  { key: 'unread',  label: 'Непрочитанные' },
  { key: 'archive', label: 'Архив' },
];

export function ChatList({
  chats, activeId, onSelect, onPickUser,
  variant = 'full',          // 'full' | 'popover'
  query, onQueryChange,
  filter, onFilterChange,
  loading,
}) {
  const trimmed = query.trim();
  const searching = trimmed.length > 0;
  const filtered = React.useMemo(() => filterChats(chats, query, filter), [chats, query, filter]);
  const compact = variant === 'popover';

  // Backend user search runs in parallel with local filtering when a query
  // is present. Hidden when search is empty.
  const userSearch = useUserSearch(searching ? trimmed : '');

  // Drop remote users that already correspond to an existing chat (by username).
  const knownUsernames = React.useMemo(() => {
    const set = new Set();
    chats.forEach((c) => {
      if (c.kind === 'direct' && c.peer?.username) set.add(c.peer.username);
      if (c.backendKind === 'dm' && c.backendKey) set.add(c.backendKey);
    });
    return set;
  }, [chats]);
  const remoteUsers = React.useMemo(
    () => userSearch.results.filter((u) => !knownUsernames.has(u.username)),
    [userSearch.results, knownUsernames],
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      background: 'white',
    }}>
      <div style={{
        padding: compact ? '12px 12px 6px' : '16px 16px 10px',
        flexShrink: 0,
      }}>
        <h2 style={{
          margin: '0 0 10px', fontSize: compact ? 14 : 17, fontWeight: 620,
          color: 'var(--ink)', letterSpacing: '-0.015em',
        }}>Сообщения</h2>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 10px', height: 36, borderRadius: 10,
          background: 'oklch(0.97 0.004 260)', border: '1px solid var(--line)',
        }}>
          <ChatIco.search width={14} height={14} style={{ color: 'var(--mute)' }} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Поиск чатов и людей"
            aria-label="Поиск чатов и людей"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 13.5, color: 'var(--ink)',
            }}
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              aria-label="Очистить поиск"
              style={{
                border: 'none', background: 'transparent', color: 'var(--mute)',
                cursor: 'pointer', padding: 2, display: 'inline-flex',
              }}
            ><ChatIco.x width={12} height={12} /></button>
          )}
        </div>
      </div>

      {!compact && !searching && (
        <div style={{
          display: 'flex', gap: 4, padding: '0 10px 8px', overflowX: 'auto',
          flexShrink: 0,
        }}>
          {FILTERS.map((f) => (
            <FilterTab
              key={f.key}
              active={f.key === filter}
              onClick={() => onFilterChange(f.key)}
            >{f.label}</FilterTab>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 6px 12px' }}>
        {loading && !searching ? (
          <ListSkeleton compact={compact} />
        ) : searching ? (
          <SearchResults
            localChats={filtered}
            remoteUsers={remoteUsers}
            remoteLoading={userSearch.loading}
            remoteError={userSearch.error}
            activeId={activeId}
            compact={compact}
            onSelectChat={onSelect}
            onPickUser={onPickUser}
            query={trimmed}
          />
        ) : filtered.length === 0 ? (
          <EmptyList filter={filter} compact={compact} />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map((c) => (
              <li key={c.id}>
                <ChatCard
                  chat={c}
                  active={c.id === activeId}
                  compact={compact}
                  onClick={() => onSelect(c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Search results: local chats + remote users ───────────────────────────
function SearchResults({
  localChats, remoteUsers, remoteLoading, remoteError,
  activeId, compact, onSelectChat, onPickUser, query,
}) {
  const hasLocal = localChats.length > 0;
  const hasRemote = remoteUsers.length > 0;
  const showEmpty = !hasLocal && !hasRemote && !remoteLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {hasLocal && (
        <section>
          <SectionLabel>Чаты</SectionLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {localChats.map((c) => (
              <li key={c.id}>
                <ChatCard
                  chat={c}
                  active={c.id === activeId}
                  compact={compact}
                  onClick={() => onSelectChat(c.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionLabel>
          Люди
          {remoteLoading && (
            <span style={{
              width: 10, height: 10, marginLeft: 8, borderRadius: '50%',
              border: '1.5px solid currentColor', borderRightColor: 'transparent',
              display: 'inline-block', animation: 'lumio-spin 0.7s linear infinite',
              verticalAlign: 'middle',
            }} />
          )}
        </SectionLabel>
        {remoteError && !remoteLoading && (
          <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--mute)' }}>
            Не удалось найти пользователей
          </div>
        )}
        {!remoteLoading && !remoteError && remoteUsers.length === 0 && (
          <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--mute)' }}>
            {query.length < 2 ? 'Введите ≥ 2 символов' : 'Никого не нашли'}
          </div>
        )}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {remoteUsers.map((u) => (
            <li key={u.id}>
              <UserResultRow user={u} compact={compact} onClick={() => onPickUser(u)} />
            </li>
          ))}
        </ul>
      </section>

      {showEmpty && (
        <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 13, color: 'var(--mute)' }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '8px 12px 4px', fontSize: 11, fontWeight: 540,
      color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em',
      display: 'flex', alignItems: 'center',
    }}>
      {children}
    </div>
  );
}

function UserResultRow({ user, compact, onClick }) {
  const [hover, setHover] = React.useState(false);
  const fn = user.first_name || '';
  const ln = user.last_name || '';
  const name = `${fn} ${ln}`.trim() || user.username || '?';
  const hue = nameHue(name);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: compact ? '8px 10px' : '10px 12px', borderRadius: 10,
        background: hover ? 'oklch(0.97 0.004 260)' : 'transparent',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}
    >
      <div style={{
        width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: '50%', flexShrink: 0,
        background: `oklch(0.86 0.08 ${hue})`, color: `oklch(0.32 0.14 ${hue})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: compact ? 13.5 : 15,
      }}>{(name?.[0] || '?').toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 13.5 : 14, fontWeight: 540, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{
          fontSize: 11.5, color: 'var(--mute)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>@{user.username}</span>
          {user.role && (
            <>
              <span>·</span>
              <span>{user.role === 'teacher' ? 'учитель' : user.role === 'student' ? 'ученик' : user.role}</span>
            </>
          )}
        </div>
      </div>
      <ChatIco.chevronRight width={14} height={14} style={{ color: 'var(--mute)', flexShrink: 0 }} />
    </button>
  );
}

function filterChats(chats, query, filter) {
  let list = chats;
  if (filter === 'archive') list = list.filter((c) => c.archived);
  else list = list.filter((c) => !c.archived);

  if (filter === 'direct') list = list.filter((c) => c.kind === 'direct');
  if (filter === 'group')  list = list.filter((c) => c.kind === 'group');
  if (filter === 'unread') list = list.filter((c) => c.unread > 0);

  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.preview || '').toLowerCase().includes(q));
  }

  // Pinned first, then by previewTime desc
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.previewTime - a.previewTime;
  });
}

function FilterTab({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px', borderRadius: 999, fontFamily: 'inherit',
        fontSize: 12, fontWeight: 540, cursor: 'pointer', whiteSpace: 'nowrap',
        background: active ? 'var(--primary-soft)' : 'transparent',
        color: active ? 'var(--primary-soft-ink)' : 'var(--mute)',
        border: '1px solid', borderColor: active ? 'transparent' : 'var(--line)',
      }}
    >{children}</button>
  );
}

// ─── Chat card ─────────────────────────────────────────────────────────────
function ChatCard({ chat, active, compact, onClick }) {
  const [hover, setHover] = React.useState(false);

  const isGroup = chat.kind === 'group';
  const hue = nameHue(chat.name);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: compact ? '8px 10px' : '10px 12px', borderRadius: 10,
        cursor: 'pointer', position: 'relative',
        background: active
          ? 'var(--primary-soft)'
          : (hover ? 'oklch(0.97 0.004 260)' : 'transparent'),
        transition: 'background-color 120ms',
      }}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${chat.name}, ${chat.unread} непрочитанных`}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: '50%',
          background: isGroup ? 'var(--primary-soft)' : `oklch(0.86 0.08 ${hue})`,
          color: isGroup ? 'var(--primary-soft-ink)' : `oklch(0.32 0.14 ${hue})`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: compact ? 13.5 : 15,
        }}>
          {isGroup ? <ChatIco.users width={16} height={16} /> : (chat.name?.[0] || '?').toUpperCase()}
        </div>
        {chat.online && !isGroup && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: '50%',
            background: 'oklch(0.62 0.13 155)', border: '2px solid white',
          }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1,
        }}>
          <span style={{
            fontSize: compact ? 13.5 : 14, fontWeight: chat.unread > 0 ? 580 : 540,
            color: 'var(--ink)', letterSpacing: '-0.005em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            flex: 1, minWidth: 0,
          }}>{chat.name}</span>
          {chat.muted && <ChatIco.bellOff width={11} height={11} style={{ color: 'var(--mute)', flexShrink: 0 }} />}
          {chat.pinned && <ChatIco.pin width={11} height={11} style={{ color: 'var(--mute)', flexShrink: 0 }} />}
          <span style={{
            fontSize: 11, color: 'var(--mute)', flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>{formatRelative(chat.previewTime)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            flex: 1, minWidth: 0, fontSize: 12.5,
            color: chat.typing ? 'var(--primary-ink)' : 'var(--mute)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontStyle: chat.typing ? 'italic' : 'normal',
            fontWeight: chat.unread > 0 ? 540 : 400,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {chat.previewSelf && !chat.typing && chat.lastStatus && (
              <span style={{ color: chat.lastStatus === 'read' ? 'var(--primary-ink)' : 'var(--mute)', flexShrink: 0 }}>
                {chat.lastStatus === 'sent'
                  ? <ChatIco.check width={12} height={12} />
                  : <ChatIco.doubleCheck width={12} height={12} />}
              </span>
            )}
            <span style={{
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
            }}>
              {chat.typing ? `${chat.typing} печатает…` : chat.preview}
            </span>
          </div>
          {chat.unread > 0 && (
            <span style={{
              flexShrink: 0, minWidth: 18, height: 18, padding: '0 5px',
              borderRadius: 999, background: chat.muted ? 'var(--mute)' : 'var(--primary)',
              color: 'white', fontSize: 11, fontWeight: 620, lineHeight: '18px',
              textAlign: 'center', boxSizing: 'border-box',
            }}>{chat.unread > 99 ? '99+' : chat.unread}</span>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Empty list states (search results have their own inline empty UI) ───
function EmptyList({ filter, compact }) {
  if (filter === 'unread') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 540, color: 'var(--ink)' }}>Всё прочитано</div>
        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 4 }}>
          Непрочитанных сообщений нет.
        </div>
      </div>
    );
  }
  return (
    <div style={{
      padding: compact ? '24px 16px' : '48px 20px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><ChatIco.inbox width={24} height={24} /></div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 580, color: 'var(--ink)' }}>
          У вас пока нет сообщений
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 4 }}>
          Начните искать ученика или учителя выше — диалог откроется по клику.
        </div>
      </div>
    </div>
  );
}

function ListSkeleton({ compact }) {
  return (
    <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: compact ? 4 : 7 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
        }}>
          <div style={skeletonBlock(40, 40, '50%')} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={skeletonBlock(`${50 + (i % 3) * 15}%`, 10, 4)} />
            <div style={skeletonBlock(`${70 - (i % 3) * 10}%`, 9, 4)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function skeletonBlock(w, h, r) {
  return {
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg, oklch(0.95 0.004 260), oklch(0.97 0.004 260), oklch(0.95 0.004 260))',
    backgroundSize: '200% 100%',
    animation: 'lumio-skeleton 1.4s ease-in-out infinite',
  };
}
