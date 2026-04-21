// Landing page — hero with CTA
import React from 'react';
import { useRouter } from '../router.jsx';
import { LumioLogo, Button } from '../ui.jsx';
import { LumioTokens } from '../tokens.jsx';

export function LandingPage() {
  const { navigate } = useRouter();

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px clamp(20px, 4vw, 48px)',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <LumioLogo size={28} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sign-in')}>Войти</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/sign-up')}>Создать аккаунт</Button>
        </nav>
      </header>

      {/* Hero */}
      <main style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 48,
        alignItems: 'center',
        maxWidth: 1280, margin: '0 auto', width: '100%',
        padding: 'clamp(32px, 6vw, 72px) clamp(20px, 4vw, 48px)',
        boxSizing: 'border-box',
      }} className="lumio-hero-grid">
        {/* Left copy */}
        <div style={{ maxWidth: 560 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 10px 6px 8px',
            background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
            borderRadius: 999, fontSize: 13, fontWeight: 540, marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)',
              boxShadow: '0 0 0 3px oklch(0.92 0.05 var(--primary-hue, 175))',
            }} />
            Групповые уроки в реальном времени
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 5.4vw, 60px)',
            lineHeight: 1.04, letterSpacing: '-0.035em',
            fontWeight: 620, color: 'var(--ink)',
            margin: '0 0 20px',
            textWrap: 'balance',
          }}>
            Живые уроки,<br />
            <span style={{ color: 'var(--primary-ink)' }}>без лишнего шума</span>
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.55,
            color: 'var(--mute)', margin: '0 0 32px', maxWidth: 480,
            textWrap: 'pretty',
          }}>
            Lumio собирает преподавателей и учеников в одной комнате — с чистым звуком,
            стабильным видео и простым интерфейсом. Без установки, прямо в браузере.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button size="lg" onClick={() => navigate('/sign-up')}
              rightIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>}
            >
              Создать аккаунт
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/sign-in')}>
              У меня уже есть аккаунт
            </Button>
          </div>
          <div style={{
            marginTop: 40, display: 'flex', gap: 28, flexWrap: 'wrap',
            color: 'var(--mute)', fontSize: 13.5,
          }}>
            {[
              ['🎧', 'Чистый звук'],
              ['📹', 'HD-видео'],
              ['🔒', 'Шифрование'],
            ].map(([icon, label], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckDot />
                <span style={{ color: 'var(--ink-soft)', fontWeight: 520 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual */}
        <div className="lumio-hero-visual">
          <HeroVisual />
        </div>
      </main>

      <footer style={{
        padding: '24px clamp(20px, 4vw, 48px)', maxWidth: 1280, margin: '0 auto', width: '100%',
        color: 'var(--mute)', fontSize: 13, display: 'flex', justifyContent: 'space-between',
        boxSizing: 'border-box', flexWrap: 'wrap', gap: 8,
      }}>
        <span>© 2026 Lumio</span>
        <span>Сделано для преподавателей и учеников</span>
      </footer>
    </div>
  );
}

function CheckDot() {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      background: 'var(--primary-soft)', color: 'var(--primary-ink)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5"/></svg>
    </span>
  );
}

function HeroVisual() {
  const tiles = [
    { label: 'Анна', tone: 175, speaking: true,  role: 'teacher' },
    { label: 'Максим', tone: 265, speaking: false, role: 'student' },
    { label: 'Ирина', tone: 305, speaking: false, role: 'student' },
    { label: 'Олег', tone: 65,  speaking: false, role: 'student' },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 20, boxShadow: LumioTokens.shadow.lg, overflow: 'hidden',
        transform: 'rotate(-1.2deg)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 14px', borderBottom: '1px solid var(--line)',
          background: 'oklch(0.98 0.003 260)',
        }}>
          {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
          ))}
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--mute)' }}>Урок · Английский B1 · идёт запись</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--primary-ink)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 999, fontWeight: 540 }}>
            LIVE
          </span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12,
          background: 'oklch(0.99 0.003 260)',
        }}>
          {tiles.map((t, i) => (
            <ParticipantTile key={i} {...t} big={i === 0} />
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: 12, borderTop: '1px solid var(--line)', background: 'var(--surface)',
        }}>
          <ControlPill icon="mic" on />
          <ControlPill icon="cam" on />
          <ControlPill icon="hand" />
          <ControlPill icon="chat" />
          <div style={{ flex: 1 }} />
          <div style={{
            padding: '8px 14px', borderRadius: 10, background: 'oklch(0.97 0.02 25)',
            color: 'oklch(0.5 0.15 25)', fontSize: 13, fontWeight: 540,
          }}>Завершить</div>
        </div>
      </div>
      <div style={{
        position: 'absolute', left: -18, bottom: -18,
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 14, padding: '10px 14px', boxShadow: LumioTokens.shadow.md,
        display: 'flex', alignItems: 'center', gap: 10,
        transform: 'rotate(-2deg)',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, background: 'var(--primary-soft)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-ink)',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v12M2 8h12"/></svg>
        </span>
        <div style={{ fontSize: 12.5 }}>
          <div style={{ color: 'var(--ink)', fontWeight: 540 }}>Новая комната</div>
          <div style={{ color: 'var(--mute)' }}>за 3 клика</div>
        </div>
      </div>
    </div>
  );
}

function ParticipantTile({ label, tone, speaking, role, big }) {
  return (
    <div style={{
      background: `oklch(0.96 0.03 ${tone})`,
      border: `2px solid ${speaking ? 'var(--primary)' : 'transparent'}`,
      borderRadius: 12, aspectRatio: big ? '16 / 10' : '1.4 / 1',
      position: 'relative', gridColumn: big ? 'span 2' : 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      transition: `border-color ${LumioTokens.motion.base}`,
    }}>
      <div style={{
        width: big ? 64 : 44, height: big ? 64 : 44, borderRadius: '50%',
        background: `oklch(0.55 0.12 ${tone})`, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: big ? 22 : 16,
      }}>{label[0]}</div>
      <div style={{
        position: 'absolute', bottom: 6, left: 6, right: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11.5, color: 'var(--ink)',
      }}>
        <span style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
          padding: '2px 7px', borderRadius: 6, fontWeight: 540,
        }}>
          {label}{role === 'teacher' ? ' · препод.' : ''}
        </span>
        {speaking && (
          <span style={{
            background: 'var(--primary)', color: 'white',
            padding: '2px 6px', borderRadius: 6, display: 'flex', gap: 2, alignItems: 'center',
          }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 2.5, height: 10, background: 'white', borderRadius: 2,
                animation: `lumio-wave 0.9s ${i * 0.12}s infinite ease-in-out`,
                transformOrigin: 'center',
              }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function ControlPill({ icon, on }) {
  const path = {
    mic: <><path d="M8 2a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2z"/><path d="M4 8a4 4 0 0 0 8 0M8 12v2"/></>,
    cam: <><rect x="2" y="5" width="8" height="6" rx="1"/><path d="M10 7l4-2v6l-4-2"/></>,
    hand: <path d="M5 8V4a1 1 0 1 1 2 0v4M7 8V3a1 1 0 1 1 2 0v5M9 8V4a1 1 0 1 1 2 0v5M11 8a1 1 0 1 1 2 0v3a4 4 0 0 1-4 4H8a4 4 0 0 1-3.5-2l-1.5-3c-.3-.6 0-1.3.6-1.4.6-.2 1.3.2 1.4.8"/>,
    chat: <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6l-3 3V4z"/>,
  }[icon];
  return (
    <span style={{
      width: 36, height: 36, borderRadius: 10,
      background: on ? 'var(--primary-soft)' : 'oklch(0.96 0.004 260)',
      color: on ? 'var(--primary-ink)' : 'var(--ink-soft)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </span>
  );
}
