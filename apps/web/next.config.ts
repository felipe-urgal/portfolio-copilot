import type { NextConfig } from "next";

const allowedDevOrigin = process.env.DEV_ALLOWED_ORIGIN;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@portfolio-copilot/domain", "@portfolio-copilot/shared"],
  allowedDevOrigins: allowedDevOrigin ? [allowedDevOrigin] : [],
};

export default nextConfig;