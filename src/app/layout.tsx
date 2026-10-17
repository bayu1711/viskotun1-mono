import React from 'react';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import '../index.css';
import { Providers } from './providers';

import { COPY } from '@/data/copy';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://viskotun1.app'),
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
        width: 1013,
        height: 246,
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
  return (
    <html lang={COPY.metadata.lang} className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
