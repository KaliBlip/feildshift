import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScalarField | Field Shift Agro-Climate Decision Studio",
    short_name: "Field Shift",
    description:
      "NASA Earth observations, Evidence Passports, and bilingual EN/Twi crop-rotation intelligence for Ashanti smallholder farming.",
    start_url: "/workspace",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a3d28",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/globe.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
