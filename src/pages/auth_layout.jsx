// Auth layout — shared shell for sign-in, sign-up, forgot-password
import React from 'react';
import { useRouter } from '../router.jsx';
import { LumioLogo, Button } from '../ui.jsx';

export function AuthLayout({ title, subtitle, children, footer, showBack = true }) {
  const { navigate } = useRouter();
  return (
    <div style={{
      minHeight: '100%', display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    }} className="lumio-auth-layout">
      {/* Left: form */}
      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
        padding: 'clamp(20px, 3vw, 32px)', background: 'var(--paper)',
      }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <LumioLogo size={26} />
          </button>
          {showBack && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}
              leftIcon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8H3M7 4 3 8l4 4"/></svg>}
            >
              На главную
            </Button>
          )}
        </header>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(24px, 4vw, 48px) 0',
        }}>
          <div style={{ width: '100%', maxWidth: 440 }}>
            <h1 style={{
              fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 620, letterSpacing: '-0.025em',
              color: 'var(--ink)', margin: '0 0 8px', textWrap: 'balance',
            }}>{title}</h1>
            {subtitle && (
              <p style={{
                color: 'var(--mute)', fontSize: 15.5, lineHeight: 1.5,
                margin: '0 0 28px', textWrap: 'pretty',
              }}>{subtitle}</p>
            )}
            {children}
            {footer && (
              <div style={{
                marginTop: 24, fontSize: 14, color: 'var(--mute)', textAlign: 'center',
              }}>
                {footer}
              </div>
            )}
          </div>
        </div>

        <footer style={{ fontSize: 12.5, color: 'var(--mute)', textAlign: 'center' }}>
          © 2026 Lumio · <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted currentColor' }}>Поддержка</a>
        </footer>
      </div>

      {/* Right: decorative panel */}
      <div className="lumio-auth-decor" style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--primary-soft)',
        borderLeft: '1px solid var(--line)',
      }}>
        <DecorPanel />
      </div>
    </div>
  );
}

function DecorPanel() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: 'clamp(40px, 5vw, 80px)',
      color: 'var(--primary-soft-ink)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, oklch(0.55 0.12 var(--primary-hue, 175) / 0.1) 1px, transparent 1.2px)',
        backgroundSize: '22px 22px', maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 440 }}>
        <blockquote style={{
          margin: 0, fontSize: 'clamp(20px, 2vw, 26px)',
          lineHeight: 1.35, letterSpacing: '-0.015em',
          color: 'var(--primary-ink)', fontWeight: 520,
          textWrap: 'balance',
        }}>
          «Готовлюсь к уроку за 5 минут, а не за час. Ученики подключаются в один клик — и мы сразу работаем.»
        </blockquote>
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 16,
          }}>М</div>
          <div>
            <div style={{ fontWeight: 560, color: 'var(--ink)', fontSize: 14.5 }}>Мария Котова</div>
            <div style={{ color: 'var(--mute)', fontSize: 13 }}>преподаватель английского</div>
          </div>
        </div>

        <div style={{
          marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        }}>
          <Stat value="12k+" label="уроков в месяц" />
          <Stat value="98%" label="без разрывов связи" />
          <Stat value="40+" label="стран" />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div style={{
        fontSize: 22, fontWeight: 620, color: 'var(--ink)',
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
