import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const configFunction = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    output: 'standalone',
    distDir: process.env.NEXT_DIST_DIR || (isDev ? '.next-dev' : '.next'),
    transpilePackages: ['@mui/icons-material'],
    experimental: {
      serverComponentsExternalPackages: ['@google-cloud/firestore']
    },
    webpack: (config) => {
      return config;
    }
  };
};

export default configFunction;
