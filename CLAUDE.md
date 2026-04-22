# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # one-time
npm run dev            # Vite dev server, http://localhost:5173
npm run build          # production bundle → dist/
npm run preview        # serve built dist/
```

No test runner, linter, or type-checker is configured. `tsc`/`jest`/`eslint` calls will not work.

## Environment

`VITE_API_BASE_URL` — Django JWT backend, default `http://127.0.0.1:8000/api/v1`. See [.env.example](.env.example). Copy to `.env.local` to override.

The backend must include the dev origin (`http://localhost:5173`) in `CORS_ALLOWED_ORIGINS`, or be served from the same origin as the frontend.

## Architecture notes

### Routing — custom hash router, not react-router

[src/router.jsx](src/router.jsx) defines `RouterProvider`, `useRouter`, and `Link`. URLs look like `/#/sign-up`. There is no History API integration and no 404 routing on the server side. Use the provided `Link` component and `useRouter().navigate(to, { replace })` — do not introduce `react-router` casually, it would require replacing every `Link`/`navigate` call site.

### Auth state — hand-rolled store, not Redux/Zustand

[src/lib/auth.js](src/lib/auth.js) holds a mutable `state` object, a `Set<listener>`, and `useAuth()` which subscribes. Mutations go through internal setters that call `emit()`. Public actions: `login`, `register`, `logout`, `loadMe`, `updateMe`, `bootstrap`.

### HTTP — single axios instance in [src/lib/api.js](src/lib/api.js)

- Request interceptor attaches `Authorization: Bearer <access>` unless the URL matches `PUBLIC_PATHS` (`/auth/register/`, `/auth/token/`, `/auth/token/refresh/`, `/auth/token/verify/`).
- Response interceptor does **single-flight refresh** on 401: parallel 401s share one `/auth/token/refresh/` call via `refreshPromise`, the original request retries once with `config._retry = true`, and on refresh failure the handler registered via `setAuthFailureHandler` runs (auth.js wires this to `clearAuth()` + hash redirect to `/sign-in`).
- Tokens persist in `localStorage` via [src/lib/storage.js](src/lib/storage.js) (`lumio.access`, `lumio.refresh`, `lumio.user`).

### Bootstrap — runs at module import time

`bootstrap()` is called at the bottom of [src/app.jsx](src/app.jsx), before React mounts. If a refresh token exists but no cached user, `state.bootstrapping = true` and `LumioApp` renders `<BootSplash />` until `/auth/me/` resolves or fails.

### Route guard

`PROTECTED` set lives in [src/app.jsx](src/app.jsx). When adding a protected route, add it there — the page component is rendered via `user ? <Page /> : null` and the redirect effect is centralized. Do not replicate the redirect inside each page.

### Styling — inline styles + CSS custom properties

Root CSS vars (`--primary`, `--paper`, `--ink`, etc.) are declared in [index.html](index.html) `:root`. Design tokens (palette hues, motion, radii, shadows) live in [src/tokens.jsx](src/tokens.jsx). `applyTweakVars()` in [src/tweaks.jsx](src/tweaks.jsx) rewrites `--primary-*` at runtime based on the selected hue. There is no Tailwind, no CSS-in-JS library, no global stylesheet beyond `index.html`.

### Tweaks panel — embedded-editor bridge

[src/tweaks.jsx](src/tweaks.jsx) expects to run inside a host iframe. On mount, `EditModeBridge` posts `__edit_mode_available` to `window.parent`. The host can toggle the panel via `__activate_edit_mode` / `__deactivate_edit_mode` messages. When the user picks a color or corner style, the panel posts `__edit_mode_set_keys` so the host can rewrite the JSON block marked by `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/`. **Leave those markers intact** — an external tool parses them.

### Backend contract

Django + SimpleJWT at `VITE_API_BASE_URL`. Relevant endpoints: `POST /auth/register/`, `POST /auth/token/`, `POST /auth/token/refresh/`, `GET|PATCH /auth/me/`. Register does **not** return tokens — `register()` in auth.js chains `/auth/token/` and `/auth/me/` itself.

400 responses from `/auth/register/` return per-field arrays (`{"email": ["..."]}`) — [src/pages/signup.jsx](src/pages/signup.jsx) maps those onto form field errors; `detail` / `non_field_errors` go to a global banner.

`user.role` is `"teacher" | "student"` and switches the teacher-only / student-only tile sets in [src/pages/appshell.jsx](src/pages/appshell.jsx).

### Quirks

- `MailIcon` is exported from [src/pages/signup.jsx](src/pages/signup.jsx) and imported by [src/pages/signin.jsx](src/pages/signin.jsx). If you move it, update the import.
- [Lumio.html](Lumio.html) is the pre-Vite prototype (CDN React + Babel standalone). It's unused — [index.html](index.html) is the live entry.
