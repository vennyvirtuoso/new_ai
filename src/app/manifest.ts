import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frontier Brief — AI Research & Deep-Tech News",
    short_name: "Frontier Brief",
    description:
      "Worldwide AI/ML research, major labs, quantum computing, adjacent frontier tech, and entrepreneurship.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#faf9f6",
    theme_color: "#141413",
    categories: ["news", "education", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
