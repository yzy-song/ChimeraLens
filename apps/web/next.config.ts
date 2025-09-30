import type { NextConfig } from "next";

const runtimeCaching = require("next-pwa/cache");
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = withPWA({
  typedRoutes: true,
  images: {
    remotePatterns: [
      // cloudinary图库
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        pathname: "/**",
      },
      // 占位符图片服务
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },

  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "https://6af84b4d47c9.ngrok-free.app",
    "192.168.1.147",
  ],
});

export default nextConfig;
