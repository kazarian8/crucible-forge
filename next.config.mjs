/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/studio", destination: "/sound-furnace", permanent: true },
      { source: "/mastering", destination: "/sound-furnace", permanent: true },
    ];
  },
};

export default nextConfig;
