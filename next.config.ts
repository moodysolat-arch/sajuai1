import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright/baseURL(127.0.0.1)과 localhost 혼용 시 개발 청크 차단 방지
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
