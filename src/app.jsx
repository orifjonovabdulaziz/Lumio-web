// Root App — mounts router + pages
import React from 'react';
import { RouterProvider, useRouter } from './router.jsx';
import { useAuth, bootstrap } from './lib/auth.js';
import { LumioLogo, Button, Spinner } from './ui.jsx';
import { LandingPage } from './pages/landing.jsx';
import { SignInPage } from './pages/signin.jsx';
import { SignUpPage } from './pages/signup.jsx';
import { ForgotPage } from './pages/forgot.jsx';
import { TeacherDashboard } from './pages/dashboard/teacher.jsx';
import { StudentDashboard } from './pages/dashboard/student.jsx';
import { RoomsListPage } from './pages/rooms/list.jsx';
import { RoomNewPage } from './pages/rooms/new.jsx';
import { RoomEditPage } from './pages/rooms/edit.jsx';
import { RoomDetailPage } from './pages/rooms/detail.jsx';
import { RoomLivePage } from './pages/rooms/live.jsx';
import { ChatPage } from './pages/chat/index.jsx';
import { chatHub } from './lib/chatHub.js';
import { EditModeBridge, applyTweakVars } from './tweaks.jsx';
import { EnvSwitcher } from './components/EnvSwitcher.jsx';

function isProtected(path) {
  return path === '/app' || path === '/chat' || path === '/rooms' || path.startsWith('/rooms/');
}

function matchRoute(path) {
  if (path === '/' || path === '') return { kind: 'landing' };
  if (path === '/sign-in') return { kind: 'sign-in' };
  if (path === '/sign-up') return { kind: 'sign-up' };
  if (path === '/forgot') return { kind: 'forgot' };
  if (path === '/app') return { kind: 'app' };
  if (path === '/chat') return { kind: 'chat' };
  if (path === '/rooms') return { kind: 'rooms-list' };
  if (path === '/rooms/new') return { kind: 'rooms-new' };

  const m = path.match(/^\/rooms\/([^/]+)(\/edit|\/live)?$/);
  if (m) {
    const name = decodeURIComponent(m[1]);
    if (m[2] === '/edit') return { kind: 'rooms-edit', name };
    if (m[2] === '/live') return { kind: 'rooms-live', name };
    return { kind: 'rooms-detail', name };
  }
  return { kind: 'not-found' };
}

function renderRoute(route, user) {
  switch (route.kind) {
    case 'landing':      return <LandingPage />;
    case 'sign-in':      return <SignInPage />;
    case 'sign-up':      return <SignUpPage />;
    case 'forgot':       return <ForgotPage />;
    case 'app':
      if (!user) return null;
      return user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
    case 'chat':         return user ? <ChatPage /> : null;
    case 'rooms-list':   return user ? <RoomsListPage /> : null;
    case 'rooms-new':    return user ? <RoomNewPage /> : null;
    case 'rooms-edit':   return user ? <RoomEditPage name={route.name} /> : null;
    case 'rooms-detail': return user ? <RoomDetailPage name={route.name} /> : null;
    case 'rooms-live':   return user ? <RoomLivePage name={route.name} /> : null;
    default:             return <NotFound />;
  }
}

function pageLabel(route) {
  switch (route.kind) {
    case 'landing':      return '01 Landing';
    case 'sign-in':      return '02 Sign In';
    case 'sign-up':      return '03 Sign Up';
    case 'forgot':       return '04 Forgot';
    case 'app':          return '05 App';
    case 'chat':         return '05a Chat';
    case 'rooms-list':   return '06 Rooms';
    case 'rooms-new':    return '07 New Room';
    case 'rooms-detail': return '08 Room Detail';
    case 'rooms-edit':   return '09 Edit Room';
    case 'rooms-live':   return '10 Live';
    default:             return 'NotFound';
  }
}

function LumioApp() {
  const { path, navigate } = useRouter();
  const { user, bootstrapping } = useAuth();

  React.useEffect(() => { applyTweakVars(); }, []);

  // Single multiplexed chat WebSocket — open while authed, close on logout.
  // Depend on the *boolean* (not the user object) so re-renders that mint a
  // new user reference don't trigger a redundant connect() call.
  const isAuthed = !!user;
  React.useEffect(() => {
    if (bootstrapping) return;
    if (isAuthed) chatHub.connect();
    else chatHub.disconnect();
  }, [isAuthed, bootstrapping]);

  // Route guard — protected routes require a user
  React.useEffect(() => {
    if (bootstrapping) return;
    if (isProtected(path) && !user) {
      navigate('/sign-in', { replace: true });
    }
  }, [path, user, bootstrapping, navigate]);

  if (bootstrapping) return <BootSplash />;

  const route = matchRoute(path);
  const page = renderRoute(route, user);

  return (
    <div data-screen-label={pageLabel(route)} style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <PageTransition pathKey={path}>
        {page}
      </PageTransition>
      <EditModeBridge />
      <EnvSwitcher />
    </div>
  );
}

function BootSplash() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, color: 'var(--mute)', background: 'var(--paper)',
    }}>
      <Spinner size={18} />
      <span style={{ fontSize: 14 }}>Загружаем…</span>
    </div>
  );
}

function PageTransition({ pathKey, children }) {
  const [rendered, setRendered] = React.useState({ key: pathKey, children });
  const [phase, setPhase] = React.useState('in');

  React.useEffect(() => {
    if (rendered.key === pathKey) {
      setRendered({ key: pathKey, children });
      return;
    }
    setPhase('out');
    const t = setTimeout(() => {
      setRendered({ key: pathKey, children });
      setPhase('in-start');
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase('in')));
    }, 120);
    return () => clearTimeout(t);
  }, [pathKey, children]);

  const style = {
    opacity: phase === 'out' ? 0 : (phase === 'in-start' ? 0 : 1),
    transform: phase === 'out' ? 'translateY(4px)' : (phase === 'in-start' ? 'translateY(6px)' : 'translateY(0)'),
    transition: `opacity 180ms ease, transform 240ms cubic-bezier(.2,.7,.2,1)`,
  };
  return <div style={style}>{rendered.children}</div>;
}

function NotFound() {
  const { navigate } = useRouter();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center',
    }}>
      <LumioLogo size={40} />
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 620, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
        Страница не найдена
      </h1>
      <p style={{ margin: 0, color: 'var(--mute)', maxWidth: 380 }}>
        Возможно, адрес введён неверно или страница ещё в разработке.
      </p>
      <Button onClick={() => navigate('/')}>На главную</Button>
    </div>
  );
}

// Kick off /auth/me/ hydration before first render if a refresh token is present.
bootstrap();

export function Root() {
  return (
    <RouterProvider>
      <LumioApp />
    </RouterProvider>
  );
}
