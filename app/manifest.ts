import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TDV Klantenportaal",
    short_name: "TDV Portaal",
    description: "Volg je projecten, content en communicatie met TDV Marketing Solutions op één plek.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4F0EE",
    theme_color: "#AF4B2F",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
