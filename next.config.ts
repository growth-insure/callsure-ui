import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "www.givemeinsurance.com",
  //       pathname: "/images/**", // This will allow all paths under /images/
  //     },
  //   ],
  // },
  // Other config options can go here
};

export default nextConfig;
