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

`isProtected(path)` lives in [src/app.jsx](src/app.jsx). When adding a protected route, extend that function — page components render via `user ? <Page /> : null` and the redirect effect is centralized in `LumioApp`. Do not replicate the redirect inside each page.

### Styling — inline styles + CSS custom properties

Root CSS vars (`--primary`, `--paper`, `--ink`, etc.) are declared in [index.html](index.html) `:root`. Design tokens (palette hues, motion, radii, shadows) live in [src/tokens.jsx](src/tokens.jsx). `applyTweakVars()` in [src/tweaks.jsx](src/tweaks.jsx) rewrites `--primary-*` at runtime based on the selected hue. There is no Tailwind, no CSS-in-JS library, no global stylesheet beyond `index.html`.

### Tweaks panel — embedded-editor bridge

[src/tweaks.jsx](src/tweaks.jsx) expects to run inside a host iframe. On mount, `EditModeBridge` posts `__edit_mode_available` to `window.parent`. The host can toggle the panel via `__activate_edit_mode` / `__deactivate_edit_mode` messages. When the user picks a color or corner style, the panel posts `__edit_mode_set_keys` so the host can rewrite the JSON block marked by `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/`. **Leave those markers intact** — an external tool parses them.

### Backend contract

Django + SimpleJWT at `VITE_API_BASE_URL`. Relevant endpoints: `POST /auth/register/`, `POST /auth/token/`, `POST /auth/token/refresh/`, `GET|PATCH /auth/me/`. Register does **not** return tokens — `register()` in auth.js chains `/auth/token/` and `/auth/me/` itself.

400 responses from `/auth/register/` return per-field arrays (`{"email": ["..."]}`) — [src/pages/signup.jsx](src/pages/signup.jsx) maps those onto form field errors; `detail` / `non_field_errors` go to a global banner.

`user.role` is `"teacher" | "student"` and switches the teacher-only / student-only tile sets in [src/pages/appshell.jsx](src/pages/appshell.jsx).

### Chat module — multiplexed WebSocket + REST history

The chat lives at [src/pages/chat/](src/pages/chat/) (popover quick-reply + full page) on top of two libraries:

- [src/lib/chatHub.js](src/lib/chatHub.js) — singleton client for the **single multiplexed WebSocket** at `${API_BASE without /api/v1, http→ws}/ws/chat/?token=<jwt>`. RPC actions (`subscribe.room`, `send.dm`, `mark_read.room`, …) are matched to acks by request id; push events (`room.message`, `dm.message`, `dm.read`, `room.read`) fan out via `chatHub.on(event, fn)`. Connect/disconnect are tied to auth bootstrap in [src/app.jsx](src/app.jsx). On a `4401` close the hub tries `refreshAccess()` once before emitting `unauthorized`. Reconnect is exponential (1s/2s/4s/8s/16s/30s) and `chatHub.rooms` (a Set) is auto-resubscribed on every reopen.
- [src/lib/chat.js](src/lib/chat.js) — REST helpers + payload normalizers. The history endpoints are paginated ASC oldest-first, so:
  - `listLatestMessages({ kind, key })` — initial history. Fetches `?page=1` to learn `count`, then the last page (and the previous one if the last is partial). Up to 3 GETs per chat open.
  - `listMessagesAfter({ kind, key, afterId })` — reconnect catchup; walks `next` until exhausted.
  - `fetchLastMessage({ kind, key })` — single most-recent message, used to backfill room previews because `/rooms/` listing does not include `last_message`.

Three load-bearing rules — violating any of them breaks the chat in subtle ways:

1. **One WebSocket per session.** Open on login, close on logout. `chatHub.connect()` is idempotent and `_open()` defensively closes any prior socket. The app-level effect depends on the `!!user` *boolean*, not the user object, so renders that mint a new user reference don't reconnect.
2. **No REST polling.** `/dm/conversations/`, `/rooms/`, `/rooms/unread/`, and `/messages/` are called once per relevant screen open; live updates arrive over WS only. Do not add `setInterval` or visibility/online listeners that re-fetch.
3. **Merge messages by `serverId`, never replace.** `setMessages` uses the functional updater that dedupes by id. Replacing with REST results would clobber WS messages that arrived during the request — including the user's own sends, since the server echoes every send back as a WS event.

Hook responsibilities ([src/pages/chat/hooks.js](src/pages/chat/hooks.js)):

- `useChats({ enabled, meId, prefetchPreviews })` — inbox state. Loads REST once, **eager-subscribes to all known rooms** (so `room.message` events update preview/unread for rooms the user hasn't opened), and optionally backfills room previews via `fetchLastMessage`. Pass `prefetchPreviews: false` for callers that only need unread counters (e.g. the dashboard badge in [src/pages/dashboard/teacher.jsx](src/pages/dashboard/teacher.jsx)) so the per-room GETs are skipped.
- `useChatThread({ chat, meId, online, onSendError })` — per-chat history + live updates. **Does not** subscribe/unsubscribe rooms — that ownership lives in `useChats`, so subscriptions persist after the thread closes and the inbox keeps updating. DMs need no subscription; backend auto-attaches the `user.<id>` group on connect. Handles read-receipts: own DM messages flip `delivered → read` on `dm.read`, own room messages flip on the `room.read` watermark. For rooms, a debounced `mark_read.room` advances the read watermark whenever new messages are ingested.

There is no optimistic UI for sends. A `pendingSends` counter shows a spinner while at least one send is awaiting its echo; the message itself appears only when the WS event arrives. Read-receipt UI is two-state: one tick = unread, two ticks (blue) = read. See [src/pages/chat/message.jsx](src/pages/chat/message.jsx) `StatusTick`.

### Quirks

- `MailIcon` is exported from [src/pages/signup.jsx](src/pages/signup.jsx) and imported by [src/pages/signin.jsx](src/pages/signin.jsx). If you move it, update the import.
- [Lumio.html](Lumio.html) is the pre-Vite prototype (CDN React + Babel standalone). It's unused — [index.html](index.html) is the live entry.
