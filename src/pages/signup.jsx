// Sign Up — email, username, name, password, role (teacher/student)
import React from 'react';
import { useRouter, Link } from '../router.jsx';
import { register } from '../lib/auth.js';
import { FormField, Input, PasswordInput, Button, Divider } from '../ui.jsx';
import { LumioTokens } from '../tokens.jsx';
import { AuthLayout } from './auth_layout.jsx';

// Simulated zod schema
function validateSignUp(data) {
  const errors = {};
  if (!data.first_name?.trim()) errors.first_name = 'Укажите имя.';
  else if (data.first_name.trim().length < 2) errors.first_name = 'Имя слишком короткое.';

  if (!data.last_name?.trim()) errors.last_name = 'Укажите фамилию.';

  if (!data.email?.trim()) errors.email = 'Введите email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Некорректный email.';

  if (!data.username?.trim()) errors.username = 'Придумайте имя пользователя.';
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) errors.username = 'Только латиница, цифры и _, 3–20 символов.';

  if (!data.password) errors.password = 'Введите пароль.';
  else if (data.password.length < 8) errors.password = 'Минимум 8 символов.';
  else if (!/[a-zA-Zа-яА-Я]/.test(data.password) || !/\d/.test(data.password))
    errors.password = 'Пароль должен содержать буквы и цифры.';

  if (!data.role) errors.role = 'Выберите роль.';

  return errors;
}

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Za-zА-Яа-я]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-zА-Яа-я0-9]/.test(pw)) score++;
  const labels = ['Слабый', 'Средний', 'Хороший', 'Отличный'];
  return { score, label: score === 0 ? 'Слабый' : labels[Math.min(score - 1, 3)] };
}

function RoleCard({ role, selected, onSelect }) {
  const isTeacher = role === 'teacher';
  const data = isTeacher ? {
    title: 'Преподаватель',
    desc: 'Веду уроки и создаю комнаты.',
    icon: <TeacherIcon />,
    accent:  '#2563eb',  // blue-600
    accentBg:'#dbeafe',  // blue-100
    bgSel:   '#eff6ff',  // blue-50
    iconInk: '#2563eb',
  } : {
    title: 'Ученик',
    desc: 'Присоединяюсь к урокам.',
    icon: <StudentIcon />,
    accent:  '#9333ea',  // purple-600
    accentBg:'#f3e8ff',  // purple-100
    bgSel:   '#faf5ff',  // purple-50
    iconInk: '#9333ea',
  };
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(role)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', width: '100%', minWidth: 0, cursor: 'pointer',
        background: selected ? data.bgSel : '#fff',
        border: `2px solid ${selected ? data.accent : (hover ? '#9ca3af' : '#e5e7eb')}`,
        borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: `all ${LumioTokens.motion.base}`,
        boxShadow: 'none',
        fontFamily: 'inherit', color: '#111827',
        position: 'relative', overflow: 'hidden',
        wordBreak: 'normal', overflowWrap: 'normal',
      }}
    >
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 18, height: 18, borderRadius: '50%',
        border: `1.5px solid ${selected ? data.accent : '#d1d5db'}`,
        background: selected ? data.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: `all ${LumioTokens.motion.base}`,
      }}>
        {selected && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.2 5 8.5 9.5 3.5"/>
          </svg>
        )}
      </div>

      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: selected ? data.accent : data.accentBg,
        color: selected ? '#fff' : data.iconInk,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: `all ${LumioTokens.motion.base}`,
      }}>
        {data.icon}
      </div>

      <div style={{ minWidth: 0, width: '100%' }}>
        <div style={{
          fontSize: 15, fontWeight: 580, letterSpacing: '-0.01em',
          marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          paddingRight: 22,
        }}>{data.title}</div>
        <div style={{
          fontSize: 12.5, color: '#6b7280', lineHeight: 1.4,
          textWrap: 'pretty',
        }}>{data.desc}</div>
      </div>
    </button>
  );
}

function TeacherIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18v11H3z"/>
      <path d="M7 17v3M17 17v3"/>
      <path d="M7 10h6M7 13h4"/>
    </svg>
  );
}
function StudentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-4 9 4-9 4-9-4z"/>
      <path d="M7 10.5v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4"/>
      <path d="M21 9v5"/>
    </svg>
  );
}

export function SignUpPage() {
  const { navigate } = useRouter();
  const [form, setForm] = React.useState({
    first_name: '', last_name: '', email: '', username: '',
    password: '', role: null,
  });
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState(null);

  const strength = React.useMemo(() => passwordStrength(form.password), [form.password]);

  function upd(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    if (touched[k]) {
      const next = { ...form, [k]: v };
      const allErr = validateSignUp(next);
      setErrors(e => ({ ...e, [k]: allErr[k] }));
    }
  }

  function touch(k) {
    setTouched(t => ({ ...t, [k]: true }));
    const allErr = validateSignUp(form);
    setErrors(e => ({ ...e, [k]: allErr[k] }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const allErr = validateSignUp(form);
    setErrors(allErr);
    setTouched({ first_name: true, last_name: true, email: true, username: true, password: true, role: true });
    if (Object.keys(allErr).length) return;

    setSubmitting(true); setServerError(null);
    try {
      await register({
        email: form.email.trim(), username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        role: form.role,
      });
      navigate('/app');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 && data && typeof data === 'object') {
        const mapped = {};
        for (const [k, v] of Object.entries(data)) {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        }
        setErrors(e => ({ ...e, ...mapped }));
        if (mapped.detail || mapped.non_field_errors) {
          setServerError(mapped.detail || mapped.non_field_errors);
        }
      } else if (data?.detail) {
        setServerError(data.detail);
      } else {
        setServerError('Не удалось создать аккаунт. Проверьте соединение и попробуйте снова.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Создайте аккаунт"
      subtitle="Это займёт пару минут — и сразу можно начинать."
      footer={
        <span>Уже есть аккаунт? <Link to="/sign-in">Войти</Link></span>
      }
    >
      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10,
          }}>
            <span style={{ fontSize: 13.5, fontWeight: 530, color: 'var(--ink-soft)' }}>
              Я буду использовать Lumio как <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
          </div>
          <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }} className="lumio-role-grid">
            <RoleCard role="teacher" selected={form.role === 'teacher'} onSelect={(r) => { upd('role', r); setTouched(t => ({ ...t, role: true })); setErrors(e => ({ ...e, role: undefined })); }} />
            <RoleCard role="student" selected={form.role === 'student'} onSelect={(r) => { upd('role', r); setTouched(t => ({ ...t, role: true })); setErrors(e => ({ ...e, role: undefined })); }} />
          </div>
          {errors.role && (
            <div role="alert" style={{
              fontSize: 13, color: 'var(--danger)', marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 4.5v4M8 11v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              {errors.role}
            </div>
          )}
        </div>

        <Divider />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }} className="lumio-name-grid">
          <FormField label="Имя" error={errors.first_name} required>
            <Input
              value={form.first_name}
              onChange={(e) => upd('first_name', e.target.value)}
              onBlur={() => touch('first_name')}
              autoComplete="given-name"
              placeholder="Анна"
            />
          </FormField>
          <FormField label="Фамилия" error={errors.last_name} required>
            <Input
              value={form.last_name}
              onChange={(e) => upd('last_name', e.target.value)}
              onBlur={() => touch('last_name')}
              autoComplete="family-name"
              placeholder="Петрова"
            />
          </FormField>
        </div>

        <FormField label="Email" error={errors.email} required>
          <Input
            type="email" inputMode="email"
            value={form.email}
            onChange={(e) => upd('email', e.target.value)}
            onBlur={() => touch('email')}
            autoComplete="email"
            placeholder="anna@example.com"
            leftSlot={<MailIcon />}
          />
        </FormField>

        <FormField label="Имя пользователя" error={errors.username} hint="Латиница, цифры и _" required>
          <Input
            value={form.username}
            onChange={(e) => upd('username', e.target.value.toLowerCase())}
            onBlur={() => touch('username')}
            autoComplete="username"
            placeholder="anna_p"
            leftSlot={<span style={{ color: 'var(--mute)', fontSize: 15 }}>@</span>}
          />
        </FormField>

        <FormField label="Пароль" error={errors.password} required>
          <PasswordInput
            value={form.password}
            onChange={(e) => upd('password', e.target.value)}
            onBlur={() => touch('password')}
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
          />
        </FormField>
        {form.password && !errors.password && (
          <StrengthBar score={strength.score} label={strength.label} />
        )}

        {serverError && (
          <div role="alert" style={{
            background: 'var(--danger-bg)', border: '1px solid oklch(0.85 0.07 25)',
            color: 'var(--danger)', padding: '10px 12px', borderRadius: 10, fontSize: 13.5,
          }}>{serverError}</div>
        )}

        <Button type="submit" size="lg" variant="gradient" fullWidth loading={submitting}>
          {submitting ? 'Создаём аккаунт…' : 'Создать аккаунт'}
        </Button>

        <p style={{
          fontSize: 12.5, color: 'var(--mute)', textAlign: 'center', margin: 0, lineHeight: 1.5,
        }}>
          Нажимая «Создать аккаунт», вы соглашаетесь с <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary-ink)', textDecoration: 'none' }}>условиями</a> и <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary-ink)', textDecoration: 'none' }}>политикой конфиденциальности</a>.
        </p>
      </form>
    </AuthLayout>
  );
}

function StrengthBar({ score, label }) {
  const colors = ['oklch(0.75 0.15 25)', 'oklch(0.78 0.14 65)', 'oklch(0.72 0.13 140)', 'oklch(0.62 0.13 155)'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -8 }}>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < score ? colors[Math.max(0, score - 1)] : 'var(--line)',
            transition: `background ${LumioTokens.motion.base}`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--mute)', minWidth: 68, textAlign: 'right' }}>{label}</span>
    </div>
  );
}

export function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="10" rx="2"/>
      <path d="M2.5 4.5 8 9l5.5-4.5"/>
    </svg>
  );
}
