// Auth layout — centered card on gradient bg (mirrors lumio LoginPage)
import React from 'react';
import { useRouter } from '../router.jsx';

export function AuthLayout({ title, subtitle, children, footer, showBack = true }) {
  const { navigate } = useRouter();
  return (
    <div className="ll-bg ll-auth-theme" style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(16px, 3vw, 24px)',
      position: 'relative',
    }}>
      {showBack && (
        <button
          onClick={() => navigate('/')}
          aria-label="На главную"
          tabIndex={-1}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid #e5e7eb', borderRadius: 9999,
            padding: '8px 14px', fontSize: 13, fontWeight: 500,
            color: '#374151', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'inherit',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 8H3M7 4 3 8l4 4"/>
          </svg>
          На главную
        </button>
      )}

      <div style={{ width: '100%', maxWidth: 448 }}>
        {/* Header — gradient brand + page title/subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3vw, 32px)' }}>
          <button
            onClick={() => navigate('/')}
            className="ll-brand"
            tabIndex={-1}
            style={{
              fontSize: 'clamp(24px, 3vw, 30px)',
              background: 'linear-gradient(to right, #9333ea, #2563eb)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
              fontWeight: 600, letterSpacing: '-0.01em',
              border: 'none', padding: 0, cursor: 'pointer',
              marginBottom: 12, display: 'inline-block',
              fontFamily: 'inherit',
            }}
          >
            Lumio
          </button>
          {title && (
            <h1 style={{
              margin: '0 0 6px', fontSize: 'clamp(20px, 2vw, 24px)',
              fontWeight: 620, color: '#111827', letterSpacing: '-0.01em',
            }}>{title}</h1>
          )}
          {subtitle && (
            <p style={{
              margin: 0, fontSize: 'clamp(14px, 1.2vw, 16px)',
              color: '#4b5563', lineHeight: 1.5,
            }}>{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 'clamp(20px, 2vw, 30px)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.03)',
          padding: 'clamp(24px, 3vw, 32px)',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            textAlign: 'center', marginTop: 'clamp(16px, 2vw, 24px)',
            fontSize: 14, color: '#4b5563',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
