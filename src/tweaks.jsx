// Tweaks panel — exposed when user toggles "Tweaks" in host toolbar.
// Lets the user explore: primary color, accent intensity, demo user preview.
import React from 'react';
import { LumioTokens, primaryVars } from './tokens.jsx';
import { Button } from './ui.jsx';
import { register, login, logout } from './lib/auth.js';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "teal",
  "cornerStyle": "rounded",
  "demoUser": "none"
}/*EDITMODE-END*/;

// Global tweak state
const tweakState = { ...TWEAK_DEFAULTS };
const tweakListeners = new Set();

function setTweaks(patch) {
  Object.assign(tweakState, patch);
  tweakListeners.forEach(fn => fn({ ...tweakState }));
  applyTweakVars();
}

export function applyTweakVars() {
  const p = LumioTokens.primaries[tweakState.primary] || LumioTokens.primaries.teal;
  const vars = primaryVars(p.hue);
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  document.documentElement.style.setProperty('--primary-hue', p.hue);
  const radii = { rounded: 12, soft: 16, sharp: 6 };
  document.documentElement.style.setProperty('--radius-field', (radii[tweakState.cornerStyle] || 12) + 'px');
}

function useTweaks() {
  const [t, setT] = React.useState({ ...tweakState });
  React.useEffect(() => {
    const fn = (v) => setT(v);
    tweakListeners.add(fn);
    return () => tweakListeners.delete(fn);
  }, []);
  return t;
}

function TweaksPanel({ open, onClose }) {
  const t = useTweaks();
  if (!open) return null;

  async function seedDemoUser(kind) {
    const base = {
      teacher: { email: 'anna@demo.lumio', username: 'anna_teacher', password: 'demo12345',
        first_name: 'Анна', last_name: 'Преподавателева', role: 'teacher' },
      student: { email: 'max@demo.lumio', username: 'max_student', password: 'demo12345',
        first_name: 'Максим', last_name: 'Ученический', role: 'student' },
    }[kind];
    if (!base) return;
    try {
      await register(base);
    } catch {
      try { await login({ username: base.username, password: base.password }); }
      catch { return; }
    }
    window.location.hash = '/app';
  }

  function resetAll() {
    logout();
    window.location.hash = '/';
    setTimeout(() => window.location.reload(), 100);
  }

  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20, zIndex: 100,
      width: 300, background: 'var(--surface)',
      border: '1px solid var(--line-strong)', borderRadius: 16,
      boxShadow: LumioTokens.shadow.lg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'inherit',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'var(--primary-soft)', color: 'var(--primary-ink)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 4h12M2 8h8M2 12h10"/></svg>
          </span>
          <span style={{ fontSize: 14, fontWeight: 580, color: 'var(--ink)' }}>Tweaks</span>
        </div>
        <button onClick={onClose} aria-label="Закрыть" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--mute)', padding: 4, display: 'flex',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
        </button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Label>Акцентный цвет</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {Object.entries(LumioTokens.primaries).map(([key, p]) => (
              <button
                key={key}
                onClick={() => {
                  setTweaks({ primary: key });
                  persistEdit({ primary: key });
                }}
                title={p.name}
                aria-label={p.name}
                style={{
                  flex: 1, height: 32, borderRadius: 8, cursor: 'pointer',
                  background: p.swatch,
                  border: t.primary === key ? '2px solid var(--ink)' : '2px solid transparent',
                  outline: t.primary === key ? 'none' : '1px solid var(--line-strong)',
                  outlineOffset: -1,
                  transition: `transform ${LumioTokens.motion.fast}`,
                  transform: t.primary === key ? 'scale(1.04)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Скругления</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
            {[
              ['sharp', 'Строгие'],
              ['rounded', 'Средние'],
              ['soft', 'Мягкие'],
            ].map(([key, label]) => (
              <SegButton key={key} active={t.cornerStyle === key}
                onClick={() => { setTweaks({ cornerStyle: key }); persistEdit({ cornerStyle: key }); }}>
                {label}
              </SegButton>
            ))}
          </div>
        </div>

        <div>
          <Label>Быстрый вход (демо)</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <Button size="sm" variant="soft" fullWidth onClick={() => seedDemoUser('teacher')}>
              Войти как преподаватель
            </Button>
            <Button size="sm" variant="soft" fullWidth onClick={() => seedDemoUser('student')}>
              Войти как ученик
            </Button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <button onClick={resetAll} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--mute)', fontSize: 12.5, padding: 0,
            textDecoration: 'underline', textUnderlineOffset: 3,
            fontFamily: 'inherit',
          }}>
            Сбросить моковых пользователей и выйти
          </button>
        </div>
      </div>
    </div>
  );
}

function persistEdit(edits) {
  try {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  } catch {}
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 560, color: 'var(--mute)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>{children}</div>
  );
}

function SegButton({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 30, borderRadius: 8, fontSize: 12.5, fontWeight: 540,
      background: active ? 'var(--primary-soft)' : 'var(--surface)',
      color: active ? 'var(--primary-soft-ink)' : 'var(--ink-soft)',
      border: `1px solid ${active ? 'var(--primary-edge)' : 'var(--line-strong)'}`,
      cursor: 'pointer', fontFamily: 'inherit',
      transition: `all ${LumioTokens.motion.fast}`,
    }}>
      {children}
    </button>
  );
}

// Edit-mode bridge
export function EditModeBridge() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    function onMsg(e) {
      if (e.data?.type === '__activate_edit_mode') setOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setOpen(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return <TweaksPanel open={open} onClose={() => setOpen(false)} />;
}
