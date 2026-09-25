// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import { refreshSession, logout as logoutRequest } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // GET /api/users/me (ProfileController) — reads the access_token cookie via
  // JwtCookieExtractor. This doubles as both "who is logged in" and the
  // session-validity check, so we don't need a separate auth-service endpoint.
  const fetchProfile = useCallback(() => client.get('/api/users/me'), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const profile = await fetchProfile();
        if (!cancelled) setUser(profile);
        return;
      } catch (err) {
        if (err.status !== 401) {
          // network error or 5xx — not proof the user is logged out, but
          // there's nothing else to try here; surface as logged-out rather
          // than hang. Applayout will retry on next navigation.
          if (!cancelled) setUser(null);
          return;
        }
      }

      // access_token missing/expired: attempt one silent refresh (rotates
      // both cookies via /api/auth/refresh, which reads refresh_token itself)
      try {
        await refreshSession();
        const profile = await fetchProfile();
        if (!cancelled) setUser(profile);
      } catch {
        // refresh_token also invalid/missing/expired — truly logged out
        if (!cancelled) setUser(null);
      }
    })().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest(); // POST /api/auth/logout, clears cookies server-side
    } finally {
      setUser(null);
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    setUser(await fetchProfile());
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);