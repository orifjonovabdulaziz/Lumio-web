// Teacher dashboard — main post-auth screen for role=teacher.
import React from 'react';
import { LumioLogo, Button } from '../../ui.jsx';
import { useRouter } from '../../router.jsx';
import { useAuth, logout as doLogout } from '../../lib/auth.js';

// ─── Icon set (lucide-style, inline SVG) ───────────────────────────────────
const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};

const Icon = {
  home: (p) => (<svg {...iconProps} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>),
  calendar: (p) => (<svg {...iconProps} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>),
  users: (p) => (<svg {...iconProps} {...p}><circle cx="9" cy="9" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="8" r="3"/><path d="M17 14a5 5 0 0 1 5 6"/></svg>),
  graduationCap: (p) => (<svg {...iconProps} {...p}><path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4"/><path d="M22 9v5"/></svg>),
  clipboard: (p) => (<svg {...iconProps} {...p}><rect x="7" y="4" width="10" height="18" rx="2"/><path d="M9 4v-.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4"/><path d="M10 10h4M10 14h4M10 18h3"/></svg>),
  wallet: (p) => (<svg {...iconProps} {...p}><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v12a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3"/><path d="M22 11h-5a2 2 0 0 0 0 4h5z"/></svg>),
  book: (p) => (<svg {...iconProps} {...p}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>),
  settings: (p) => (<svg {...iconProps} {...p}><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/><circle cx="12" cy="12" r="3"/></svg>),
  chat: (p) => (<svg {...iconProps} {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/></svg>),
  bell: (p) => (<svg {...iconProps} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>),
  chevronDown: (p) => (<svg {...iconProps} {...p}><path d="M6 9l6 6 6-6"/></svg>),
  chevronLeft: (p) => (<svg {...iconProps} {...p}><path d="M15 18l-6-6 6-6"/></svg>),
  chevronRight: (p) => (<svg {...iconProps} {...p}><path d="M9 6l6 6-6 6"/></svg>),
  plus: (p) => (<svg {...iconProps} {...p}><path d="M12 5v14M5 12h14"/></svg>),
  userPlus: (p) => (<svg {...iconProps} {...p}><circle cx="9" cy="8" r="4"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M19 8v6M16 11h6"/></svg>),
  messageSquarePlus: (p) => (<svg {...iconProps} {...p}><path d="M21 11.5A8.4 8.4 0 0 1 12 20a8.6 8.6 0 0 1-4-1L3 20l1-4A8 8 0 0 1 12 4a8.4 8.4 0 0 1 9 7.5z"/><path d="M12 8v5M9.5 10.5h5"/></svg>),
  fileText: (p) => (<svg {...iconProps} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>),
  playCircle: (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z"/></svg>),
  video: (p) => (<svg {...iconProps} {...p}><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/></svg>),
  clock: (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  check: (p) => (<svg {...iconProps} {...p}><path d="M5 12l5 5L20 7"/></svg>),
  arrowRight: (p) => (<svg {...iconProps} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  trendingUp: (p) => (<svg {...iconProps} {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>),
  sparkles: (p) => (<svg {...iconProps} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>),
  logOut: (p) => (<svg {...iconProps} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>),
  creditCard: (p) => (<svg {...iconProps} {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>),
  shield: (p) => (<svg {...iconProps} {...p}><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/></svg>),
  plug: (p) => (<svg {...iconProps} {...p}><path d="M9 2v6M15 2v6"/><path d="M7 8h10v4a5 5 0 0 1-10 0z"/><path d="M12 17v5"/></svg>),
  userCircle: (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a7 7 0 0 1 11 0"/></svg>),
};

// ─── Mock data ─────────────────────────────────────────────────────────────
const mockToday = [
  { id: 1, title: 'Алгебра · 8 класс', who: 'Марина Иванова', time: '14:00',
    status: 'upcoming', minutesUntil: 15, avatars: [{ name: 'Марина', hue: 210 }],
    materials: [
      { title: 'Квадратные уравнения §3.2', type: 'PDF' },
      { title: 'Разбор задач КР-4', type: 'DOC' },
    ],
  },
  { id: 2, title: 'Физика · группа «Пятница»', who: '3 ученика', time: '15:30',
    status: 'upcoming', minutesUntil: 105,
    avatars: [{ name: 'Алёша', hue: 30 }, { name: 'Даня', hue: 140 }, { name: 'Настя', hue: 310 }] },
  { id: 3, title: 'Геометрия · 9 класс', who: 'Тимур Рашидов', time: '10:00',
    status: 'done', avatars: [{ name: 'Тимур', hue: 260 }] },
  { id: 4, title: 'Математика · подготовка', who: 'Саша Смирнов', time: '18:00',
    status: 'upcoming', minutesUntil: 255, avatars: [{ name: 'Саша', hue: 100 }] },
];

const mockAssignments = [
  { id: 1, title: 'Квадратные уравнения §3.2', student: 'Марина Иванова', due: 'сдано вчера', overdue: true },
  { id: 2, title: 'Задачи на скорость', student: 'Саша Смирнов', due: 'сдано сегодня' },
  { id: 3, title: 'Теорема Пифагора', student: 'Тимур Рашидов', due: 'сдано вчера' },
];

const mockUnpaid = [
  { id: 1, name: 'Марина Иванова', amount: 5000, lessons: 2 },
  { id: 2, name: 'Саша Смирнов', amount: 2500, lessons: 1 },
];

const mockStats = {
  lessons: 18, newStudents: 2, income: 45000, attendance: 94,
};

const mockUnread = { chats: 3, notifications: 5 };

// ─── Component ─────────────────────────────────────────────────────────────
export function TeacherDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [collapsed, setCollapsed] = React.useState(() => {
    try { return localStorage.getItem('lumio.sidebarCollapsed') === '1'; } catch { return false; }
  });
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    try { localStorage.setItem('lumio.sidebarCollapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  React.useEffect(() => {
    function onDown(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    if (menuOpen) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  if (!user) return null;

  function logout() { doLogout(); navigate('/', { replace: true }); }

  const sidebarWidth = collapsed ? 72 : 248;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'oklch(0.985 0.003 260)',
      fontFamily: 'inherit',
    }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onNavRooms={() => navigate('/rooms')}
        width={sidebarWidth}
      />

      <div style={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        marginLeft: sidebarWidth,
        transition: 'margin-left 180ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <TopBar
          user={user}
          unread={mockUnread}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuRef={menuRef}
          onLogout={logout}
        />

        <main style={{
          flex: 1, padding: 'clamp(20px, 3vw, 32px)',
          maxWidth: 1400, width: '100%', margin: '0 auto', boxSizing: 'border-box',
        }}>
          <Greeting user={user} />
          <DashboardGrid onOpenRooms={() => navigate('/rooms')} />
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, onNavRooms, width }) {
  const mainItems = [
    { key: 'home',     label: 'Главная',       icon: Icon.home,          active: true },
    { key: 'calendar', label: 'Расписание',    icon: Icon.calendar,      soon: true },
    { key: 'students', label: 'Ученики',       icon: Icon.users,         soon: true },
    { key: 'rooms',    label: 'Уроки · Комнаты', icon: Icon.graduationCap, onClick: onNavRooms },
    { key: 'tasks',    label: 'Задания',       icon: Icon.clipboard,     soon: true },
    { key: 'finance',  label: 'Финансы',       icon: Icon.wallet,        soon: true },
  ];
  const footerItems = [
    { key: 'library',  label: 'Библиотека',    icon: Icon.book,          soon: true },
    { key: 'settings', label: 'Настройки',     icon: Icon.settings,      soon: true },
  ];

  return (
    <aside style={{
      position: 'fixed', top: 0, bottom: 0, left: 0,
      width, zIndex: 20,
      background: 'white', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 180ms cubic-bezier(.2,.7,.2,1)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 68, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 20px',
        borderBottom: '1px solid var(--line)',
      }}>
        <LumioLogo size={26} showWord={!collapsed} />
        {!collapsed && (
          <button
            onClick={onToggle} aria-label="Свернуть"
            style={sidebarIconBtnStyle}
          ><Icon.chevronLeft /></button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle} aria-label="Развернуть"
          style={{ ...sidebarIconBtnStyle, margin: '10px auto 0' }}
        ><Icon.chevronRight /></button>
      )}

      <nav style={{
        flex: 1, padding: collapsed ? '12px 8px' : '12px 12px',
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
      }}>
        {mainItems.map((it) => <NavItem key={it.key} item={it} collapsed={collapsed} />)}
      </nav>

      <div style={{
        padding: collapsed ? '8px 8px 14px' : '8px 12px 14px',
        borderTop: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {footerItems.map((it) => <NavItem key={it.key} item={it} collapsed={collapsed} />)}
      </div>
    </aside>
  );
}

const sidebarIconBtnStyle = {
  width: 32, height: 32, borderRadius: 8, background: 'transparent',
  border: '1px solid transparent', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--mute)',
};

function NavItem({ item, collapsed }) {
  const { icon: IconCmp, label, active, soon, onClick } = item;
  const disabled = !!soon && !onClick;
  const [hover, setHover] = React.useState(false);

  const bg = active
    ? 'var(--primary-soft)'
    : hover && !disabled ? 'oklch(0.96 0.004 260)' : 'transparent';
  const color = active ? 'var(--primary-soft-ink)' : 'var(--ink)';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: collapsed ? '10px' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: bg, color,
        border: 'none', borderRadius: 10,
        fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 560 : 500,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        textAlign: 'left', width: '100%',
        transition: 'background-color 120ms',
      }}
    >
      <IconCmp />
      {!collapsed && (
        <>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          {soon && (
            <span style={{
              fontSize: 10.5, fontWeight: 540, padding: '2px 6px', borderRadius: 999,
              background: 'oklch(0.96 0.004 260)', color: 'var(--mute)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>скоро</span>
          )}
        </>
      )}
    </button>
  );
}

// ─── Top bar ───────────────────────────────────────────────────────────────
function TopBar({ user, unread, menuOpen, setMenuOpen, menuRef, onLogout }) {
  // Tariff — mock (would come from /auth/me/ in real impl)
  const tier = 'pro';

  return (
    <header style={{
      height: 68, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: 10, padding: '0 clamp(16px, 3vw, 28px)',
      background: 'white', borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, zIndex: 15,
    }}>
      <IconActionButton label="Чат" count={unread.chats}><Icon.chat /></IconActionButton>
      <IconActionButton label="Уведомления" count={unread.notifications}><Icon.bell /></IconActionButton>

      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 10px 6px 6px', borderRadius: 999,
            background: menuOpen ? 'oklch(0.96 0.004 260)' : 'transparent',
            border: '1px solid var(--line)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background-color 120ms',
          }}
        >
          <LetterAvatar name={user.first_name} size={32} />
          <div style={{ textAlign: 'left', display: 'none' }} className="lumio-topbar-username">
            <div style={{ fontSize: 13.5, fontWeight: 560, color: 'var(--ink)' }}>
              {user.first_name}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>@{user.username}</div>
          </div>
          <TierBadge tier={tier} />
          <Icon.chevronDown width={14} height={14} />
        </button>

        {menuOpen && (
          <UserMenu user={user} onLogout={onLogout} onClose={() => setMenuOpen(false)} />
        )}
      </div>

      <style>{`
        @media (min-width: 720px) { .lumio-topbar-username { display: block !important; } }
      `}</style>
    </header>
  );
}

function IconActionButton({ children, label, count }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      aria-label={label} title={label}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', width: 40, height: 40, borderRadius: 10,
        background: hover ? 'oklch(0.96 0.004 260)' : 'transparent',
        border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-soft)',
        transition: 'background-color 120ms',
      }}
    >
      {children}
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

function TierBadge({ tier }) {
  const map = {
    free:     { label: 'Free',     bg: 'oklch(0.95 0.004 260)', fg: 'var(--mute)' },
    pro:      { label: 'Pro',      bg: 'linear-gradient(135deg, oklch(0.62 0.17 260), oklch(0.55 0.20 250))', fg: 'white' },
    business: { label: 'Business', bg: 'linear-gradient(135deg, oklch(0.80 0.15 85), oklch(0.68 0.17 60))', fg: 'white' },
  };
  const t = map[tier] || map.free;
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 620, padding: '3px 8px', borderRadius: 6,
      background: t.bg, color: t.fg, letterSpacing: '0.02em',
    }}>{t.label}</span>
  );
}

function UserMenu({ user, onLogout, onClose }) {
  const items = [
    { key: 'profile',      label: 'Мой профиль',  icon: Icon.userCircle },
    { key: 'subscription', label: 'Подписка',     icon: Icon.creditCard },
    { key: 'notifs',       label: 'Уведомления',  icon: Icon.bell },
    { key: 'security',     label: 'Безопасность', icon: Icon.shield },
    { key: 'integrations', label: 'Интеграции',   icon: Icon.plug },
  ];
  return (
    <div role="menu" style={{
      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
      minWidth: 240, background: 'white',
      border: '1px solid var(--line-strong)', borderRadius: 14,
      boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
      padding: 6, zIndex: 30,
    }}>
      <div style={{ padding: '10px 12px 6px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 580, color: 'var(--ink)' }}>
          {user.first_name} {user.last_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--mute)' }}>{user.email}</div>
      </div>
      <div style={{ height: 1, background: 'var(--line)', margin: '4px 4px 6px' }} />
      {items.map((it) => (
        <MenuItem key={it.key} label={it.label} IconCmp={it.icon} onClick={onClose} />
      ))}
      <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
      <MenuItem label="Выйти" IconCmp={Icon.logOut} danger onClick={() => { onClose(); onLogout(); }} />
    </div>
  );
}

function MenuItem({ label, IconCmp, onClick, danger }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 10px', borderRadius: 8,
        background: hover ? 'oklch(0.96 0.004 260)' : 'transparent',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13.5, color: danger ? 'oklch(0.55 0.18 25)' : 'var(--ink)',
        textAlign: 'left',
      }}
    >
      <IconCmp />
      <span>{label}</span>
    </button>
  );
}

// ─── Greeting ──────────────────────────────────────────────────────────────
function Greeting({ user }) {
  const h = new Date().getHours();
  const word = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';

  const upcomingCount = mockToday.filter((l) => l.status === 'upcoming').length;
  const pendingCount = mockAssignments.length;
  const unpaidCount = mockUnpaid.length;

  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{
        margin: 0, fontSize: 'clamp(26px, 3.2vw, 34px)', fontWeight: 620,
        letterSpacing: '-0.025em', color: 'var(--ink)',
      }}>
        {word}, {user.first_name} <span aria-hidden="true">👋</span>
      </h1>
      <p style={{
        margin: '8px 0 0', fontSize: 15, color: 'var(--mute)',
        lineHeight: 1.55, maxWidth: 720,
      }}>
        Сегодня у вас <strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{upcomingCount} {pluralLessons(upcomingCount)}</strong>,{' '}
        <strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{pendingCount} {pluralPending(pendingCount)}</strong> и{' '}
        <strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{unpaidCount} {pluralUnpaid(unpaidCount)}</strong>.
      </p>
    </div>
  );
}

// ─── Widget grid ───────────────────────────────────────────────────────────
function DashboardGrid({ onOpenRooms }) {
  return (
    <>
      <div className="lumio-dash-grid" style={{
        display: 'grid', gap: 20,
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      }}>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }} className="lumio-span-2">
          <NextLessonWidget onEnter={onOpenRooms} />
        </div>

        <div style={{ minWidth: 0 }}>
          <TodayScheduleWidget />
        </div>

        <div style={{ minWidth: 0 }}>
          <AssignmentsWidget />
        </div>

        <div style={{ minWidth: 0 }}>
          <UnpaidWidget />
        </div>

        <div style={{ minWidth: 0 }}>
          <WeekStatsWidget />
        </div>

        <div style={{ gridColumn: 'span 3', minWidth: 0 }} className="lumio-span-3">
          <QuickActionsWidget onNewLesson={onOpenRooms} />
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .lumio-dash-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .lumio-dash-grid .lumio-span-2 { grid-column: span 2 !important; }
          .lumio-dash-grid .lumio-span-3 { grid-column: span 2 !important; }
        }
        @media (max-width: 720px) {
          .lumio-dash-grid { grid-template-columns: 1fr !important; }
          .lumio-dash-grid .lumio-span-2,
          .lumio-dash-grid .lumio-span-3 { grid-column: span 1 !important; }
        }
      `}</style>
    </>
  );
}

// ─── Shared card ───────────────────────────────────────────────────────────
function WidgetCard({ children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: 'white', borderRadius: 18,
        border: '1px solid var(--line)',
        padding: 22,
        boxShadow: hover
          ? '0 8px 24px -10px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.04)'
          : '0 1px 2px rgba(15,23,42,0.04)',
        transition: 'box-shadow 160ms, transform 160ms',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        height: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function WidgetHeader({ title, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14, gap: 10,
    }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 580, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {right}
    </div>
  );
}

// ─── Widget 1: Next lesson ─────────────────────────────────────────────────
function NextLessonWidget({ onEnter }) {
  const next = mockToday.find((l) => l.status === 'upcoming');
  if (!next) {
    return (
      <WidgetCard>
        <WidgetHeader title="Ближайший урок" />
        <EmptyState
          title="На сегодня всё"
          body="Уроков больше нет. Отдыхайте или запланируйте новый."
          action={<Button size="sm" onClick={onEnter}>Запланировать</Button>}
        />
      </WidgetCard>
    );
  }

  const startsLabel = next.minutesUntil < 60
    ? `Через ${next.minutesUntil} ${pluralMinutes(next.minutesUntil)}`
    : `Через ${Math.floor(next.minutesUntil / 60)} ч ${next.minutesUntil % 60} мин`;

  return (
    <WidgetCard style={{ background: 'linear-gradient(135deg, var(--primary-soft), white 80%)' }}>
      <WidgetHeader
        title="Ближайший урок"
        right={
          <span style={{
            fontSize: 11, fontWeight: 560, padding: '3px 9px', borderRadius: 999,
            background: 'var(--primary)', color: 'white', letterSpacing: '0.02em',
          }}>LIVE через {next.minutesUntil} мин</span>
        }
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 620, color: 'var(--ink)',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {next.title}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 10,
          }}>
            <AvatarStack avatars={next.avatars} />
            <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{next.who}</span>
            <span style={{ color: 'var(--line-strong)' }}>·</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 14, color: 'var(--ink-soft)',
            }}>
              <Icon.clock width={14} height={14} /> {next.time}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap', marginTop: 'auto',
        }}>
          <div style={{ fontSize: 14, fontWeight: 560, color: 'var(--primary-ink)' }}>
            {startsLabel}
          </div>
          <Button onClick={onEnter} size="lg"
            leftIcon={<Icon.video width={16} height={16} />}>
            Войти в урок
          </Button>
        </div>

        {next.materials?.length > 0 && (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            paddingTop: 12, borderTop: '1px solid var(--line)',
          }}>
            <div style={{
              fontSize: 11.5, fontWeight: 540, color: 'var(--mute)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              width: '100%', marginBottom: 4,
            }}>
              Материалы урока
            </div>
            {next.materials.map((m, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 8,
                background: 'white', border: '1px solid var(--line)',
                fontSize: 12.5, color: 'var(--ink-soft)',
              }}>
                <Icon.fileText width={13} height={13} />
                {m.title}
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                  background: 'oklch(0.96 0.004 260)', color: 'var(--mute)',
                }}>{m.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

// ─── Widget 2: Today schedule ──────────────────────────────────────────────
function TodayScheduleWidget() {
  return (
    <WidgetCard>
      <WidgetHeader
        title="Сегодня"
        right={<LinkButton>Календарь <Icon.arrowRight width={14} height={14} /></LinkButton>}
      />
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {mockToday.map((l) => (
          <li key={l.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 10,
            background: 'oklch(0.985 0.003 260)',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 560, color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums', width: 44,
            }}>{l.time}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 540, color: 'var(--ink)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{l.title}</div>
              <div style={{
                fontSize: 11.5, color: 'var(--mute)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{l.who}</div>
            </div>
            <StatusPill status={l.status} />
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

function StatusPill({ status }) {
  const map = {
    upcoming: { label: 'предстоит', bg: 'var(--primary-soft)',           fg: 'var(--primary-soft-ink)' },
    live:     { label: 'идёт',      bg: 'oklch(0.94 0.08 25)',           fg: 'oklch(0.45 0.18 25)' },
    done:     { label: 'завершён',  bg: 'oklch(0.96 0.004 260)',         fg: 'var(--mute)' },
  };
  const s = map[status] || map.upcoming;
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 560, padding: '3px 8px', borderRadius: 999,
      background: s.bg, color: s.fg, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// ─── Widget 3: Assignments ─────────────────────────────────────────────────
function AssignmentsWidget() {
  return (
    <WidgetCard>
      <WidgetHeader
        title="На проверку"
        right={<LinkButton>Все <Icon.arrowRight width={14} height={14} /></LinkButton>}
      />
      {mockAssignments.length === 0 ? (
        <EmptyState title="Всё проверено" body="Новых заданий на проверке нет." tone="mute" />
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {mockAssignments.map((a) => (
            <li key={a.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px', borderRadius: 10, background: 'oklch(0.985 0.003 260)',
            }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon.fileText width={15} height={15} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 540, color: 'var(--ink)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{a.title}</div>
                <div style={{
                  fontSize: 11.5, color: 'var(--mute)', marginTop: 2,
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.student}
                  </span>
                  <span>·</span>
                  <span style={{ color: a.overdue ? 'oklch(0.55 0.18 25)' : 'var(--mute)' }}>
                    {a.due}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

// ─── Widget 4: Unpaid ──────────────────────────────────────────────────────
function UnpaidWidget() {
  const total = mockUnpaid.reduce((s, u) => s + u.amount, 0);
  return (
    <WidgetCard>
      <WidgetHeader
        title="Неоплаченные уроки"
        right={
          <span style={{
            fontSize: 13, fontWeight: 620, color: 'oklch(0.55 0.18 25)',
            fontVariantNumeric: 'tabular-nums',
          }}>{formatMoney(total)}</span>
        }
      />
      {mockUnpaid.length === 0 ? (
        <EmptyState title="Все оплачено" body="Задолженностей нет." tone="success" />
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {mockUnpaid.map((u) => (
            <li key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px', borderRadius: 10, background: 'oklch(0.985 0.003 260)',
            }}>
              <LetterAvatar name={u.name} size={32} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 540, color: 'var(--ink)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                  {u.lessons} {pluralLessons(u.lessons)} · {formatMoney(u.amount)}
                </div>
              </div>
              <button style={pillBtnStyle}>Напомнить</button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

const pillBtnStyle = {
  fontFamily: 'inherit', fontSize: 12, fontWeight: 540,
  padding: '5px 10px', borderRadius: 999,
  background: 'white', color: 'var(--ink)',
  border: '1px solid var(--line-strong)', cursor: 'pointer',
};

// ─── Widget 5: Week stats ──────────────────────────────────────────────────
function WeekStatsWidget() {
  const s = mockStats;
  const items = [
    { label: 'Проведено уроков', value: s.lessons,          accent: false },
    { label: 'Новые ученики',    value: `+${s.newStudents}`, accent: true },
    { label: 'Доход',            value: formatMoney(s.income), accent: false },
    { label: 'Посещаемость',     value: `${s.attendance}%`,  accent: false },
  ];
  return (
    <WidgetCard>
      <WidgetHeader
        title="Неделя"
        right={
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11.5, fontWeight: 560, color: 'oklch(0.52 0.14 155)',
            padding: '3px 8px', borderRadius: 999, background: 'oklch(0.94 0.05 155)',
          }}>
            <Icon.trendingUp width={12} height={12} /> +12%
          </span>
        }
      />
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1,
      }}>
        {items.map((it) => (
          <div key={it.label} style={{
            padding: 12, borderRadius: 12, background: 'oklch(0.985 0.003 260)',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 540, color: 'var(--mute)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
            }}>{it.label}</div>
            <div style={{
              fontSize: 20, fontWeight: 620, color: it.accent ? 'var(--primary-ink)' : 'var(--ink)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>{it.value}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

// ─── Widget 6: Quick actions ───────────────────────────────────────────────
function QuickActionsWidget({ onNewLesson }) {
  const actions = [
    { key: 'lesson',   label: 'Новый урок',       icon: Icon.plus,              onClick: onNewLesson },
    { key: 'student',  label: 'Добавить ученика', icon: Icon.userPlus,          onClick: () => {} },
    { key: 'task',     label: 'Создать задание',  icon: Icon.fileText,          onClick: () => {} },
    { key: 'message',  label: 'Написать сообщение', icon: Icon.messageSquarePlus, onClick: () => {} },
  ];
  return (
    <WidgetCard>
      <WidgetHeader title="Быстрые действия" />
      <div style={{
        display: 'grid', gap: 10,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        flex: 1,
      }}>
        {actions.map((a) => <ActionTile key={a.key} {...a} />)}
      </div>
    </WidgetCard>
  );
}

function ActionTile({ label, icon: IconCmp, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 12,
        background: hover ? 'var(--primary-soft)' : 'oklch(0.985 0.003 260)',
        border: '1px solid',
        borderColor: hover ? 'var(--primary-edge)' : 'var(--line)',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        color: hover ? 'var(--primary-soft-ink)' : 'var(--ink)',
        transition: 'background-color 140ms, border-color 140ms, color 140ms, transform 140ms',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: 10,
        background: hover ? 'white' : 'var(--primary-soft)',
        color: 'var(--primary-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}><IconCmp /></span>
      <span style={{ fontSize: 14, fontWeight: 560 }}>{label}</span>
    </button>
  );
}

// ─── Misc helpers ──────────────────────────────────────────────────────────
function EmptyState({ title, body, action, tone = 'neutral' }) {
  const accents = {
    neutral: { bg: 'oklch(0.96 0.004 260)', fg: 'var(--mute)' },
    success: { bg: 'oklch(0.94 0.05 155)', fg: 'oklch(0.45 0.14 155)' },
    mute:    { bg: 'oklch(0.96 0.004 260)', fg: 'var(--mute)' },
  };
  const a = accents[tone] || accents.neutral;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '24px 12px', gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: a.bg, color: a.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon.sparkles /></div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 580, color: 'var(--ink)' }}>{title}</div>
        {body && <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>{body}</div>}
      </div>
      {action}
    </div>
  );
}

function LinkButton({ children, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 8, background: 'transparent',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 12.5, fontWeight: 540,
        color: hover ? 'var(--primary-ink)' : 'var(--mute)',
        transition: 'color 120ms',
      }}
    >{children}</button>
  );
}

function AvatarStack({ avatars }) {
  return (
    <div style={{ display: 'inline-flex' }}>
      {avatars.slice(0, 3).map((a, i) => (
        <div key={i} style={{
          width: 26, height: 26, borderRadius: '50%',
          marginLeft: i === 0 ? 0 : -8,
          background: `oklch(0.86 0.08 ${a.hue})`, color: `oklch(0.32 0.14 ${a.hue})`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 11, border: '2px solid white',
        }}>
          {a.name[0]?.toUpperCase()}
        </div>
      ))}
      {avatars.length > 3 && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', marginLeft: -8,
          background: 'oklch(0.94 0.004 260)', color: 'var(--mute)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 10.5, border: '2px solid white',
        }}>
          +{avatars.length - 3}
        </div>
      )}
    </div>
  );
}

function LetterAvatar({ name, size = 32 }) {
  const hue = Array.from(name || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `oklch(0.86 0.08 ${hue})`, color: `oklch(0.32 0.14 ${hue})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.42, flexShrink: 0,
    }}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );
}

function formatMoney(n) {
  return `${new Intl.NumberFormat('ru-RU').format(n)} ₽`;
}

function pluralLessons(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'урок';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'урока';
  return 'уроков';
}
function pluralPending(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'непроверенная работа';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'непроверенные работы';
  return 'непроверенных работ';
}
function pluralUnpaid(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'неоплаченный урок';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'неоплаченных урока';
  return 'неоплаченных уроков';
}
function pluralMinutes(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'минуту';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'минуты';
  return 'минут';
}
