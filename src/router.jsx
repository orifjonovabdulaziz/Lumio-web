// Hash router — minimal replacement for react-router for the prototype
import React from 'react';

const RouterCtx = React.createContext(null);

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  return hash;
}

export function RouterProvider({ children }) {
  const [path, setPath] = React.useState(parseRoute());
  React.useEffect(() => {
    const onHash = () => setPath(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = React.useCallback((to, { replace = false } = {}) => {
    if (replace) {
      const url = window.location.pathname + window.location.search + '#' + to;
      window.history.replaceState(null, '', url);
      setPath(to);
    } else {
      window.location.hash = to;
    }
  }, []);
  return <RouterCtx.Provider value={{ path, navigate }}>{children}</RouterCtx.Provider>;
}

export function useRouter() {
  return React.useContext(RouterCtx);
}

export function Link({ to, children, style, onClick, ...rest }) {
  const { navigate } = useRouter();
  return (
    <a
      href={'#' + to}
      onClick={(e) => { e.preventDefault(); onClick?.(e); navigate(to); }}
      style={{ color: 'var(--primary-ink)', textDecoration: 'none', fontWeight: 540, ...style }}
      {...rest}
    >
      {children}
    </a>
  );
}
