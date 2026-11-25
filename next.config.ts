import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Logo dibaca oleh penjana PDF invois
  outputFileTracingIncludes: { "/o/[slug]/langganan/invois/[id]/pdf": ["./public/brand/imarix-logo.png"] },
};

export default nextConfig;
