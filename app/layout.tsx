import type { Metadata, Viewport } from "next";
import { Inter, Epilogue, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

// Same pairing as tdvmarketing.be: Inter for body copy, Epilogue for
// headings. Huisstijl v1.1: titles use one weight only (Epilogue 600), Inter
// 300 (large intros) / 400 (UI) / 500 (labels, buttons); JetBrains Mono is
// only for IDs and invoice/order numbers.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500"] });
const display = Epilogue({ subsets: ["latin"], variable: "--font-display", weight: ["600"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400"] });

const title = "TDV Klantenportaal";
const description = "Volg je projecten, content en communicatie met TDV Marketing Solutions op één plek.";

export const metadata: Metadata = {
  // Needed so the relative app/opengraph-image.png resolves to an absolute
  // URL in the og:image/twitter:image tags — without it, link previews in
  // WhatsApp/Slack/etc. silently fail to load the image.
  metadataBase: new URL("https://tdvmarketingsolutions.be"),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: title,
    locale: "nl_BE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  // TDV-brandmark as config-based icons (public/brand/), not as file-based
  // app/icon.png: Next gives file-based icons priority over metadata
  // objects, which would stop the (portal)/(admin) layouts from swapping in
  // an agency's own favicon (see lib/branding-metadata.ts).
  // app/opengraph-image.png (link-preview card) stays file-based — crawlers
  // carry no session, so they only ever see TDV anyway. app/manifest.ts is
  // still TDV-only too (see lib/branding-metadata.ts for why it needn't be).
  icons: {
    // tdv-favicon.svg (huisstijl v1.1: "tdv." op donker, ontworpen voor
    // 16px); de PNG blijft als fallback voor browsers zonder SVG-favicon.
    icon: [
      { url: "/brand/tdv-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/brand/apple-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: "#AF4B2F", // TDV terracotta — tints the browser chrome on mobile
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="overflow-x-hidden bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
