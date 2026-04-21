// Shared UI primitives for Lumio
import React from 'react';
import { LumioTokens } from './tokens.jsx';

// ── Logo ──────────────────────────────────────────────
export function LumioLogo({ size = 28, showWord = true }) {
  const s = size;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M16 3.5 C 17.8 3.5, 19.2 4.5, 20 6 L 28 20.5 C 29 22.5, 27.8 25, 25.5 25 H 6.5 C 4.2 25, 3 22.5, 4 20.5 L 12 6 C 12.8 4.5, 14.2 3.5, 16 3.5 Z"
          fill="var(--primary)"
        />
        <circle cx="16" cy="18" r="3.2" fill="white" />
        <circle cx="16" cy="28.2" r="1.6" fill="var(--primary)" />
      </svg>
      {showWord && (
        <span style={{
          fontSize: s * 0.64, fontWeight: 620, letterSpacing: '-0.02em',
          color: 'var(--ink)', fontFeatureSettings: '"cv11", "ss01"',
        }}>Lumio</span>
      )}
    </div>
  );
}

// ── Button ────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md', fullWidth,
  loading, disabled, type = 'button', onClick, leftIcon, rightIcon, as = 'button', ...rest
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontWeight: 560, letterSpacing: '-0.005em', fontFamily: 'inherit',
    borderRadius: 12, cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    transition: `background ${LumioTokens.motion.fast}, color ${LumioTokens.motion.fast}, border-color ${LumioTokens.motion.fast}, box-shadow ${LumioTokens.motion.fast}, transform ${LumioTokens.motion.fast}`,
    border: '1px solid transparent', width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.55 : 1, userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };
  const sizes = {
    sm: { height: 36, padding: '0 14px', fontSize: 14 },
    md: { height: 44, padding: '0 18px', fontSize: 15 },
    lg: { height: 52, padding: '0 22px', fontSize: 16 },
  };
  const variants = {
    primary: {
      background: 'var(--primary)', color: 'white',
      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 2px rgba(16,24,40,0.08)',
    },
    secondary: {
      background: 'var(--surface)', color: 'var(--ink)',
      borderColor: 'var(--line-strong)',
    },
    ghost: {
      background: 'transparent', color: 'var(--ink)',
    },
    soft: {
      background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
    },
    danger: {
      background: 'var(--surface)', color: 'var(--danger)', borderColor: 'var(--line-strong)',
    },
  };
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const hoverStyles = {
    primary: { background: 'var(--primary-hover)' },
    secondary: { background: 'oklch(0.98 0.004 260)' },
    ghost: { background: 'oklch(0.96 0.004 260)' },
    soft: { background: 'oklch(0.94 0.04 var(--primary-hue, 175))' },
    danger: { background: 'oklch(0.98 0.02 25)' },
  };
  const style = {
    ...base, ...sizes[size], ...variants[variant],
    ...(hover && !disabled ? hoverStyles[variant] : null),
    ...(active && !disabled ? { transform: 'translateY(1px)' } : null),
  };

  const Tag = as;
  return (
    <Tag
      type={as === 'button' ? type : undefined}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={style}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </Tag>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <span style={{
      width: size, height: size, border: '2px solid currentColor',
      borderRightColor: 'transparent', borderRadius: '50%',
      display: 'inline-block', animation: 'lumio-spin 0.7s linear infinite',
      opacity: 0.85,
    }} />
  );
}

// ── FormField ─────────────────────────────────────────
export function FormField({ label, error, hint, children, required, id }) {
  const autoId = React.useId();
  const fieldId = id || autoId;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={fieldId} style={{
          fontSize: 13.5, fontWeight: 530, color: 'var(--ink-soft)',
          letterSpacing: '-0.005em',
        }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': !!error || undefined,
        'aria-describedby': error ? `${fieldId}-err` : (hint ? `${fieldId}-hint` : undefined),
        _hasError: !!error,
      })}
      {error && (
        <div id={`${fieldId}-err`} role="alert" style={{
          fontSize: 13, color: 'var(--danger)', marginTop: 1,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 4.5v4M8 11v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}
      {!error && hint && (
        <div id={`${fieldId}-hint`} style={{ fontSize: 12.5, color: 'var(--mute)' }}>{hint}</div>
      )}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────
export function Input({ _hasError, leftSlot, rightSlot, type = 'text', style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const wrapStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--surface)',
    border: `1px solid ${_hasError ? 'var(--danger)' : (focus ? 'var(--primary)' : 'var(--line-strong)')}`,
    borderRadius: 12, minHeight: 46, padding: '0 14px',
    transition: `border-color ${LumioTokens.motion.fast}, box-shadow ${LumioTokens.motion.fast}`,
    boxShadow: focus ? (_hasError ? '0 0 0 4px oklch(0.95 0.04 25)' : 'var(--focus-ring)') : 'none',
  };
  const inputStyle = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)',
    letterSpacing: '-0.005em', padding: '12px 0', minWidth: 0,
    ...style,
  };
  return (
    <div style={wrapStyle}>
      {leftSlot && <div style={{ color: 'var(--mute)', display: 'flex' }}>{leftSlot}</div>}
      <input
        type={type}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={inputStyle}
        {...rest}
      />
      {rightSlot && <div style={{ color: 'var(--mute)', display: 'flex' }}>{rightSlot}</div>}
    </div>
  );
}

// Password input with show/hide
export function PasswordInput({ _hasError, ...rest }) {
  const [show, setShow] = React.useState(false);
  return (
    <Input
      type={show ? 'text' : 'password'}
      _hasError={_hasError}
      autoComplete="current-password"
      rightSlot={
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
          style={{
            background: 'none', border: 'none', padding: 4, cursor: 'pointer',
            color: 'var(--mute)', display: 'flex',
          }}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a15.9 15.9 0 0 1-3.12 3.83"/><path d="M6.61 6.61A15.9 15.9 0 0 0 2 12s4 7 10 7a10.4 10.4 0 0 0 5.39-1.44"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      }
      {...rest}
    />
  );
}

// ── Card ──────────────────────────────────────────────
export function Card({ children, style, as = 'div', ...rest }) {
  const Tag = as;
  return (
    <Tag
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: LumioTokens.shadow.sm,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── Divider ───────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: 0 }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--mute)', fontSize: 12.5 }}>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      <span>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────
export function Toast({ kind = 'info', children, onClose }) {
  const colors = {
    info:    { bg: 'var(--surface)', fg: 'var(--ink)', bd: 'var(--line-strong)' },
    error:   { bg: 'oklch(0.98 0.02 25)', fg: 'var(--danger)', bd: 'oklch(0.88 0.07 25)' },
    success: { bg: 'oklch(0.97 0.04 155)', fg: 'var(--success)', bd: 'oklch(0.85 0.08 155)' },
  };
  const c = colors[kind];
  return (
    <div role="status" style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      borderRadius: 12, padding: '10px 14px', fontSize: 14, zIndex: 50,
      boxShadow: LumioTokens.shadow.lg, display: 'flex', alignItems: 'center', gap: 10,
      maxWidth: 'calc(100vw - 32px)',
    }}>
      {children}
      {onClose && (
        <button onClick={onClose} aria-label="Закрыть" style={{
          background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
          opacity: 0.6, padding: 2, display: 'flex',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
        </button>
      )}
    </div>
  );
}
