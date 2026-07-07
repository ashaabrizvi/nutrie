import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

// Serwist's webpack-based build step isn't compatible with Turbopack
// (the default dev/build bundler in Next.js 16), so it's only wired in
// for the production (--webpack) build. `next dev` runs plain Turbopack.
export default process.env.NODE_ENV === "production"
  ? withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js" })(nextConfig)
  : nextConfig;
