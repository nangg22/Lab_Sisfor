import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // cacheComponents: false karena app menggunakan auth per-request (cookies)
  // Ref: https://nextjs.org/docs/messages/middleware-to-proxy
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
