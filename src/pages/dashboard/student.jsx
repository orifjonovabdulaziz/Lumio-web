// Student dashboard — main post-auth screen for role=student.
// Mirrors the teacher dashboard shell (sidebar + topbar + widget grid)
// but with a warmer tone and student-flavored widgets:
//  - Next lesson countdown with a live "Войти в урок" CTA
//  - Active assignments with deadline urgency
//  - Week schedule strip
//  - Progress / streak / achievements (light gamification)
//  - My teachers (with chat shortcut)
//  - Lesson balance
import React from 'react';
import { LumioLogo, Button } from '../../ui.jsx';
import { useRouter } from '../../router.jsx';
import { useAuth, logout as doLogout } from '../../lib/auth.js';
import { ChatTrigger } from '../chat/popover.jsx';
import { useChats } from '../chat/hooks.js';

// ─── Icon set (lucide-style, inline SVG) ───────────────────────────────────
const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};

const Icon = {
  home: (p) => (<svg {...iconProps} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>),
  calendar: (p) => (<svg {...iconProps} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>),
  graduationCap: (p) => (<svg {...iconProps} {...p}><path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4"/><path d="M22 9v5"/></svg>),
  clipboard: (p) => (<svg {...iconProps} {...p}><rect x="7" y="4" width="10" height="18" rx="2"/><path d="M9 4v-.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4"/><path d="M10 10h4M10 14h4M10 18h3"/></svg>),
  trophy: (p) => (<svg {...iconProps} {...p}><path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v3a3 3 0 0 0 3 3M17 6h3v3a3 3 0 0 1-3 3"/></svg>),
  wallet: (p) => (<svg {...iconProps} {...p}><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v12a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3"/><path d="M22 11h-5a2 2 0 0 0 0 4h5z"/></svg>),
  book: (p) => (<svg {...iconProps} {...p}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>),
  settings: (p) => (<svg {...iconProps} {...p}><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/><circle cx="12" cy="12" r="3"/></svg>),
  bell: (p) => (<svg {...iconProps} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>),
  chevronDown: (p) => (<svg {...iconProps} {...p}><path d="M6 9l6 6 6-6"/></svg>),
  chevronLeft: (p) => (<svg {...iconProps} {...p}><path d="M15 18l-6-6 6-6"/></svg>),
  chevronRight: (p) => (<svg {...iconProps} {...p}><path d="M9 6l6 6-6 6"/></svg>),
  fileText: (p) => (<svg {...iconProps} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>),
  video: (p) => (<svg {...iconProps} {...p}><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/></svg>),
  clock: (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  arrowRight: (p) => (<svg {...iconProps} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  flame: (p) => (<svg {...iconProps} {...p}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-6 0 0-1 2-3 2 0-3-2-5-3-7-1 4-5 5-5 11a7 7 0 0 0 7 7z"/></svg>),
  sparkles: (p) => (<svg {...iconProps} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>),
  logOut: (p) => (<svg {...iconProps} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>),
  creditCard: (p) => (<svg {...iconProps} {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>),
  shield: (p) => (<svg {...iconProps} {...p}><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/></svg>),
  userCircle: (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a7 7 0 0 1 11 0"/></svg>),
  message: (p) => (<svg {...iconProps} {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/></svg>),
  check: (p) => (<svg {...iconProps} {...p}><path d="M5 12l5 5L20 7"/></svg>),
  star: (p) => (<svg {...iconProps} {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l6.9-1z"/></svg>),
  medal: (p) => (<svg {...iconProps} {...p}><path d="m7.2 11-3.7-7.4A1 1 0 0 1 4.4 2h4.2a1 1 0 0 1 .9.6L13 11"/><path d="m16.8 11 3.7-7.4A1 1 0 0 0 19.6 2h-4.2a1 1 0 0 0-.9.6L11 11"/><circle cx="12" cy="17" r="5"/></svg>),
  target: (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>),
};

// ─── Mock data ─────────────────────────────────────────────────────────────
// Lessons across the week (today + upcoming). Times relative to "now".
const mockLessons = [
  { id: 1, subject: 'Английский язык', topic: 'Past Perfect и Past Simple',
    teacher: 'Елена Воронина', teacherHue: 280, date: 'today', time: '18:00',
    minutesUntil: 35, status: 'upcoming',
    materials: [
      { title: 'Презентация Past Perfect', type: 'PDF' },
      { title: 'Упражнения Unit 7', type: 'DOC' },
    ],
  },
  { id: 2, subject: 'Математика', topic: 'Системы уравнений',
    teacher: 'Игорь Седов', teacherHue: 210, date: 'today', time: '20:00',
    minutesUntil: 155, status: 'upcoming' },
  { id: 3, subject: 'Физика', topic: 'Электромагнитная индукция',
    teacher: 'Анна Громова', teacherHue: 140, date: 'tomorrow', time: '17:30',
    status: 'upcoming' },
  { id: 4, subject: 'Английский язык', topic: 'Speaking practice',
    teacher: 'Елена Воронина', teacherHue: 280, date: 'wed', time: '18:00',
    status: 'upcoming' },
  { id: 5, subject: 'Математика', topic: 'Подготовка к КР',
    teacher: 'Игорь Седов', teacherHue: 210, date: 'fri', time: '19:00',
    status: 'upcoming' },
];

// Active assignments. `dueIn` = days from today; negative = overdue, 0 = today.
const mockAssignments = [
  { id: 1, title: 'Эссе «My favorite book»', subject: 'Английский', subjectHue: 280,
    dueIn: 0, dueLabel: 'сегодня до 22:00', progress: 0.4 },
  { id: 2, title: 'Задачи §5.3, №1–12', subject: 'Математика', subjectHue: 210,
    dueIn: 1, dueLabel: 'завтра' },
  { id: 3, title: 'Лабораторная: маятник', subject: 'Физика', subjectHue: 140,
    dueIn: 4, dueLabel: 'через 4 дня' },
];

// "My teachers" — small set with subject + lessons-completed.
const mockTeachers = [
  { id: 'eVoronina', name: 'Елена Воронина', subject: 'Английский язык', hue: 280, lessons: 24, online: true },
  { id: 'iSedov', name: 'Игорь Седов', subject: 'Математика', hue: 210, lessons: 16, online: false },
  { id: 'aGromova', name: 'Анна Громова', subject: 'Физика', hue: 140, lessons: 8, online: true },
];

// Achievements — a few earned, a couple in progress.
const mockAchievements = [
  { id: 'first10', label: 'Первые 10 уроков', icon: Icon.medal, earned: true },
  { id: 'streak7', label: '7 дней подряд', icon: Icon.flame, earned: true },
  { id: 'hwStreak5', label: '5 домашек подряд', icon: Icon.check, earned: true },
  { id: 'first50', label: '50 уроков', icon: Icon.trophy, earned: false, progress: 0.96 },
];

const mockProgress = {
  totalLessons: 48, // earned
  streakDays: 7,
  level: 'Старательный',
  nextLevel: 'Эксперт',
  toNextLevel: 0.74,
};

const mockBalance = { remaining: 8, total: 10, nextPaymentDate: '5 мая' };

const mockNotifications = 3;

const DAY_LABELS = {
  today: 'Сегодня', tomorrow: 'Завтра', wed: 'Среда', thu: 'Четверг', fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье',
};
const WEEK_DAYS = [
  { key: 'today',    short: 'Пн', date: 27 },
  { key: 'tomorrow', short: 'Вт', date: 28 },
  { key: 'wed',      short: 'Ср', date: 29 },
  { key: 'thu',      short: 'Чт', date: 30 },
  { key: 'fri',      short: 'Пт', date: 1  },
  { key: 'sat',      short: 'Сб', date: 2  },
  { key: 'sun',      short: 'Вс', date: 3  },
];

// ─── Component ─────────────────────────────────────────────────────────────
export function StudentDashboard() {
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

  // Real unread counter for the chat icon — same pattern as the teacher dashboard.
  // prefetchPreviews=false: we only need totals, not per-room previews.
  const { chats } = useChats({
    enabled: !!user,
    meId: user?.id,
    prefetchPreviews: false,
  });
  const unreadChats = React.useMemo(
    () => chats.reduce((sum, c) => sum + (c.unread || 0), 0),
    [chats],
  );

  if (!user) return null;

  function logout() { doLogout(); navigate('/', { replace: true }); }

  const sidebarWidth = collapsed ? 72 : 248;

  return (
    <div className="ll-theme" style={{
      minHeight: '100vh', display: 'flex',
      // Slightly warmer / more playful gradient than the teacher dashboard.
      background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 50%, #ecfeff 100%)',
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
          unread={{ chats: unreadChats, notifications: mockNotifications }}
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
          <DashboardGrid
            onEnterLesson={() => navigate('/rooms')}
            onOpenChat={() => navigate('/chat')}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, onNavRooms, width }) {
  const mainItems = [
    { key: 'home',     label: 'Главная',     icon: Icon.home,          active: true },
    { key: 'schedule', label: 'Расписание',  icon: Icon.calendar,      soon: true },
    { key: 'lessons',  label: 'Мои уроки',   icon: Icon.graduationCap, onClick: onNavRooms },
    { key: 'tasks',    label: 'Задания',     icon: Icon.clipboard,     soon: true },
    { key: 'progress', label: 'Прогресс',    icon: Icon.trophy,        soon: true },
    { key: 'payments', label: 'Оплаты',      icon: Icon.wallet,        soon: true },
  ];
  const footerItems = [
    { key: 'library',  label: 'Материалы',   icon: Icon.book,          soon: true },
    { key: 'settings', label: 'Настройки',   icon: Icon.settings,      soon: true },
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
        flex: 1, minHeight: 0, padding: collapsed ? '12px 8px' : '12px 12px',
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
  return (
    <header style={{
      height: 68, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: 10, padding: '0 clamp(16px, 3vw, 28px)',
      background: 'white', borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, zIndex: 15,
    }}>
      <ChatTrigger unread={unread.chats} />
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
          <LevelBadge level={mockProgress.level} />
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

function LevelBadge({ level }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 620, padding: '3px 8px', borderRadius: 6,
      background: 'linear-gradient(135deg, oklch(0.78 0.14 65), oklch(0.68 0.16 50))',
      color: 'white', letterSpacing: '0.02em',
    }}>{level}</span>
  );
}

function UserMenu({ user, onLogout, onClose }) {
  const items = [
    { key: 'profile',  label: 'Мой профиль',  icon: Icon.userCircle },
    { key: 'progress', label: 'Прогресс',     icon: Icon.trophy },
    { key: 'payments', label: 'Оплаты',       icon: Icon.creditCard },
    { key: 'notifs',   label: 'Уведомления',  icon: Icon.bell },
    { key: 'security', label: 'Безопасность', icon: Icon.shield },
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

  // Pick the most "actionable" message based on what's happening today.
  const next = mockLessons.find((l) => l.date === 'today' && l.status === 'upcoming');
  const burning = mockAssignments.find((a) => a.dueIn <= 0);

  let subline;
  if (next && next.minutesUntil <= 60) {
    subline = (
      <>Урок по{' '}<strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{next.subject.toLowerCase()}</strong>{' '}
      <strong style={{ color: 'var(--ink)', fontWeight: 560 }}>через {next.minutesUntil} {pluralMinutes(next.minutesUntil)}</strong>.{' '}
      Готовитесь?</>
    );
  } else if (burning) {
    subline = (
      <>Не забудьте сдать «<strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{burning.title}</strong>» — {burning.dueLabel}.</>
    );
  } else if (next) {
    subline = (
      <>Сегодня урок по{' '}<strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{next.subject.toLowerCase()}</strong>{' '}
      в <strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{next.time}</strong>.</>
    );
  } else {
    subline = <>На сегодня уроков нет — отличный день, чтобы повторить пройденное <span aria-hidden="true">📚</span></>;
  }

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
        {subline}
      </p>
    </div>
  );
}

// ─── Widget grid ───────────────────────────────────────────────────────────
function DashboardGrid({ onEnterLesson, onOpenChat }) {
  return (
    <>
      <div className="lumio-dash-grid" style={{
        display: 'grid', gap: 20,
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      }}>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }} className="lumio-span-2">
          <NextLessonWidget onEnter={onEnterLesson} />
        </div>

        <div style={{ minWidth: 0 }}>
          <ProgressWidget />
        </div>

        <div style={{ gridColumn: 'span 2', minWidth: 0 }} className="lumio-span-2">
          <WeekScheduleWidget onEnter={onEnterLesson} />
        </div>

        <div style={{ minWidth: 0 }}>
          <BalanceWidget />
        </div>

        <div style={{ minWidth: 0 }}>
          <AssignmentsWidget />
        </div>

        <div style={{ gridColumn: 'span 2', minWidth: 0 }} className="lumio-span-2">
          <TeachersWidget onWriteTeacher={onOpenChat} />
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
        @keyframes lumio-pulse-dot {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.45; }
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
        background: 'white', borderRadius: 20,
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

// ─── Widget: Next lesson ───────────────────────────────────────────────────
function NextLessonWidget({ onEnter }) {
  const next = mockLessons.find((l) => l.date === 'today' && l.status === 'upcoming');

  if (!next) {
    return (
      <WidgetCard>
        <WidgetHeader title="Ближайший урок" />
        <EmptyState
          title="На сегодня уроков нет"
          body="Хороший день, чтобы повторить материал и сдать домашку."
        />
      </WidgetCard>
    );
  }

  const live = next.minutesUntil <= 0;
  const enterable = next.minutesUntil <= 10;

  const startsLabel = live
    ? 'Идёт прямо сейчас'
    : next.minutesUntil < 60
      ? `Через ${next.minutesUntil} ${pluralMinutes(next.minutesUntil)}`
      : `Через ${Math.floor(next.minutesUntil / 60)} ч ${next.minutesUntil % 60} мин`;

  return (
    <WidgetCard style={{
      background: live
        ? 'linear-gradient(135deg, oklch(0.94 0.06 155), white 80%)'
        : 'linear-gradient(135deg, var(--primary-soft), white 80%)',
    }}>
      <WidgetHeader
        title="Ближайший урок"
        right={
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 560, padding: '3px 9px', borderRadius: 999,
            background: live ? 'oklch(0.62 0.13 155)' : 'var(--primary)',
            color: 'white', letterSpacing: '0.02em',
          }}>
            {live && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'white',
                animation: 'lumio-pulse-dot 1.4s ease-in-out infinite',
              }} />
            )}
            {live ? 'УРОК ИДЁТ' : `LIVE через ${next.minutesUntil} мин`}
          </span>
        }
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 540, color: 'var(--primary-soft-ink)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
          }}>{next.subject}</div>
          <div style={{
            fontSize: 22, fontWeight: 620, color: 'var(--ink)',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {next.topic}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
          }}>
            <LetterAvatar name={next.teacher} size={28} hue={next.teacherHue} />
            <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{next.teacher}</span>
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
          <div style={{
            fontSize: 14, fontWeight: 560,
            color: live ? 'oklch(0.42 0.14 155)' : 'var(--primary-ink)',
          }}>
            {startsLabel}
          </div>
          <Button
            onClick={onEnter}
            size="lg"
            variant={enterable ? 'gradient' : 'soft'}
            disabled={!enterable && !live}
            leftIcon={<Icon.video width={16} height={16} />}
          >
            {enterable ? 'Войти в урок' : 'Подготовиться'}
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
              Материалы к уроку
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

// ─── Widget: Progress / streak / achievements ──────────────────────────────
function ProgressWidget() {
  const p = mockProgress;
  const earned = mockAchievements.filter((a) => a.earned);
  const inProgress = mockAchievements.find((a) => !a.earned);

  return (
    <WidgetCard>
      <WidgetHeader
        title="Мой прогресс"
        right={<LinkButton>Подробнее <Icon.arrowRight width={14} height={14} /></LinkButton>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* Streak — the headliner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, oklch(0.96 0.07 65), oklch(0.97 0.04 30))',
          border: '1px solid oklch(0.90 0.07 65)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, oklch(0.72 0.16 50), oklch(0.66 0.18 30))',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}><Icon.flame width={22} height={22} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 22, fontWeight: 620, color: 'oklch(0.35 0.14 40)',
              letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {p.streakDays} {pluralDays(p.streakDays)}
            </div>
            <div style={{ fontSize: 12, color: 'oklch(0.45 0.10 40)', marginTop: 3 }}>
              Серия подряд — не теряйте!
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>
              До уровня <strong style={{ color: 'var(--ink)', fontWeight: 560 }}>{p.nextLevel}</strong>
            </span>
            <span style={{
              fontSize: 12, fontWeight: 580, color: 'var(--primary-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}>{Math.round(p.toNextLevel * 100)}%</span>
          </div>
          <div style={{
            height: 8, borderRadius: 999, background: 'oklch(0.96 0.004 260)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${p.toNextLevel * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--primary), oklch(0.66 0.16 280))',
              borderRadius: 999, transition: 'width 360ms cubic-bezier(.2,.7,.2,1)',
            }} />
          </div>
        </div>

        {/* Achievements row */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            fontSize: 11.5, fontWeight: 540, color: 'var(--mute)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>Достижения</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {earned.slice(0, 3).map((a) => <AchievementChip key={a.id} a={a} />)}
            {inProgress && <AchievementChip a={inProgress} />}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

function AchievementChip({ a }) {
  const Ico = a.icon;
  return (
    <div title={a.label} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px 5px 6px', borderRadius: 999,
      background: a.earned ? 'oklch(0.95 0.06 75)' : 'oklch(0.96 0.004 260)',
      color: a.earned ? 'oklch(0.45 0.13 65)' : 'var(--mute)',
      border: `1px solid ${a.earned ? 'oklch(0.88 0.08 75)' : 'var(--line)'}`,
      fontSize: 12, fontWeight: 540,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: a.earned ? 'white' : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><Ico width={13} height={13} /></span>
      <span style={{ whiteSpace: 'nowrap' }}>{a.label}</span>
      {!a.earned && a.progress != null && (
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
          {Math.round(a.progress * 100)}%
        </span>
      )}
    </div>
  );
}

// ─── Widget: Week schedule ─────────────────────────────────────────────────
function WeekScheduleWidget({ onEnter }) {
  const [activeKey, setActiveKey] = React.useState('today');
  const dayLessons = mockLessons.filter((l) => l.date === activeKey);

  return (
    <WidgetCard>
      <WidgetHeader
        title="Эта неделя"
        right={<LinkButton>Календарь <Icon.arrowRight width={14} height={14} /></LinkButton>}
      />

      {/* Day strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 14,
      }}>
        {WEEK_DAYS.map((d) => {
          const count = mockLessons.filter((l) => l.date === d.key).length;
          const isActive = d.key === activeKey;
          const isToday = d.key === 'today';
          return (
            <button
              key={d.key} onClick={() => setActiveKey(d.key)}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '10px 4px', borderRadius: 12,
                border: '1px solid',
                borderColor: isActive ? 'var(--primary-edge)' : 'transparent',
                background: isActive ? 'var(--primary-soft)' : (isToday ? 'oklch(0.985 0.003 260)' : 'transparent'),
                color: isActive ? 'var(--primary-soft-ink)' : 'var(--ink)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background-color 120ms, border-color 120ms',
              }}
            >
              <span style={{
                fontSize: 10.5, fontWeight: 540, color: 'var(--mute)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{d.short}</span>
              <span style={{
                fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                color: isActive ? 'var(--primary-soft-ink)' : (isToday ? 'var(--ink)' : 'var(--ink-soft)'),
              }}>{d.date}</span>
              {count > 0 && (
                <span style={{
                  position: 'absolute', bottom: 4,
                  width: 4, height: 4, borderRadius: '50%',
                  background: isActive ? 'var(--primary)' : 'var(--primary-edge)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day lessons */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {dayLessons.length === 0 ? (
          <EmptyState
            title={`${DAY_LABELS[activeKey]} — день отдыха`}
            body="Уроков нет. Можно посвятить время повторению."
            tone="mute"
          />
        ) : (
          <ul style={{
            margin: 0, padding: 0, listStyle: 'none',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {dayLessons.map((l) => (
              <li key={l.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px', borderRadius: 10,
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
                  }}>{l.subject} · {l.topic}</div>
                  <div style={{
                    fontSize: 11.5, color: 'var(--mute)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{l.teacher}</div>
                </div>
                {activeKey === 'today' && l.minutesUntil != null && l.minutesUntil <= 10 ? (
                  <button onClick={onEnter} style={pillBtnStylePrimary}>Войти</button>
                ) : (
                  <span style={{
                    fontSize: 10.5, fontWeight: 560, padding: '3px 8px', borderRadius: 999,
                    background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
                    letterSpacing: '0.02em', whiteSpace: 'nowrap',
                  }}>предстоит</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </WidgetCard>
  );
}

// ─── Widget: Assignments ───────────────────────────────────────────────────
function AssignmentsWidget() {
  return (
    <WidgetCard>
      <WidgetHeader
        title="Домашние задания"
        right={<LinkButton>Все <Icon.arrowRight width={14} height={14} /></LinkButton>}
      />
      {mockAssignments.length === 0 ? (
        <EmptyState
          title="Всё сдано! 🎉"
          body="Свежих заданий нет. Так держать!"
          tone="success"
        />
      ) : (
        <ul style={{
          margin: 0, padding: 0, listStyle: 'none',
          display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
        }}>
          {mockAssignments.map((a) => {
            const urgency = urgencyFor(a.dueIn);
            return (
              <li key={a.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px', borderRadius: 10, background: 'oklch(0.985 0.003 260)',
              }}>
                <div style={{
                  width: 4, alignSelf: 'stretch', borderRadius: 2,
                  background: `oklch(0.72 0.13 ${a.subjectHue})`,
                  flexShrink: 0,
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 540, color: 'var(--ink)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{a.title}</div>
                  <div style={{
                    fontSize: 11.5, color: 'var(--mute)', marginTop: 2,
                    display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
                  }}>
                    <span>{a.subject}</span>
                    <span>·</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      color: urgency.fg, fontWeight: 540,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: urgency.fg,
                      }} />
                      {a.dueLabel}
                    </span>
                  </div>
                  {a.progress != null && a.progress > 0 && (
                    <div style={{
                      marginTop: 8, height: 4, borderRadius: 999,
                      background: 'oklch(0.94 0.004 260)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${a.progress * 100}%`, height: '100%',
                        background: `oklch(0.62 0.13 ${a.subjectHue})`, borderRadius: 999,
                      }} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

function urgencyFor(dueIn) {
  if (dueIn <= 0) return { fg: 'oklch(0.55 0.18 25)' };  // overdue / today — red
  if (dueIn <= 1) return { fg: 'oklch(0.60 0.16 65)' };  // tomorrow — amber
  return { fg: 'oklch(0.52 0.13 155)' };                 // green
}

// ─── Widget: Balance ───────────────────────────────────────────────────────
function BalanceWidget() {
  const b = mockBalance;
  const ratio = b.remaining / b.total;
  const low = b.remaining <= 3;

  return (
    <WidgetCard>
      <WidgetHeader title="Баланс уроков" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{
              fontSize: 32, fontWeight: 620, color: 'var(--ink)',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>{b.remaining}</span>
            <span style={{ fontSize: 14, color: 'var(--mute)' }}>из {b.total}</span>
          </div>
          <div style={{
            height: 10, borderRadius: 999, background: 'oklch(0.96 0.004 260)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${ratio * 100}%`, height: '100%',
              background: low
                ? 'linear-gradient(90deg, oklch(0.66 0.18 30), oklch(0.62 0.18 25))'
                : 'linear-gradient(90deg, var(--primary), oklch(0.62 0.13 200))',
              borderRadius: 999, transition: 'width 360ms cubic-bezier(.2,.7,.2,1)',
            }} />
          </div>
        </div>

        <div style={{
          fontSize: 12.5, color: low ? 'oklch(0.55 0.18 25)' : 'var(--mute)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon.calendar width={13} height={13} />
          {low
            ? 'Уроки заканчиваются — стоит пополнить пакет.'
            : `Следующая оплата ${b.nextPaymentDate}`}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Button
            fullWidth
            variant={low ? 'gradient' : 'soft'}
            size="md"
            leftIcon={<Icon.creditCard width={15} height={15} />}
          >
            Пополнить пакет
          </Button>
        </div>
      </div>
    </WidgetCard>
  );
}

// ─── Widget: My teachers ───────────────────────────────────────────────────
function TeachersWidget({ onWriteTeacher }) {
  return (
    <WidgetCard>
      <WidgetHeader
        title="Мои преподаватели"
        right={<LinkButton>Все <Icon.arrowRight width={14} height={14} /></LinkButton>}
      />
      <div style={{
        display: 'grid', gap: 10,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        flex: 1,
      }}>
        {mockTeachers.map((t) => (
          <TeacherCard key={t.id} t={t} onWrite={onWriteTeacher} />
        ))}
      </div>
    </WidgetCard>
  );
}

function TeacherCard({ t, onWrite }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 14,
        background: hover ? 'oklch(0.985 0.003 260)' : 'white',
        border: '1px solid var(--line)',
        transition: 'background-color 140ms, border-color 140ms',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <LetterAvatar name={t.name} size={42} hue={t.hue} />
        {t.online && (
          <span title="онлайн" style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 11, height: 11, borderRadius: '50%',
            background: 'oklch(0.66 0.17 155)',
            border: '2px solid white',
          }} />
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 560, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{t.name}</div>
        <div style={{
          fontSize: 12, color: 'var(--mute)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t.subject} · {t.lessons} {pluralLessons(t.lessons)}
        </div>
      </div>
      <button
        onClick={onWrite}
        aria-label={`Написать ${t.name}`}
        title="Написать"
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
          border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon.message width={16} height={16} />
      </button>
    </div>
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

const pillBtnStylePrimary = {
  fontFamily: 'inherit', fontSize: 12, fontWeight: 560,
  padding: '5px 12px', borderRadius: 999,
  background: 'var(--primary)', color: 'white',
  border: 'none', cursor: 'pointer',
};

function LetterAvatar({ name, size = 32, hue }) {
  const h = hue != null ? hue : Array.from(name || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `oklch(0.86 0.08 ${h})`, color: `oklch(0.32 0.14 ${h})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.42, flexShrink: 0,
    }}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );
}

function pluralLessons(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'урок';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'урока';
  return 'уроков';
}
function pluralMinutes(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'минуту';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'минуты';
  return 'минут';
}
function pluralDays(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}
