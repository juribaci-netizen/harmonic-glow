/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "stream.filharmonia.art" },
      { protocol: "https", hostname: "www.bhsfestival.sk" },
      { protocol: "https", hostname: "operaslovakia.sk" },
    ],
  },
}

export default nextConfig
