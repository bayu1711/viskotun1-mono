/**
 * Firebase Client SDK Initialization
 * Provides Google Auth Provider & Firebase Auth singleton.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

interface FirebaseRuntimeConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: FirebaseRuntimeConfig;
  }
}

export function getFirebaseConfig(): FirebaseRuntimeConfig {
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
    return window.__FIREBASE_CONFIG__;
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'gen-lang-client-0064688276';

  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      'AIzaSyB6edKU-gKOcCliCC3MrBJCGIhdkhWJcPY',
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      'viskotun1-media-0064688276',
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      '536575310594',
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      '1:536575310594:web:2252e378e1e4dbabe1a01b'
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!app && isFirebaseConfigured()) {
    try {
      const config = getFirebaseConfig();
      app = getApps().length ? getApp() : initializeApp(config);
    } catch (err) {
      console.warn('[Firebase] Client initialization failed:', err);
      return null;
    }
  }
  return app;
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey &&
      (config.projectId || process.env.GOOGLE_CLOUD_PROJECT)
  );
}

export function getFirebaseAuth(): {
  auth: Auth | null;
  googleProvider: GoogleAuthProvider | null;
} {
  if (typeof window === 'undefined') {
    return { auth: null, googleProvider: null };
  }

  if (!auth && isFirebaseConfigured()) {
    try {
      const firebaseApp = getFirebaseApp();
      if (firebaseApp) {
        auth = getAuth(firebaseApp);
        googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      }
    } catch (err) {
      console.warn('[Firebase] Auth initialization failed, operating in evaluation mode:', err);
      return { auth: null, googleProvider: null };
    }
  }

  return { auth, googleProvider };
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!storage && isFirebaseConfigured()) {
    try {
      const firebaseApp = getFirebaseApp();
      if (firebaseApp) {
        const config = getFirebaseConfig();
        const rawBucket = config.storageBucket || 'viskotun1-media-0064688276';
        const bucketUrl = rawBucket.startsWith('gs://') ? rawBucket : `gs://${rawBucket}`;
        storage = getStorage(firebaseApp, bucketUrl);
      }
    } catch (err) {
      console.warn('[Firebase] Storage initialization failed:', err);
      return null;
    }
  }

  return storage;
}
