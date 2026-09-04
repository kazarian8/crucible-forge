/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.supabase.co; media-src 'self' blob: data:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; worker-src 'self' blob:; upgrade-insecure-requests",
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Origin-Agent-Cluster", value: "?1" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(self), geolocation=(), payment=(self), usb=(), serial=(), bluetooth=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/studio", destination: "/sound-furnace", permanent: true },
      { source: "/mastering", destination: "/sound-furnace", permanent: true },
    ];
  },
};

export default nextConfig;
