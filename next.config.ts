import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "qkzacuaqeracjluhusmr.supabase.co";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Enables forbidden()/unauthorized() for the admin area.
    authInterrupts: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // No SVG through the optimiser (CVE class fixed in 16.4.1; keep it disabled anyway).
    dangerouslyAllowSVG: false,
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    // Static assets bypass the proxy: give them the non-CSP security headers too.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
