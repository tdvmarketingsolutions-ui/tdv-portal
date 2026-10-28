import type { MetadataRoute } from "next";
import { getCurrentAgencyBranding, type AgencyBranding } from "@/lib/data/agency-branding";
import { accentTokens, parseHex } from "@/lib/brand/accent";

const TDV_MANIFEST: MetadataRoute.Manifest = {
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

// Launcher-labels worden na ~12 tekens afgekapt; een langere agency-naam
// wordt dan "Portaal" in plaats van een half woord.
const SHORT_NAME_MAX = 12;

/**
 * PWA-manifest per agency, zelfde bron en fallback als de <title>/favicon/
 * theme-color in lib/branding-metadata.ts. Next zet
 * crossorigin="use-credentials" op de manifest-link, dus wie ingelogd
 * "Zet op beginscherm" kiest, krijgt de naam, het icoon en de kleur van
 * zijn eigen agency. Anoniem (landingspagina, /login) of zonder eigen
 * branding blijft het TDV — net als voorheen.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let branding: AgencyBranding | null = null;
  try {
    branding = await getCurrentAgencyBranding();
  } catch {
    // Een manifest dat faalt breekt "installeren" helemaal; TDV tonen is
    // altijd beter dan een 500.
    return TDV_MANIFEST;
  }
  if (!branding) return TDV_MANIFEST;

  const manifest: MetadataRoute.Manifest = { ...TDV_MANIFEST };
  const name = branding.brand_name?.trim();
  if (name) {
    manifest.name = `${name} Klantenportaal`;
    manifest.short_name = name.length <= SHORT_NAME_MAX ? name : "Portaal";
    manifest.description = `Volg je projecten, content en communicatie met ${name} op één plek.`;
  }
  // Zelfde volgorde als het favicon: een eigen favicon wint, anders het
  // logo. De afmetingen van een upload kennen we niet, dus geen `sizes`:
  // beter het eigen icoon zonder maat dan het TDV-merk op hun portaal.
  const icon = branding.favicon_url || branding.logo_url;
  if (icon) {
    manifest.icons = [{ src: icon, purpose: "any" }];
  }
  if (parseHex(branding.accent_color)) {
    manifest.theme_color = accentTokens(branding.accent_color).accent;
  }
  return manifest;
}
