import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Placeholder type pairing — swap for TDV's actual brand fonts if licensed
// ones exist; these are solid free defaults in the same register.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Source_Serif_4({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TDV Klantenportaal",
  description: "Volg je projecten, content en communicatie met TDV Marketing Solutions op één plek.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
