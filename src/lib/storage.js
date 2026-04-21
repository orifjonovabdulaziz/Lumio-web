const KEYS = {
  access: 'lumio.access',
  refresh: 'lumio.refresh',
  user: 'lumio.user',
};

export const tokenStorage = {
  getAccess: () => localStorage.getItem(KEYS.access),
  getRefresh: () => localStorage.getItem(KEYS.refresh),
  getUser: () => {
    try {
      const raw = localStorage.getItem(KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setAccess: (v) => {
    if (v == null) localStorage.removeItem(KEYS.access);
    else localStorage.setItem(KEYS.access, v);
  },
  setRefresh: (v) => {
    if (v == null) localStorage.removeItem(KEYS.refresh);
    else localStorage.setItem(KEYS.refresh, v);
  },
  setUser: (v) => {
    if (v == null) localStorage.removeItem(KEYS.user);
    else localStorage.setItem(KEYS.user, JSON.stringify(v));
  },
  clear: () => {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    localStorage.removeItem(KEYS.user);
  },
};
