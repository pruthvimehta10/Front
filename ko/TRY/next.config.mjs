/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/video',
        destination: 'http://localhost:4000/api/video',
      },
      {
        source: '/api/video/:path*',
        destination: 'http://localhost:4000/api/video/:path*',
      }
    ]
  },
}

export default nextConfig
