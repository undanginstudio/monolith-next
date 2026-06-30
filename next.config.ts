import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // TypeScript & ESLint — fail the production build on any type error
  // ---------------------------------------------------------------------------
  typescript: {
    ignoreBuildErrors: false,
  },

  // ---------------------------------------------------------------------------
  // Server Actions — increase body size limit for file/image upload payloads
  // ---------------------------------------------------------------------------
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // ---------------------------------------------------------------------------
  // Server External Packages
  // Prevent bundling native/heavy packages that must run on the Node.js runtime.
  // `postgres` uses native bindings that must NOT be bundled by webpack.
  // ---------------------------------------------------------------------------
  serverExternalPackages: ["postgres"],

  // ---------------------------------------------------------------------------
  // Image Optimization — allowlist Supabase storage domain
  // ---------------------------------------------------------------------------
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Headers — baseline security headers for all routes
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
