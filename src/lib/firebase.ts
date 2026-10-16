/**
 * Firebase Client SDK Initialization
 * Provides Google Auth Provider & Firebase Auth singleton.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    `${process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0064688276'}.firebaseapp.com`,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'gen-lang-client-0064688276',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0064688276'}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT)
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
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
    } catch (err) {
      console.warn('[Firebase] Client initialization failed, operating in evaluation mode:', err);
      return { auth: null, googleProvider: null };
    }
  }

  return { auth, googleProvider };
}
