// Protected AppShell — placeholder post-auth screen
import React from 'react';
import { useRouter } from '../router.jsx';
import { useAuth, logout as doLogout } from '../lib/auth.js';
import { LumioLogo, Button, Card } from '../ui.jsx';

export function AppShell() {
  const { user } = useAuth();
  const { navigate } = useRouter();

  if (!user) return null;

  function logout() {
    doLogout();
    navigate('/', { replace: true });
  }

  const roleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Ученик';

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px clamp(20px, 3vw, 32px)', borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LumioLogo size={26} />
          <span style={{
            fontSize: 12.5, padding: '4px 10px', borderRadius: 999,
            background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
            fontWeight: 540,
          }}>{roleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={user.first_name} size={32} />
            <div style={{ display: 'none' }} className="lumio-user-name-block">
              <div style={{ fontSize: 13.5, fontWeight: 560, color: 'var(--ink)' }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)' }}>@{user.username}</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}
            leftIcon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M10 11l3-3-3-3M13 8H6"/></svg>}
          >
            Выйти
          </Button>
        </div>
      </header>

      {/* Body */}
      <main style={{
        flex: 1, padding: 'clamp(28px, 5vw, 64px) clamp(20px, 3vw, 32px)',
        maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 13, color: 'var(--mute)',
            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 540,
            marginBottom: 8,
          }}>
            {greeting()}
          </div>
          <h1 style={{
            margin: 0, fontSize: 'clamp(32px, 4vw, 42px)',
            fontWeight: 620, letterSpacing: '-0.03em', color: 'var(--ink)',
            textWrap: 'balance',
          }}>
            Привет, {user.first_name}.
          </h1>
          <p style={{
            margin: '10px 0 0', color: 'var(--mute)', fontSize: 16.5, lineHeight: 1.5,
            maxWidth: 560, textWrap: 'pretty',
          }}>
            {user.role === 'teacher'
              ? 'Рабочее пространство преподавателя почти готово. Скоро здесь появятся комнаты, расписание и ученики.'
              : 'Рабочее пространство ученика почти готово. Скоро здесь появятся ваши уроки и преподаватели.'}
          </p>
        </div>

        <div style={{
          display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          marginTop: 8,
        }}>
          {(user.role === 'teacher' ? teacherTiles : studentTiles).map((t, i) => (
            <Card key={i} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--primary-soft)', color: 'var(--primary-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.icon}
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 560, color: 'var(--ink)' }}>{t.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.45, flex: 1 }}>{t.desc}</div>
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start', padding: '3px 8px',
                background: 'oklch(0.96 0.004 260)', color: 'var(--mute)',
                borderRadius: 6, fontSize: 11.5, fontWeight: 540,
              }}>скоро</div>
            </Card>
          ))}
        </div>

        <details style={{
          marginTop: 40, background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--mute)', fontWeight: 540 }}>
            Данные из /auth/me/
          </summary>
          <pre style={{
            margin: '12px 0 0', fontSize: 12.5, color: 'var(--ink-soft)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            background: 'oklch(0.98 0.004 260)', padding: 12, borderRadius: 8,
            overflowX: 'auto',
          }}>{JSON.stringify({ id: user.id, email: user.email, username: user.username, first_name: user.first_name, last_name: user.last_name, role: user.role }, null, 2)}</pre>
        </details>
      </main>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function Avatar({ name, size = 36 }) {
  const hue = Array.from(name || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `oklch(0.88 0.06 ${hue})`, color: `oklch(0.32 0.14 ${hue})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.42, flexShrink: 0,
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

const teacherTiles = [
  { title: 'Мои комнаты', desc: 'Создавайте постоянные комнаты для групп и приглашайте учеников ссылкой.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/></svg> },
  { title: 'Расписание', desc: 'Планируйте уроки заранее — ученики получат напоминание.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg> },
  { title: 'Ученики', desc: 'Отслеживайте посещаемость, заметки и прогресс каждого ученика.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="8" r="3"/><path d="M17 14a5 5 0 0 1 5 6"/></svg> },
];

const studentTiles = [
  { title: 'Ближайший урок', desc: 'Кнопка подключения появится за 10 минут до начала.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
  { title: 'Мои преподаватели', desc: 'Список преподавателей и быстрые ссылки на комнаты.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg> },
  { title: 'Материалы', desc: 'Записи, заметки и домашние задания к вашим урокам.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h10l4 4v12a0 0 0 0 1 0 0H5a0 0 0 0 1 0 0V4z"/><path d="M8 12h8M8 16h6"/></svg> },
];
