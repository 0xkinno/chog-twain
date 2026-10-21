import type { NextConfig } from "next";

import { fileURLToPath } from "node:url";

const config: NextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // viem and wagmi ship ESM; the optional wallet SDKs are not used unless NEXT_PUBLIC_WC_PROJECT_ID is set
  webpack: (cfg) => {
    cfg.resolve.fallback = { ...(cfg.resolve.fallback ?? {}), "pino-pretty": false, lokijs: false, encoding: false };
    return cfg;
  },
  async headers() {
    return [
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
    ];
  },
};
export default config;