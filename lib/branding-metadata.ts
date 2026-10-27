import "server-only";
import type { Metadata, Viewport } from "next";
import { getCurrentAgencyBranding } from "@/lib/data/agency-branding";
import { accentTokens, parseHex } from "@/lib/brand/accent";

/**
 * Per-agency <title>/favicon/theme-color for everything behind login. The
 * root layout (app/layout.tsx) keeps TDV's own values as the default: that
 * is what /login, /register and link-preview crawlers see, and what any
 * agency without its own branding falls back to.
 *
 * Bewust niet per-agency: og:image/opengraph-image.png. Crawlers (WhatsApp,
 * Slack, …) komen zonder sessie-cookie binnen, dus er is daar geen
 * ingelogde agency om te herkennen — dat zou een eigen domein per agency
 * vereisen (agencies.custom_domain), wat bij de bredere SaaS-architectuur
 * hoort. app/manifest.ts is nog TDV-vast maar zou wél per agency kunnen:
 * Next zet crossorigin="use-credentials" op de manifest-link, dus die
 * fetch draagt de sessie mee.
 */
export async function generateAgencyMetadata(): Promise<Metadata> {
  const branding = await getCurrentAgencyBranding();
  if (!branding) return {};

  const metadata: Metadata = {};
  if (branding.brand_name) {
    metadata.title = `${branding.brand_name} Klantenportaal`;
  }
  // A dedicated favicon wins; otherwise the uploaded logo is the closest
  // thing the agency has set — better than showing TDV's mark on their portal.
  const icon = branding.favicon_url || branding.logo_url;
  if (icon) {
    metadata.icons = { icon, apple: icon };
  }
  return metadata;
}

export async function generateAgencyViewport(): Promise<Viewport> {
  const branding = await getCurrentAgencyBranding();
  // Same derivation as agencyAccentStyle(): an invalid stored value falls
  // back to the root layout's TDV terracotta instead of a broken meta tag,
  // and a too-light color gets the same AA-adjusted value the UI shows.
  const accent = branding?.accent_color;
  return parseHex(accent) ? { themeColor: accentTokens(accent).accent } : {};
}
