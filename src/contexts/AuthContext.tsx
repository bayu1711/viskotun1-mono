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
import { useRouter } from 'next/navigation';
import { COPY } from '../data/copy';
import { ROUTES } from '../data/navigation';
import { getFirebaseAuth } from '../lib/firebase';
import type { AuthState, RegionContext, User, UserLifestyleProfile } from '../types/auth';

const STORAGE_KEY = 'viskotun1_auth_user';
const LIFESTYLE_STORAGE_KEY = 'viskotun1_lifestyle_profile';

export const DEFAULT_LIFESTYLE_PROFILE: UserLifestyleProfile = {
  region: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    city: 'Abu Dhabi',
    detectedBy: 'default_uae',
    confirmed: false
  },
  workPattern: 'standard',
  smokingStatus: 'non_smoker',
  activityBaseline: 'moderate',
  isRamadanFastingObserver: false,
  climateSensitivity: 'moderate',
  activeTags: [],
  intakeCompleted: false
};

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
      case 'auth/unauthorized-domain':
        return new Error('This domain is not authorized in Firebase. Please add it to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return new Error('Sign-in cancelled or popup closed.');
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
  role: 'user',
  createdAt: Date.now()
};

const ADMIN_USER: User = {
  id: 'usr-admin-evelyn',
  name: COPY.auth.defaultAdminName,
  email: 'admin@viskotun1.internal',
  initials: COPY.auth.initials.admin,
  isGuest: false,
  role: 'admin',
  createdAt: Date.now()
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [lifestyleProfile, setLifestyleProfile] = useState<UserLifestyleProfile>(DEFAULT_LIFESTYLE_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Safe client hydration from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        if (parsed.lifestyleProfile) {
          setLifestyleProfile(parsed.lifestyleProfile);
        }
        window.localStorage.setItem(STORAGE_KEY, saved);
      }
      const savedProfile = window.localStorage.getItem(LIFESTYLE_STORAGE_KEY);
      if (savedProfile) {
        setLifestyleProfile(JSON.parse(savedProfile));
      }
    } catch {
      // Fallback silently if localStorage is restricted
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLifestyleProfile = useCallback((updates: Partial<UserLifestyleProfile>) => {
    setLifestyleProfile((prev) => {
      const next = { ...prev, ...updates, lastTunedAt: new Date().toISOString() };
      try {
        window.localStorage.setItem(LIFESTYLE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      setUser((current) => {
        if (!current) return current;
        const updated = { ...current, lifestyleProfile: next };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      return next;
    });
  }, []);

  const confirmRegion = useCallback((countryName: string, city?: string) => {
    const isUae =
      countryName.toLowerCase().includes('emirates') ||
      countryName.toLowerCase().includes('uae') ||
      countryName.toLowerCase().includes('abu dhabi') ||
      countryName.toLowerCase().includes('dubai');
    const countryCode = isUae ? 'AE' : countryName.slice(0, 2).toUpperCase();
    updateLifestyleProfile({
      region: {
        countryCode,
        countryName,
        city: city || (isUae ? 'Abu Dhabi' : undefined),
        detectedBy: 'user_selected',
        confirmed: true
      }
    });
  }, [updateLifestyleProfile]);

  const persistUser = useCallback((nextUser: User | null) => {
    setUser((prev) => {
      if (
        prev &&
        nextUser &&
        prev.id === nextUser.id &&
        prev.name === nextUser.name &&
        prev.email === nextUser.email &&
        prev.isGuest === nextUser.isGuest &&
        prev.role === nextUser.role
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
        const isAdminRole = Boolean(fbUser.email?.toLowerCase().includes('admin'));
        const authenticatedUser: User = {
          id: fbUser.uid,
          name,
          email: fbUser.email || '',
          initials: deriveInitials(name, COPY.auth.initials.clinicalUser),
          isGuest: false,
          role: isAdminRole ? 'admin' : 'user',
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

  const loginAsAdmin = useCallback(() => {
    persistUser(ADMIN_USER);
  }, [persistUser]);

  const loginWithEmail = useCallback(
    async (email: string, password?: string, asAdmin?: boolean) => {
      const isTargetAdmin = Boolean(asAdmin || email.toLowerCase().includes('admin'));
      const { auth } = getFirebaseAuth();

      if (!auth) {
        throw new Error('Authentication service is currently unavailable. Please reload the page.');
      }

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
          role: isTargetAdmin ? 'admin' : 'user',
          createdAt: Date.now()
        };
        persistUser(authenticatedUser);
        return;
      } catch (err: unknown) {
        throw formatFirebaseAuthError(err);
      }
    },
    [persistUser]
  );

  const loginWithGoogle = useCallback(async () => {
    const { auth, googleProvider } = getFirebaseAuth();

    if (!auth || !googleProvider) {
      throw new Error('Google authentication service is currently unavailable. Please reload the page.');
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const name = fbUser.displayName || fbUser.email?.split('@')[0] || COPY.auth.defaultGoogleUser;
      const isAdminRole = Boolean(fbUser.email?.toLowerCase().includes('admin'));
      const authenticatedUser: User = {
        id: fbUser.uid,
        name,
        email: fbUser.email || '',
        initials: deriveInitials(name, COPY.auth.initials.googleUser),
        isGuest: false,
        role: isAdminRole ? 'admin' : 'user',
        createdAt: Date.now()
      };
      persistUser(authenticatedUser);
      return;
    } catch (err: unknown) {
      throw formatFirebaseAuthError(err);
    }
  }, [persistUser]);

  const signupWithEmail = useCallback(
    async (name: string, email: string, password?: string, asAdmin?: boolean) => {
      const isTargetAdmin = Boolean(asAdmin || email.toLowerCase().includes('admin'));
      const { auth } = getFirebaseAuth();

      if (!auth) {
        throw new Error('Authentication service is currently unavailable. Please reload the page.');
      }

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
          role: isTargetAdmin ? 'admin' : 'user',
          createdAt: Date.now()
        };
        persistUser(authenticatedUser);
        return;
      } catch (err: unknown) {
        throw formatFirebaseAuthError(err);
      }
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
    router.push(ROUTES.login);
  }, [persistUser, router]);

  const isAdmin = Boolean(
    user &&
    !user.isGuest &&
    (user.role === 'admin' || user.email.toLowerCase().includes('admin'))
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && !user.isGuest),
      isGuest: Boolean(user?.isGuest),
      isAdmin,
      lifestyleProfile,
      updateLifestyleProfile,
      confirmRegion,
      loginAsGuest,
      loginAsAdmin,
      loginWithEmail,
      loginWithGoogle,
      signupWithEmail,
      logout
    }),
    [
      user,
      isLoading,
      isAdmin,
      lifestyleProfile,
      updateLifestyleProfile,
      confirmRegion,
      loginAsGuest,
      loginAsAdmin,
      loginWithEmail,
      loginWithGoogle,
      signupWithEmail,
      logout
    ]
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
