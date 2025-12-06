/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,

    // ⭐ thêm mục này để Next cho phép ảnh từ Static OSM
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'staticmap.openstreetmap.de',
        pathname: '/staticmap.php',
      },
      {
        protocol: 'https',
        hostname: 'tile.openstreetmap.org',
      }
    ],
  },

  allowedDevOrigins: [
    'http://localhost:3000',
    'http://192.168.186.1:3000',
    'http://192.168.8.1:3000'
  ],
}

export default nextConfig
