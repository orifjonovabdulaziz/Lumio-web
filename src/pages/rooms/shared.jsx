// Shared helpers for room pages.
import React from 'react';
import { useRouter } from '../../router.jsx';
import { LumioLogo, Button } from '../../ui.jsx';
import { useAuth, logout as doLogout } from '../../lib/auth.js';

export function slugifyTitle(title) {
  if (!title) return '';
  return title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Returns list of IANA timezone ids. Falls back to a curated short list on older engines.
export function getTimezoneList() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try { return Intl.supportedValuesOf('timeZone'); } catch {}
  }
  return [
    'UTC',
    'Europe/Moscow',
    'Europe/Kiev',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Tashkent',
    'Asia/Almaty',
    'Asia/Tbilisi',
    'Asia/Yerevan',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'America/New_York',
    'America/Los_Angeles',
  ];
}

export function browserTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

// Shared top bar used across the rooms feature.
export function RoomsTopBar({ title, crumbs = [], right = null }) {
  const { navigate } = useRouter();
  const { user } = useAuth();

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px clamp(20px, 3vw, 32px)', borderBottom: '1px solid var(--line)',
      background: 'var(--surface)', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <button onClick={() => navigate('/rooms')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex',
        }} aria-label="К комнатам">
          <LumioLogo size={26} />
        </button>
        {crumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--mute)', minWidth: 0 }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {c.to ? (
                  <a href={'#' + c.to}
                    onClick={(e) => { e.preventDefault(); navigate(c.to); }}
                    style={{ color: 'var(--mute)', textDecoration: 'none' }}>{c.label}</a>
                ) : (
                  <span style={{
                    color: 'var(--ink)', fontWeight: 540,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{c.label}</span>
                )}
                {i < crumbs.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </nav>
        )}
        {title && crumbs.length === 0 && (
          <span style={{ fontSize: 15, fontWeight: 560, color: 'var(--ink)' }}>{title}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        {user && (
          <Button variant="secondary" size="sm" onClick={() => { doLogout(); navigate('/', { replace: true }); }}
            leftIcon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M10 11l3-3-3-3M13 8H6"/></svg>}
          >Выйти</Button>
        )}
      </div>
    </header>
  );
}

export function CenteredMessage({ title, body, action }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center',
    }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 620, color: 'var(--ink)' }}>{title}</h2>
      {body && <p style={{ margin: 0, color: 'var(--mute)', maxWidth: 420 }}>{body}</p>}
      {action}
    </div>
  );
}

export function isNotFound(err) {
  return err?.response?.status === 404;
}
