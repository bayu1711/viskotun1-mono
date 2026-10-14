import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../index.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Protocol Engine // AI Research & Health Protocols',
  description:
    'An AI-powered digital experience transforming complex peer-reviewed research papers into executable, adaptive, and personalized protocols.',
  keywords: ['health protocols', 'AI research extraction', 'clinical trials', 'personalized medicine', 'rehabilitation'],
  openGraph: {
    title: 'Protocol Engine // AI Research & Health Protocols',
    description: 'Transforming complex research papers into executable daily routines with an adaptive AI safety assistant.',
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
