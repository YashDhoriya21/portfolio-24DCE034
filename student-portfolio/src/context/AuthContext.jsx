// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Global authentication context.
// Provides: token, user, login(), logout(), register()
// Token is persisted in localStorage so refreshes keep the user logged in.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('token'));
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true); // checking persisted session

  // On mount (or when token changes) — re-hydrate user from /auth/me
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token expired / invalid — clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  /** Call backend login, persist token, return response */
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    return data;
  }, []);

  /** Call backend register */
  const register = useCallback(async (email, password) => {
    return apiRegister(email, password);
  }, []);

  /** Clear token + user */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — use inside any component that needs auth state */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
