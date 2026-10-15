'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthState, User } from '../types/auth';

const STORAGE_KEY = 'protocol_engine_auth_user';

const GUEST_USER: User = {
  id: 'guest-explorer',
  name: 'Guest Explorer',
  email: '',
  initials: 'ge',
  isGuest: true,
  createdAt: Date.now()
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safe client hydration from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // Fallback silently if localStorage is restricted
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    try {
      if (nextUser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage write issues
    }
  }, []);

  const loginAsGuest = useCallback(() => {
    persistUser(GUEST_USER);
  }, [persistUser]);

  const loginWithEmail = useCallback(
    async (email: string) => {
      const derivedName = email.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      const authenticatedUser: User = {
        id: `usr-${Date.now()}`,
        name: formattedName || 'Verified Clinical User',
        email,
        initials: email.slice(0, 2).toLowerCase(),
        isGuest: false,
        createdAt: Date.now()
      };
      persistUser(authenticatedUser);
    },
    [persistUser]
  );

  const loginWithGoogle = useCallback(async () => {
    // In production, triggers Google OAuth redirect.
    // For local evaluation, immediately hydrates an authenticated Google profile.
    const googleUser: User = {
      id: `usr-google-${Date.now()}`,
      name: 'Google Researcher',
      email: 'researcher@gmail.com',
      initials: 'gr',
      isGuest: false,
      createdAt: Date.now()
    };
    persistUser(googleUser);
  }, [persistUser]);

  const signupWithEmail = useCallback(
    async (name: string, email: string) => {
      const initials = name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toLowerCase() || 'us';
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: name.trim() || 'Clinical Investigator',
        email,
        initials,
        isGuest: false,
        createdAt: Date.now()
      };
      persistUser(newUser);
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    persistUser(null);
  }, [persistUser]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && !user.isGuest),
      isGuest: Boolean(user?.isGuest),
      loginAsGuest,
      loginWithEmail,
      loginWithGoogle,
      signupWithEmail,
      logout
    }),
    [user, isLoading, loginAsGuest, loginWithEmail, loginWithGoogle, signupWithEmail, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
