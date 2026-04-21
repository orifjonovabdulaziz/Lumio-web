// Forgot password — UI-only stub per spec ("скоро")
import React from 'react';
import { Link } from '../router.jsx';
import { AuthLayout } from './auth_layout.jsx';

export function ForgotPage() {
  return (
    <AuthLayout
      title="Восстановление пароля"
      subtitle="Мы ещё работаем над этим экраном."
      footer={<span>Вспомнили пароль? <Link to="/sign-in">Войти</Link></span>}
    >
      <div style={{
        background: 'var(--surface)', border: '1px dashed var(--line-strong)',
        borderRadius: 14, padding: 20, display: 'flex', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: 12,
          background: 'var(--primary-soft)', color: 'var(--primary-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2"/>
            <path d="M8 10V7a4 4 0 1 1 8 0v3"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 560, color: 'var(--ink)', marginBottom: 4 }}>
            Сброс пароля — скоро
          </div>
          <div style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.5 }}>
            Пока эта функция в разработке. Если не получается войти — напишите нам на{' '}
            <a href="mailto:help@lumio.app" style={{ color: 'var(--primary-ink)', textDecoration: 'none', fontWeight: 540 }}>help@lumio.app</a>, и мы поможем.
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
