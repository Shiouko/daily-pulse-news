/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_NEWS_API_URL: process.env.NEWS_API_URL || '/api/news',
  },
};

module.exports = nextConfig;
