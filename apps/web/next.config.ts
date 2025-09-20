import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
    // 还可以加上你常用的本地域名或其他IP
    "https://6af84b4d47c9.ngrok-free.app",
    "192.168.1.148",
  ],
};

export default nextConfig;
