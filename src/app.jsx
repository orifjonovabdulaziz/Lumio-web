// Root App — mounts router + pages
import React from 'react';
import { RouterProvider, useRouter } from './router.jsx';
import { useAuth, bootstrap } from './lib/auth.js';
import { LumioLogo, Button, Spinner } from './ui.jsx';
import { LandingPage } from './pages/landing.jsx';
import { SignInPage } from './pages/signin.jsx';
import { SignUpPage } from './pages/signup.jsx';
import { ForgotPage } from './pages/forgot.jsx';
import { AppShell } from './pages/appshell.jsx';
import { EditModeBridge, applyTweakVars } from './tweaks.jsx';

const PROTECTED = new Set(['/app']);

function LumioApp() {
  const { path, navigate } = useRouter();
  const { user, bootstrapping } = useAuth();

  React.useEffect(() => { applyTweakVars(); }, []);

  // Route guard — protected routes require a user
  React.useEffect(() => {
    if (bootstrapping) return;
    if (PROTECTED.has(path) && !user) {
      navigate('/sign-in', { replace: true });
    }
  }, [path, user, bootstrapping, navigate]);

  if (bootstrapping) return <BootSplash />;

  let page;
  if (path === '/' || path === '') page = <LandingPage />;
  else if (path === '/sign-in') page = <SignInPage />;
  else if (path === '/sign-up') page = <SignUpPage />;
  else if (path === '/forgot') page = <ForgotPage />;
  else if (path === '/app') page = user ? <AppShell /> : null;
  else page = <NotFound />;

  return (
    <div data-screen-label={pageLabel(path)} style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <PageTransition pathKey={path}>
        {page}
      </PageTransition>
      <EditModeBridge />
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

function pageLabel(path) {
  if (path === '/' || path === '') return '01 Landing';
  if (path === '/sign-in') return '02 Sign In';
  if (path === '/sign-up') return '03 Sign Up';
  if (path === '/forgot') return '04 Forgot';
  if (path === '/app') return '05 App';
  return 'NotFound';
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
