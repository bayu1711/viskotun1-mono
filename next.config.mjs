import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/**
 * Baseline security headers for every response. The CSP limits framing, plugins, base
 * URLs and form targets without restricting scripts, so Firebase sign-in popups and
 * Next.js inline bootstrapping keep working. Tighten script-src with nonces later.
 */
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
  },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()'
  }
];

/** @type {import('next').NextConfig} */
const configFunction = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    output: 'standalone',
    images: {
      unoptimized: true
    },
    distDir: process.env.NEXT_DIST_DIR || (isDev ? '.next-dev' : '.next'),
    transpilePackages: ['@mui/icons-material'],
    serverExternalPackages: ['@google-cloud/firestore'],
    async headers() {
      return [
        {
          source: '/:path*',
          headers: SECURITY_HEADERS
        }
      ];
    }
  };
};

export default configFunction;
