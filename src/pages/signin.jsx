// Sign In — username/email + password
import React from 'react';
import { useRouter, Link } from '../router.jsx';
import { login } from '../lib/auth.js';
import { FormField, Input, PasswordInput, Button } from '../ui.jsx';
import { AuthLayout } from './auth_layout.jsx';
import { MailIcon } from './signup.jsx';

export function SignInPage() {
  const { navigate } = useRouter();
  const [form, setForm] = React.useState({ username: '', password: '' });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState(null);

  function validate(f) {
    const e = {};
    if (!f.username?.trim()) e.username = 'Введите email или имя пользователя.';
    if (!f.password) e.password = 'Введите пароль.';
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate(form);
    setErrors(err);
    if (Object.keys(err).length) return;
    setSubmitting(true); setServerError(null);
    try {
      await login({ username: form.username.trim(), password: form.password });
      navigate('/rooms');
    } catch (err2) {
      const status = err2.response?.status;
      if (status === 401) setServerError('Неверный логин или пароль.');
      else if (err2.response?.data?.detail) setServerError(err2.response.data.detail);
      else setServerError('Не удалось войти. Проверьте соединение и попробуйте снова.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить урок."
      footer={<span>Нет аккаунта? <Link to="/sign-up">Создать</Link></span>}
    >
      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Email или имя пользователя" error={errors.username} required>
          <Input
            value={form.username}
            onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
            onBlur={() => setErrors(e => ({ ...e, ...validate(form) }))}
            autoComplete="username"
            placeholder="anna@example.com"
            leftSlot={<MailIcon />}
          />
        </FormField>

        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6,
          }}>
            <label htmlFor="signin-pw" style={{
              fontSize: 13.5, fontWeight: 530, color: 'var(--ink-soft)', letterSpacing: '-0.005em',
            }}>
              Пароль<span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
            </label>
            <Link to="/forgot" style={{ fontSize: 13, fontWeight: 540 }}>Забыли?</Link>
          </div>
          <FormField error={errors.password}>
            <PasswordInput
              id="signin-pw"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </FormField>
        </div>

        {serverError && (
          <div role="alert" style={{
            background: 'var(--danger-bg)', border: '1px solid oklch(0.85 0.07 25)',
            color: 'var(--danger)', padding: '10px 12px', borderRadius: 10, fontSize: 13.5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 4.5v4M8 11v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Входим…' : 'Войти'}
        </Button>
      </form>
    </AuthLayout>
  );
}
