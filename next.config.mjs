/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@mui/icons-material'],
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/firestore']
  }
};

export default nextConfig;
