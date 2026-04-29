// ─── API config ──────────────────────────────────────────────────────────────
// Single source of truth for REST + WebSocket base URLs.
//
// Resolution order (first non-empty wins):
//   1. localStorage `lumio.apiOverride` — { local | prod | { api, ws } }
//      Set from devtools or via the EnvSwitcher widget. Survives reloads.
//      Apply by reloading the page after writing the key.
//   2. Vite env vars VITE_API_BASE_URL / VITE_WS_BASE_URL.
//   3. Built-in dev defaults (localhost).
//
// API_BASE always ends WITHOUT a trailing slash and points at the versioned
// REST root (`…/api/v1`). WS_BASE points at the host root (`ws://host:port`)
// — the path `/ws/chat/?token=…` is appended by the chat hub.
//
// All HTTP/WS code in the project must import from here. Do not read
// `import.meta.env.VITE_*` outside this module.

const OVERRIDE_KEY = 'lumio.apiOverride';

// Built-in presets — used by the runtime override and as fallbacks.
const PRESETS = {
  local: {
    api: 'http://localhost:8000/api/v1',
    ws: 'ws://localhost:8000',
  },
  prod: {
    api: 'https://api.e-learn.uz/api/v1',
    ws: 'wss://api.e-learn.uz',
  },
};

function readOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    if (raw === 'local' || raw === 'prod') return PRESETS[raw];
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const api = typeof parsed.api === 'string' ? parsed.api : null;
      const ws = typeof parsed.ws === 'string' ? parsed.ws : null;
      if (api || ws) return { api, ws };
    }
  } catch {
    // bad JSON → ignore
  }
  return null;
}

function trimSlash(s) {
  return typeof s === 'string' ? s.replace(/\/+$/, '') : s;
}

// Derive a WS base from a REST base if VITE_WS_BASE_URL isn't set.
// Strips a trailing /api/v1 segment (if present) and switches scheme.
function deriveWsFromApi(apiBase) {
  if (!apiBase) return '';
  const host = apiBase.replace(/\/api\/v\d+\/?$/, '');
  return host.replace(/^http/i, 'ws');
}

function resolve() {
  const override = readOverride();

  const envApi = trimSlash(import.meta.env.VITE_API_BASE_URL);
  const envWs = trimSlash(import.meta.env.VITE_WS_BASE_URL);

  const api =
    trimSlash(override?.api) ||
    envApi ||
    PRESETS.local.api;

  const ws =
    trimSlash(override?.ws) ||
    envWs ||
    deriveWsFromApi(api) ||
    PRESETS.local.ws;

  // Tag for the EnvSwitcher's display.
  let tag = 'custom';
  if (override) tag = 'override';
  else if (api === PRESETS.prod.api) tag = 'prod';
  else if (api === PRESETS.local.api || api.includes('localhost') || api.includes('127.0.0.1')) tag = 'local';

  return { API_BASE: api, WS_BASE: ws, tag };
}

const resolved = resolve();

export const API_BASE = resolved.API_BASE;
export const WS_BASE = resolved.WS_BASE;
export const ENV_TAG = resolved.tag;

// Back-compat alias for code that imported the old name. New code should
// prefer `API_BASE`.
export const API_BASE_URL = API_BASE;

// Helpers for the EnvSwitcher widget.
export const ENV_PRESETS = PRESETS;

export function setEnvOverride(preset) {
  if (typeof window === 'undefined') return;
  if (preset === null) {
    window.localStorage.removeItem(OVERRIDE_KEY);
  } else if (preset === 'local' || preset === 'prod') {
    window.localStorage.setItem(OVERRIDE_KEY, preset);
  } else if (preset && typeof preset === 'object') {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(preset));
  }
}

export function getCurrentEnvLabel() {
  return resolved.tag;
}

// Devtools convenience — call `lumioApi()` in the console to inspect.
if (typeof window !== 'undefined') {
  window.lumioApi = () => ({ API_BASE, WS_BASE, tag: ENV_TAG });
}
