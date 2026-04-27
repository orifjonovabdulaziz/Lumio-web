// ChatPage — full-page chat (two columns desktop / single column mobile).
// Live data flows through the multiplexed chatHub (../../lib/chatHub.js);
// REST is used only to load history once per chat open + the inbox bootstrap.
import React from 'react';
import { useRouter } from '../../router.jsx';
import { useAuth, logout as doLogout } from '../../lib/auth.js';
import { LumioLogo, Toast, Button } from '../../ui.jsx';
import { ChatIco } from './icons.jsx';
import { ChatList } from './list.jsx';
import { ChatWindow } from './window.jsx';
import { useChats, useChatThread, useOnline, useHubState } from './hooks.js';
import { chatHub } from '../../lib/chatHub.js';
import { MOCK_TEMPLATES, consumePendingActive } from './mock.js';

// ─── Error boundary ────────────────────────────────────────────────────────
// Without this, any throw deep in the tree (e.g. an unexpected backend shape
// crashing a render) would unmount the whole app → blank screen, no clue.
class ChatErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ChatPage crashed]', error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center',
        background: 'var(--paper)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--danger-bg)', color: 'var(--danger)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><ChatIco.alertCircle width={26} height={26} /></div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 620, color: 'var(--ink)' }}>
          Чат упал при отрисовке
        </h1>
        <pre style={{
          margin: 0, fontSize: 12, color: 'var(--mute)', maxWidth: 720, overflow: 'auto',
          padding: 12, background: 'oklch(0.97 0.004 260)', borderRadius: 10, textAlign: 'left',
        }}>{String(this.state.error?.stack || this.state.error)}</pre>
        <Button onClick={() => { this.setState({ error: null }); this.props.onReset?.(); }}>
          Попробовать снова
        </Button>
      </div>
    );
  }
}

export function ChatPage() {
  // Wrap so any throw shows useful context instead of a white screen.
  return (
    <ChatErrorBoundary onReset={() => window.location.reload()}>
      <ChatPageInner />
    </ChatErrorBoundary>
  );
}

const sharedCss = `
@keyframes lumio-skeleton { 0% { background-position: 0% 0; } 100% { background-position: -200% 0; } }
@keyframes lumio-typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-3px); opacity: 1; } }
@keyframes lumio-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

function useIsMobile() {
  const [m, setM] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches);
  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 760px)');
    const fn = (e) => setM(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', fn);
    else mql.addListener(fn);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', fn);
      else mql.removeListener(fn);
    };
  }, []);
  return m;
}

function ChatPageInner() {
  const { user, bootstrapping } = useAuth();
  const { navigate } = useRouter();
  const isMobile = useIsMobile();
  const online = useOnline();

  const { chats, loading: chatsLoading, setChatField, upsertChat } =
    useChats({ enabled: !bootstrapping && !!user, meId: user?.id });

  const [activeId, setActiveId] = React.useState(() => consumePendingActive());
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [mobileView, setMobileView] = React.useState('list');
  const [templates, setTemplates] = React.useState(MOCK_TEMPLATES);
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    if (activeId || chats.length === 0 || isMobile) return;
    setActiveId(chats[0].id);
  }, [chats, activeId, isMobile]);

  const activeChat = chats.find((c) => c.id === activeId) || null;

  const { messages, loading: threadLoading, error: threadError,
    wsState, isConnected, pendingSends, send } =
    useChatThread({
      chat: activeChat,
      meId: user?.id,
      online,
      onSendError: (detail) => setToast({ kind: 'error', text: detail }),
    });

  // Hub-level auth failure: refreshAccess already failed inside the hub →
  // we're truly logged out. Bounce to sign-in.
  React.useEffect(() => {
    const off = chatHub.on('unauthorized', () => {
      doLogout();
      navigate('/sign-in', { replace: true });
    });
    return off;
  }, [navigate]);

  // Stable string id — using activeChat itself as a dep would loop because
  // `chats.find(...)` returns a new ref on every chats update.
  const activeChatId = activeChat?.id;

  // Clear unread when chat opens AND on every new message in the active chat
  // (the global dm.message handler in useChats bumps unread; this counters it
  // for the chat the user is currently reading).
  React.useEffect(() => {
    if (!activeChatId) return;
    setChatField(activeChatId, { unread: 0 });
  }, [activeChatId, messages.length, setChatField]);

  if (!user) return null;

  function selectChat(id) {
    setActiveId(id);
    if (isMobile) setMobileView('window');
  }

  function startNewDm(peer) {
    const id = `dm:${peer.username}`;
    // If we already have this conversation, just select it.
    if (chats.some((c) => c.id === id)) {
      selectChat(id);
      setQuery('');
      return;
    }
    const fn = peer.first_name || '';
    const ln = peer.last_name || '';
    const name = `${fn} ${ln}`.trim() || peer.username || '?';
    upsertChat({
      id,
      kind: 'direct',
      backendKind: 'dm',
      backendKey: peer.username,
      peer,
      name,
      unread: 0,
      preview: '',
      previewTime: Date.now(),
      previewSelf: false,
    });
    selectChat(id);
    setQuery('');
  }

  function logout() { doLogout(); navigate('/', { replace: true }); }

  return (
    <div className="ll-theme" style={{
      // height (not minHeight) + overflow:hidden so only the two designated
      // scroll areas — chat list (left) and messages thread (right) — scroll.
      // Header, banners, and the input row stay fixed.
      height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf2f8 100%)',
      fontFamily: 'inherit',
    }}>
      <style>{sharedCss}</style>

      <PageTopBar user={user} onHome={() => navigate('/app')} onLogout={logout} />

      {!online && (
        <Banner color="danger">
          <ChatIco.wifiOff width={14} height={14} />
          Нет соединения. Сообщения отправятся при восстановлении.
        </Banner>
      )}
      {online && wsState === 'reconnecting' && (
        <Banner color="warn">
          <ChatIco.rotate width={14} height={14} />
          Переподключаемся…
        </Banner>
      )}
      {threadError?.kind === 'forbidden' && (
        <Banner color="danger">
          <ChatIco.alertCircle width={14} height={14} />
          {threadError.message || 'Нет доступа к этому чату.'}
        </Banner>
      )}

      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', overflow: 'hidden',
        background: 'white',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{
          width: isMobile ? '100%' : 320, flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid var(--line)',
          display: isMobile && mobileView === 'window' ? 'none' : 'flex',
          flexDirection: 'column', minHeight: 0,
          position: 'relative',
        }}>
          <ChatList
            chats={chats}
            activeId={activeId}
            onSelect={selectChat}
            onPickUser={startNewDm}
            variant="full"
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
            loading={chatsLoading}
          />
        </div>

        <div style={{
          flex: 1, minWidth: 0,
          display: isMobile && mobileView === 'list' ? 'none' : 'flex',
          flexDirection: 'column', minHeight: 0,
        }}>
          <ChatWindow
            chat={activeChat}
            messages={messages}
            loading={threadLoading}
            error={threadError}
            templates={templates}
            onAddTemplate={(text) =>
              setTemplates((s) => [...s, { id: `t${Date.now()}`, text }])}
            onSend={(payload) => {
              if (payload.kind !== 'text') return;
              send(payload.text);
            }}
            offline={!online}
            isConnected={isConnected}
            pendingSends={pendingSends}
            wsState={wsState}
            showBack={isMobile}
            onBack={() => setMobileView('list')}
          />
        </div>
      </div>

      {toast && (
        <Toast kind={toast.kind} onClose={() => setToast(null)}>
          {toast.text}
        </Toast>
      )}
    </div>
  );
}

function Banner({ color, children }) {
  const map = {
    danger: { bg: 'oklch(0.97 0.02 25)', fg: 'var(--danger)', bd: 'oklch(0.88 0.07 25)' },
    warn:   { bg: 'oklch(0.97 0.05 85)', fg: 'oklch(0.45 0.13 85)', bd: 'oklch(0.86 0.10 85)' },
  };
  const c = map[color] || map.danger;
  return (
    <div style={{
      flexShrink: 0, padding: '8px 16px',
      background: c.bg, color: c.fg,
      fontSize: 13, fontWeight: 540,
      display: 'flex', alignItems: 'center', gap: 8,
      borderBottom: `1px solid ${c.bd}`,
    }}>
      {children}
    </div>
  );
}

function PageTopBar({ user, onHome, onLogout }) {
  return (
    <header style={{
      flexShrink: 0, height: 60,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 16px',
      background: 'white', borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <button
        onClick={onHome}
        aria-label="На главную"
        style={topbarBtn}
      ><ChatIco.chevronLeft /></button>
      <LumioLogo size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 580, color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}>Сообщения</div>
        <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>
          {user.first_name} · {user.role === 'teacher' ? 'учитель' : 'ученик'}
        </div>
      </div>
      <button
        onClick={onLogout}
        aria-label="Выйти" title="Выйти"
        style={topbarBtn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <path d="M16 17l5-5-5-5M21 12H9"/>
        </svg>
      </button>
    </header>
  );
}

const topbarBtn = {
  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'transparent', color: 'var(--ink-soft)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
