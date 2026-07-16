/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allows us to proxy or upload dummy files locally
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
