// ─── EnvSwitcher ─────────────────────────────────────────────────────────────
// Dev-only floating widget — bottom-right of the viewport. Shows current
// API_BASE / WS_BASE and lets you switch between local and prod presets,
// or clear the override and fall back to the build-time env.
//
// Switching writes localStorage `lumio.apiOverride` and reloads, so the
// fresh values are picked up by config/api.js on resolve().
//
// Render only when `import.meta.env.DEV` — never ships in production builds.

import React from 'react';
import {
  API_BASE,
  WS_BASE,
  ENV_PRESETS,
  ENV_TAG,
  setEnvOverride,
} from '../config/api.js';

const PILL = {
  position: 'fixed',
  right: 12,
  bottom: 12,
  zIndex: 99999,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 12,
  lineHeight: 1.3,
};

const TOGGLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  background: '#0f172a',
  color: '#e2e8f0',
  borderRadius: 9999,
  boxShadow: '0 6px 24px -8px rgba(15, 23, 42, 0.45)',
  border: '1px solid rgba(255,255,255,0.06)',
  cursor: 'pointer',
  userSelect: 'none',
};

const PANEL = {
  position: 'absolute',
  right: 0,
  bottom: 'calc(100% + 8px)',
  width: 280,
  background: '#0f172a',
  color: '#e2e8f0',
  borderRadius: 12,
  padding: 12,
  boxShadow: '0 24px 48px -16px rgba(15, 23, 42, 0.55)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const ROW = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 8,
  marginBottom: 6,
};

const URL_TEXT = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 11,
  color: '#94a3b8',
  wordBreak: 'break-all',
};

const BTN = {
  flex: 1,
  padding: '8px 10px',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  background: 'transparent',
  color: '#e2e8f0',
  fontSize: 12,
  cursor: 'pointer',
};

const BTN_ACTIVE = {
  ...BTN,
  background: '#6366f1',
  borderColor: '#6366f1',
  color: '#fff',
  fontWeight: 600,
};

const TAG_COLORS = {
  local: { bg: '#10b981', label: 'LOCAL' },
  prod: { bg: '#f59e0b', label: 'PROD' },
  override: { bg: '#6366f1', label: 'OVERRIDE' },
  custom: { bg: '#64748b', label: 'CUSTOM' },
};

export function EnvSwitcher() {
  // Render-time check: import.meta.env.DEV is statically replaced at build,
  // so this whole subtree is dead-code-eliminated in production.
  if (!import.meta.env.DEV) return null;

  const [open, setOpen] = React.useState(false);
  const tag = TAG_COLORS[ENV_TAG] ?? TAG_COLORS.custom;

  const apply = (preset) => {
    setEnvOverride(preset);
    window.location.reload();
  };

  return (
    <div style={PILL}>
      {open && (
        <div style={PANEL} role="dialog" aria-label="API environment switcher">
          <div style={{ ...ROW, marginBottom: 10 }}>
            <strong style={{ fontSize: 12 }}>API environment</strong>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.6,
                padding: '2px 6px',
                borderRadius: 4,
                background: tag.bg,
                color: '#fff',
              }}
            >
              {tag.label}
            </span>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={ROW}>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>REST</span>
            </div>
            <div style={URL_TEXT}>{API_BASE}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={ROW}>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>WS</span>
            </div>
            <div style={URL_TEXT}>{WS_BASE}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button
              type="button"
              style={ENV_TAG === 'local' ? BTN_ACTIVE : BTN}
              onClick={() => apply('local')}
            >
              Local
              <span style={{ display: 'block', fontSize: 9, opacity: 0.7 }}>
                {ENV_PRESETS.local.api}
              </span>
            </button>
            <button
              type="button"
              style={ENV_TAG === 'prod' ? BTN_ACTIVE : BTN}
              onClick={() => apply('prod')}
            >
              Prod
              <span style={{ display: 'block', fontSize: 9, opacity: 0.7 }}>
                api.e-learn.uz
              </span>
            </button>
          </div>

          <button
            type="button"
            style={{ ...BTN, width: '100%' }}
            onClick={() => apply(null)}
          >
            Clear override (use build-time env)
          </button>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 10,
              color: '#64748b',
              lineHeight: 1.4,
            }}
          >
            Switching reloads the page. To set this from devtools:{' '}
            <code style={{ color: '#cbd5e1' }}>
              localStorage.setItem('lumio.apiOverride','prod')
            </code>
            .
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={TOGGLE}
        title="API environment"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: tag.bg,
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: 600 }}>{tag.label}</span>
        <span style={URL_TEXT}>{shortHost(API_BASE)}</span>
      </button>
    </div>
  );
}

function shortHost(url) {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url;
  }
}
