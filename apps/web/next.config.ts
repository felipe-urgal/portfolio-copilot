import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@portfolio-copilot/domain", "@portfolio-copilot/shared"],
};

export default nextConfig;
