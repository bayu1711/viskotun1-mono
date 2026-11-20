'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
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
import {
  clearBrowserStorageForAccount,
  getProfileStorageKeys,
  LEGACY_LIFESTYLE_PROFILE_KEY,
  LEGACY_USER_PROFILE_KEY
} from '../utils/accountData';
import { resolveCountryCodeFromInput, resolveCountryName } from '../utils/geo';
import { DEFAULT_AVAILABLE_WINDOWS } from '../utils/schedule';

const STORAGE_KEY = 'viskotun1_auth_user';
export const ONBOARDING_DISMISSED_KEY = 'trialn1_lifestyle_onboarding_dismissed';

export const DEFAULT_USER_PROFILE: UserProfile = {
  availabilityMode: 'windows',
  availableWindows: [...DEFAULT_AVAILABLE_WINDOWS],
  primaryLanguage: 'en',
  secondaryLanguage: 'ar',
  reminderNotificationsEnabled: true,
  communityCohortOptIn: true
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
  culturalRhythms: [],
  isRamadanFastingObserver: false,
  climateSensitivity: 'moderate',
  physicalCautions: [],
  activeTags: [],
  intakeCompleted: false
};

function createFreshUserProfile(): UserProfile {
  return { ...DEFAULT_USER_PROFILE };
}

function createFreshLifestyleProfile(detectedRegion?: RegionContext | null): UserLifestyleProfile {
  return {
    ...DEFAULT_LIFESTYLE_PROFILE,
    region: detectedRegion
      ? { ...detectedRegion, confirmed: false }
      : { ...DEFAULT_LIFESTYLE_PROFILE.region },
    culturalRhythms: [],
    physicalCautions: [],
    activeTags: [],
    intakeCompleted: false
  };
}

function resolveScopeUserId(targetUser: User | null | undefined): string | undefined {
  return targetUser && !targetUser.isGuest ? targetUser.id : undefined;
}

function loadScopedProfilesForUser(
  targetUser: User | null,
  detectedRegion?: RegionContext | null
): { profile: UserProfile; lifestyle: UserLifestyleProfile } {
  const freshProfile = createFreshUserProfile();
  const freshLifestyle = createFreshLifestyleProfile(detectedRegion);

  if (typeof window === 'undefined') {
    return { profile: freshProfile, lifestyle: freshLifestyle };
  }

  const keys = getProfileStorageKeys(resolveScopeUserId(targetUser));
  let resolvedProfile = freshProfile;
  let resolvedLifestyle = freshLifestyle;

  try {
    const savedProfileRaw = window.localStorage.getItem(keys.userProfile);
    if (savedProfileRaw) {
      resolvedProfile = { ...freshProfile, ...JSON.parse(savedProfileRaw) };
    } else if (targetUser?.profile) {
      resolvedProfile = { ...freshProfile, ...targetUser.profile };
    }

    const savedLifestyleRaw = window.localStorage.getItem(keys.lifestyleProfile);
    if (savedLifestyleRaw) {
      resolvedLifestyle = { ...freshLifestyle, ...JSON.parse(savedLifestyleRaw) };
    } else if (targetUser?.lifestyleProfile) {
      resolvedLifestyle = { ...freshLifestyle, ...targetUser.lifestyleProfile };
    }
  } catch {
    // Ignore parse/storage errors and fall back to fresh defaults
  }

  return { profile: resolvedProfile, lifestyle: resolvedLifestyle };
}

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

  const userRef = useRef<User | null>(user);
  userRef.current = user;
  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;
  const lifestyleProfileRef = useRef(lifestyleProfile);
  lifestyleProfileRef.current = lifestyleProfile;
  const detectedRegionRef = useRef<RegionContext | null>(null);

  // Safe client hydration from user-scoped localStorage + automatic global geo-detection when unconfirmed
  useEffect(() => {
    let hasConfirmedSavedRegion = false;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const parsedUser: User | null = saved ? JSON.parse(saved) : null;
      if (parsedUser) {
        userRef.current = parsedUser;
        setUser(parsedUser);
      }

      const { profile, lifestyle } = loadScopedProfilesForUser(parsedUser);
      userProfileRef.current = profile;
      lifestyleProfileRef.current = lifestyle;
      setUserProfile(profile);
      setLifestyleProfile(lifestyle);

      if (lifestyle.region?.confirmed) {
        hasConfirmedSavedRegion = true;
      }

      // Clean up legacy unscoped keys so prior accounts/guests can never bleed into new sign-ins
      window.localStorage.removeItem(LEGACY_USER_PROFILE_KEY);
      window.localStorage.removeItem(LEGACY_LIFESTYLE_PROFILE_KEY);
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
        detectedRegionRef.current = detectedRegion;

        if (lifestyleProfileRef.current.region.confirmed) return;
        setLifestyleProfile((prev) => {
          const next = {
            ...prev,
            region: prev.region.confirmed ? prev.region : detectedRegion
          };
          lifestyleProfileRef.current = next;
          return next;
        });
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

    const keys = getProfileStorageKeys(resolveScopeUserId(userRef.current));
    try {
      window.localStorage.setItem(keys.userProfile, JSON.stringify(next));
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
      userRef.current = updated;
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

    const keys = getProfileStorageKeys(resolveScopeUserId(userRef.current));
    try {
      window.localStorage.setItem(keys.lifestyleProfile, JSON.stringify(next));
    } catch {}

    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, lifestyleProfile: next };
      userRef.current = updated;
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

  const persistUser = useCallback(
    (nextUser: User | null, options?: { freshAccount?: boolean }) => {
      if (!nextUser) {
        const freshProfile = createFreshUserProfile();
        const freshLifestyle = createFreshLifestyleProfile(detectedRegionRef.current);
        userRef.current = null;
        userProfileRef.current = freshProfile;
        lifestyleProfileRef.current = freshLifestyle;
        setUserProfile(freshProfile);
        setLifestyleProfile(freshLifestyle);
        setUser(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
          window.localStorage.removeItem(LEGACY_USER_PROFILE_KEY);
          window.localStorage.removeItem(LEGACY_LIFESTYLE_PROFILE_KEY);
        } catch {
          // Ignore storage write issues
        }
        return;
      }

      const isAccountSwitch =
        Boolean(options?.freshAccount) || userRef.current?.id !== nextUser.id;

      let activeProfile = userProfileRef.current;
      let activeLifestyle = lifestyleProfileRef.current;

      if (isAccountSwitch) {
        if (options?.freshAccount) {
          activeProfile = createFreshUserProfile();
          activeLifestyle = createFreshLifestyleProfile(detectedRegionRef.current);
          const keys = getProfileStorageKeys(resolveScopeUserId(nextUser));
          try {
            window.localStorage.removeItem(keys.userProfile);
            window.localStorage.removeItem(keys.lifestyleProfile);
          } catch {}
        } else {
          const loaded = loadScopedProfilesForUser(nextUser, detectedRegionRef.current);
          activeProfile = loaded.profile;
          activeLifestyle = loaded.lifestyle;
        }
        userProfileRef.current = activeProfile;
        lifestyleProfileRef.current = activeLifestyle;
        setUserProfile(activeProfile);
        setLifestyleProfile(activeLifestyle);
      }

      const savedName = activeProfile.displayName?.trim();
      const finalName = savedName || nextUser.name;
      const resolvedUser: User = {
        ...nextUser,
        name: finalName,
        initials: savedName ? deriveInitials(finalName, nextUser.initials) : nextUser.initials,
        profile: activeProfile,
        lifestyleProfile: activeLifestyle
      };

      userRef.current = resolvedUser;
      setUser((prev) => {
        if (
          prev &&
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
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedUser));
      } catch {
        // Ignore storage write issues
      }
    },
    []
  );

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
        fetch('/api/user/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reactivate', userId: authenticatedUser.id })
        }).catch(() => {});
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
      fetch('/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate', userId: authenticatedUser.id })
      }).catch(() => {});
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
        try {
          window.sessionStorage.removeItem(ONBOARDING_DISMISSED_KEY);
        } catch {}
        persistUser(authenticatedUser, { freshAccount: true });
        return;
      } catch (err: unknown) {
        throw formatFirebaseAuthError(err);
      }
    },
    [persistUser]
  );

  const resetProfileToDefaults = useCallback(() => {
    const freshUserProfile = createFreshUserProfile();
    const freshLifestyle = createFreshLifestyleProfile(detectedRegionRef.current);

    userProfileRef.current = freshUserProfile;
    lifestyleProfileRef.current = freshLifestyle;
    setUserProfile(freshUserProfile);
    setLifestyleProfile(freshLifestyle);

    const keys = getProfileStorageKeys(resolveScopeUserId(userRef.current));
    try {
      window.localStorage.removeItem(keys.userProfile);
      window.localStorage.removeItem(keys.lifestyleProfile);
      window.localStorage.removeItem(LEGACY_USER_PROFILE_KEY);
      window.localStorage.removeItem(LEGACY_LIFESTYLE_PROFILE_KEY);
      window.sessionStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    } catch {}

    setUser((current) => {
      if (!current) return current;
      const updated: User = {
        ...current,
        profile: freshUserProfile,
        lifestyleProfile: freshLifestyle
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const sendPasswordReset = useCallback(async () => {
    if (!user || user.isGuest || !user.email) {
      throw new Error(COPY.profile.passwordResetUnavailableToast);
    }
    const { auth } = getFirebaseAuth();
    if (!auth) {
      throw new Error(COPY.profile.passwordResetUnavailableToast);
    }
    await sendPasswordResetEmail(auth, user.email);
  }, [user]);

  const logout = useCallback(async () => {
    const { auth } = getFirebaseAuth();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Silently continue
      }
    }
    try {
      window.sessionStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    } catch {}
    persistUser(null);
    router.push(ROUTES.login);
  }, [persistUser, router]);

  const deactivateAccount = useCallback(async () => {
    const activeUser = user;
    if (activeUser && !activeUser.isGuest) {
      const res = await fetch('/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', userId: activeUser.id })
      });
      if (!res.ok) {
        throw new Error(COPY.profile.actionErrorToast);
      }
    }

    const { auth } = getFirebaseAuth();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Continue local sign-out
      }
    }

    try {
      window.sessionStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    } catch {}
    persistUser(null);
    router.push(ROUTES.login);
  }, [user, persistUser, router]);

  const deleteAccount = useCallback(async () => {
    const activeUser = user;
    if (activeUser && !activeUser.isGuest) {
      const res = await fetch(`/api/user/account?userId=${encodeURIComponent(activeUser.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id })
      });
      if (!res.ok) {
        throw new Error(COPY.profile.actionErrorToast);
      }
    }

    const { auth } = getFirebaseAuth();
    if (auth?.currentUser) {
      try {
        await deleteUser(auth.currentUser);
      } catch {
        // If Firebase requires recent login, still sign out cleanly after wiping data
        try {
          await firebaseSignOut(auth);
        } catch {}
      }
    }

    clearBrowserStorageForAccount({
      userId: activeUser && !activeUser.isGuest ? activeUser.id : undefined,
      includeAuthSession: true
    });

    persistUser(null);
    router.replace(ROUTES.landing);
  }, [user, persistUser, router]);

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
      resetProfileToDefaults,
      sendPasswordReset,
      deactivateAccount,
      deleteAccount,
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
      resetProfileToDefaults,
      sendPasswordReset,
      deactivateAccount,
      deleteAccount,
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
