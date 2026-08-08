import type { Metadata } from "next";
import { Inter, Epilogue, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

// Matches the type pairing used on TDV's own marketing site
// (thomasdevoldere.be): Inter for body copy, Epilogue for headings.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Epilogue({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TDV Klantenportaal",
  description: "Volg je projecten, content en communicatie met TDV Marketing Solutions op één plek.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
