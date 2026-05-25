import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — allow all project subdomains
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase Storage (legacy/custom domains)
        protocol: "https",
        hostname: "euofrdvgcwxzyzjbueoc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
