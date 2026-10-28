import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Profile photo uploads: the browser shrinks photos first (~200 KB), but
      // without JavaScript a phone photo is sent as is (several MB).
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
