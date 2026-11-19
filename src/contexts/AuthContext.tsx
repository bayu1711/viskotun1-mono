'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import type { AuthState, RegionContext, User, UserLifestyleProfile, UserProfile } from '../types/auth';
import { resolveCountryCodeFromInput, resolveCountryName } from '../utils/geo';

const STORAGE_KEY = 'viskotun1_auth_user';
const USER_PROFILE_STORAGE_KEY = 'viskotun1_user_profile';
const LIFESTYLE_STORAGE_KEY = 'viskotun1_lifestyle_profile';

export const DEFAULT_USER_PROFILE: UserProfile = {
  preferredReminderTime: '09:00'
};

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
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [lifestyleProfile, setLifestyleProfile] = useState<UserLifestyleProfile>(DEFAULT_LIFESTYLE_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;
  const lifestyleProfileRef = useRef(lifestyleProfile);
  lifestyleProfileRef.current = lifestyleProfile;

  // Safe client hydration from localStorage + automatic global geo-detection when unconfirmed
  useEffect(() => {
    let hasConfirmedSavedRegion = false;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        if (parsed.profile) {
          setUserProfile({ ...DEFAULT_USER_PROFILE, ...parsed.profile });
        }
        if (parsed.lifestyleProfile) {
          setLifestyleProfile(parsed.lifestyleProfile);
          if (parsed.lifestyleProfile?.region?.confirmed) {
            hasConfirmedSavedRegion = true;
          }
        }
        window.localStorage.setItem(STORAGE_KEY, saved);
      }
      const savedUserProfile = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (savedUserProfile) {
        setUserProfile({ ...DEFAULT_USER_PROFILE, ...JSON.parse(savedUserProfile) });
      }
      const savedProfile = window.localStorage.getItem(LIFESTYLE_STORAGE_KEY);
      if (savedProfile) {
        const parsedLp = JSON.parse(savedProfile);
        setLifestyleProfile(parsedLp);
        if (parsedLp?.region?.confirmed) {
          hasConfirmedSavedRegion = true;
        }
      }
    } catch {
      // Fallback silently if localStorage is restricted
    } finally {
      setIsLoading(false);
    }

    if (hasConfirmedSavedRegion) return;

    let active = true;
    async function detectGlobalRegion() {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const res = await fetch(`/api/geo?tz=${encodeURIComponent(tz)}`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!data?.countryCode || !active) return;
        if (lifestyleProfileRef.current.region.confirmed) return;

        const detectedRegion: RegionContext = {
          countryCode: String(data.countryCode).toUpperCase(),
          countryName: data.countryName || resolveCountryName(String(data.countryCode)),
          city: data.city,
          detectedBy:
            data.source === 'middleware_header' || data.source === 'client_timezone'
              ? data.source
              : 'default_uae',
          confirmed: false
        };
        setLifestyleProfile((prev) => ({
          ...prev,
          region: prev.region.confirmed ? prev.region : detectedRegion
        }));
      } catch {
        // Offline / restricted fallback stays silently on default region
      }
    }
    detectGlobalRegion();

    return () => {
      active = false;
    };
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    const next: UserProfile = {
      ...userProfileRef.current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    userProfileRef.current = next;
    setUserProfile(next);

    try {
      window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {}

    setUser((current) => {
      if (!current) return current;
      const customName = updates.displayName?.trim();
      const resolvedName = customName || current.name;
      const updated: User = {
        ...current,
        name: resolvedName,
        initials: customName ? deriveInitials(resolvedName, current.initials) : current.initials,
        profile: next
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const updateLifestyleProfile = useCallback((updates: Partial<UserLifestyleProfile>) => {
    const next: UserLifestyleProfile = {
      ...lifestyleProfileRef.current,
      ...updates,
      lastTunedAt: new Date().toISOString()
    };
    lifestyleProfileRef.current = next;
    setLifestyleProfile(next);

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
  }, []);

  const confirmRegion = useCallback((countryName: string, city?: string) => {
    const countryCode = resolveCountryCodeFromInput(countryName);
    const resolvedName = resolveCountryName(countryCode);
    const isCodeInput = /^[A-Za-z]{2}$/.test(countryName.trim());
    updateLifestyleProfile({
      region: {
        countryCode,
        countryName: isCodeInput ? resolvedName : countryName.trim() || resolvedName,
        city: city?.trim() || (countryCode === 'AE' ? 'Abu Dhabi' : undefined),
        detectedBy: 'user_selected',
        confirmed: true
      }
    });
  }, [updateLifestyleProfile]);

  const persistUser = useCallback((nextUser: User | null) => {
    const resolvedUser: User | null = nextUser
      ? (() => {
          const savedName = userProfileRef.current.displayName?.trim();
          const finalName = savedName || nextUser.name;
          return {
            ...nextUser,
            name: finalName,
            initials: savedName ? deriveInitials(finalName, nextUser.initials) : nextUser.initials,
            profile: nextUser.profile ?? userProfileRef.current,
            lifestyleProfile: nextUser.lifestyleProfile ?? lifestyleProfileRef.current
          };
        })()
      : null;

    setUser((prev) => {
      if (
        prev &&
        resolvedUser &&
        prev.id === resolvedUser.id &&
        prev.name === resolvedUser.name &&
        prev.email === resolvedUser.email &&
        prev.isGuest === resolvedUser.isGuest &&
        prev.role === resolvedUser.role
      ) {
        return prev;
      }
      return resolvedUser;
    });
    try {
      if (resolvedUser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedUser));
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
      userProfile,
      updateUserProfile,
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
      userProfile,
      updateUserProfile,
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
