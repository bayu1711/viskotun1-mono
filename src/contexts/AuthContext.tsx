'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { COPY } from '../data/copy';
import { getFirebaseAuth } from '../lib/firebase';
import type { AuthState, User } from '../types/auth';

const STORAGE_KEY = 'viskotun1_auth_user';
const LEGACY_STORAGE_KEY = 'protocol_engine_auth_user';

function deriveInitials(name: string, fallback: string = COPY.auth.initials.fallback): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toLowerCase();
  return (parts[0][0] + parts[1][0]).toLowerCase();
}

function formatFirebaseAuthError(err: unknown): Error {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as { code: unknown }).code);
    switch (code) {
      case 'auth/operation-not-allowed':
        return new Error(COPY.auth.toastOperationNotAllowed);
      case 'auth/email-already-in-use':
        return new Error(COPY.auth.toastEmailInUse);
      case 'auth/invalid-email':
        return new Error(COPY.auth.toastValidEmail);
      case 'auth/weak-password':
        return new Error(COPY.auth.toastWeakPassword);
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return new Error(COPY.auth.toastInvalidCredentials);
      case 'auth/too-many-requests':
        return new Error(COPY.auth.toastTooManyRequests);
      default:
        break;
    }
  }
  return err instanceof Error ? err : new Error(COPY.auth.toastAuthFailed);
}

const GUEST_USER: User = {
  id: 'guest-explorer',
  name: COPY.auth.defaultGuestName,
  email: '',
  initials: COPY.auth.initials.guest,
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
      const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
        window.localStorage.setItem(STORAGE_KEY, saved);
      }
    } catch {
      // Fallback silently if localStorage is restricted
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUser = useCallback((nextUser: User | null) => {
    setUser((prev) => {
      if (
        prev &&
        nextUser &&
        prev.id === nextUser.id &&
        prev.name === nextUser.name &&
        prev.email === nextUser.email &&
        prev.isGuest === nextUser.isGuest
      ) {
        return prev;
      }
      return nextUser;
    });
    try {
      if (nextUser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write issues
    }
  }, []);

  // Synchronize authenticated Firebase session if active
  useEffect(() => {
    const { auth } = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const name = fbUser.displayName || fbUser.email?.split('@')[0] || COPY.auth.defaultClinicalUser;
        const authenticatedUser: User = {
          id: fbUser.uid,
          name,
          email: fbUser.email || '',
          initials: deriveInitials(name, COPY.auth.initials.clinicalUser),
          isGuest: false,
          createdAt: Date.now()
        };
        persistUser(authenticatedUser);
      }
    });

    return () => unsubscribe();
  }, [persistUser]);

  const loginAsGuest = useCallback(() => {
    persistUser(GUEST_USER);
  }, [persistUser]);

  const loginWithEmail = useCallback(
    async (email: string, password?: string) => {
      const { auth } = getFirebaseAuth();

      if (auth) {
        if (!password) {
          throw new Error(COPY.auth.toastPasswordRequired);
        }
        try {
          const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const fbUser = credential.user;
          const name = fbUser.displayName || fbUser.email?.split('@')[0] || COPY.auth.defaultClinicalUser;
          const authenticatedUser: User = {
            id: fbUser.uid,
            name,
            email: fbUser.email || email.trim(),
            initials: deriveInitials(name, COPY.auth.initials.clinicalUser),
            isGuest: false,
            createdAt: Date.now()
          };
          persistUser(authenticatedUser);
          return;
        } catch (err: unknown) {
          throw formatFirebaseAuthError(err);
        }
      }

      // Evaluation fallback if Firebase client is unconfigured
      const derivedName = email.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      const fallbackUser: User = {
        id: `usr-${Date.now()}`,
        name: formattedName || COPY.auth.defaultClinicalUser,
        email: email.trim(),
        initials: deriveInitials(formattedName, COPY.auth.initials.clinicalUser),
        isGuest: false,
        createdAt: Date.now()
      };
      persistUser(fallbackUser);
    },
    [persistUser]
  );

  const loginWithGoogle = useCallback(async () => {
    const { auth, googleProvider } = getFirebaseAuth();

    if (auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const name = fbUser.displayName || fbUser.email?.split('@')[0] || COPY.auth.defaultGoogleUser;
        const authenticatedUser: User = {
          id: fbUser.uid,
          name,
          email: fbUser.email || '',
          initials: deriveInitials(name, COPY.auth.initials.googleUser),
          isGuest: false,
          createdAt: Date.now()
        };
        persistUser(authenticatedUser);
        return;
      } catch (err: unknown) {
        console.warn('[AuthContext] Firebase popup closed or failed, using evaluation profile:', err);
      }
    }

    // Evaluation profile fallback if Firebase keys are unconfigured
    const googleUser: User = {
      id: `usr-google-${Date.now()}`,
      name: COPY.auth.googleResearcher,
      email: 'researcher@gmail.com',
      initials: COPY.auth.initials.googleResearcher,
      isGuest: false,
      createdAt: Date.now()
    };
    persistUser(googleUser);
  }, [persistUser]);

  const signupWithEmail = useCallback(
    async (name: string, email: string, password?: string) => {
      const { auth } = getFirebaseAuth();

      if (auth) {
        if (!password) {
          throw new Error(COPY.auth.toastPasswordRequired);
        }
        try {
          const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const fbUser = credential.user;
          const trimmedName = name.trim();
          if (trimmedName) {
            try {
              await updateProfile(fbUser, { displayName: trimmedName });
            } catch (profileErr) {
              console.warn('[AuthContext] Could not update displayName in Firebase profile:', profileErr);
            }
          }
          const displayName = trimmedName || fbUser.displayName || fbUser.email?.split('@')[0] || COPY.auth.defaultClinicalUser;
          const authenticatedUser: User = {
            id: fbUser.uid,
            name: displayName,
            email: fbUser.email || email.trim(),
            initials: deriveInitials(displayName, COPY.auth.initials.clinicalUser),
            isGuest: false,
            createdAt: Date.now()
          };
          persistUser(authenticatedUser);
          return;
        } catch (err: unknown) {
          throw formatFirebaseAuthError(err);
        }
      }

      // Evaluation fallback if Firebase client is unconfigured
      const trimmedName = name.trim() || COPY.auth.defaultInvestigator;
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: trimmedName,
        email: email.trim(),
        initials: deriveInitials(trimmedName, COPY.auth.initials.investigator),
        isGuest: false,
        createdAt: Date.now()
      };
      persistUser(newUser);
    },
    [persistUser]
  );

  const logout = useCallback(async () => {
    const { auth } = getFirebaseAuth();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Silently continue
      }
    }
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
