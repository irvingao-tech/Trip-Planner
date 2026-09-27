import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "旅日手帖 · Japan Trip Planner",
    short_name: "旅日手帖",
    description: "日本旅行行程、美食与购物计划",
    start_url: ".",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#f6f3ee",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
