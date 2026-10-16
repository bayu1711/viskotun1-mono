import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../index.css';
import { Providers } from './providers';

import { COPY } from '@/data/copy';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: COPY.metadata.title,
  description: COPY.metadata.description,
  keywords: [...COPY.metadata.keywords],
  openGraph: {
    title: COPY.metadata.openGraphTitle,
    description: COPY.metadata.openGraphDescription,
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
