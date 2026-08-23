import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "妈妈的足迹手账",
    short_name: "足迹手账",
    description: "私人旅行与生活足迹手账",
    start_url: "/footprints",
    display: "standalone",
    background_color: "#f6f0e5",
    theme_color: "#61745d",
    orientation: "portrait",
    icons: [
      {
        src: "/footprints-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
