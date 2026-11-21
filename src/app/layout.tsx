import React from 'react';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import '../index.css';
import { Providers } from './providers';

import { COPY } from '@/data/copy';
import { DEFAULT_FIREBASE_CONFIG } from '@/lib/firebase';

// Figtree: calm, compact geometric sans for body and UI. Bricolage Grotesque: warm display face for headings.
const bodyFont = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trialn1.app'),
  title: COPY.metadata.title,
  description: COPY.metadata.description,
  keywords: [...COPY.metadata.keywords],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: COPY.metadata.openGraphTitle,
    description: COPY.metadata.openGraphDescription,
    type: 'website',
    images: [
      {
        url: COPY.brand.logoUrl,
        width: 1153,
        height: 302,
        alt: COPY.brand.name,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const runtimeFirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      `${process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_FIREBASE_CONFIG.projectId}.firebaseapp.com`,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      DEFAULT_FIREBASE_CONFIG.appId
  };

  return (
    <html lang={COPY.metadata.lang} className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        {runtimeFirebaseConfig && (
          <script
            id="firebase-runtime-config"
            dangerouslySetInnerHTML={{
              __html: `window.__FIREBASE_CONFIG__ = ${JSON.stringify(runtimeFirebaseConfig)};`
            }}
          />
        )}
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
