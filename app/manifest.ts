import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crucible Forge",
    short_name: "Crucible",
    description: "Private browser-based audio analysis and quick remastering.",
    start_url: "/",
    display: "standalone",
    background_color: "#070605",
    theme_color: "#f97316",
    icons: [{ src: "/crucible-logo.png", sizes: "512x512", type: "image/png" }],
  };
}
