import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Fredoka, Nunito, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/wallet/Providers";
import { NavCapsule } from "@/components/ui/NavCapsule";
import { Footer } from "@/components/landing/Footer";
import { SITE_URL } from "@/lib/contracts";

const bagel = Bagel_Fat_One({ weight: "400", subsets: ["latin"], variable: "--font-bagel", display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-nunito", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], style: ["italic"], variable: "--font-fraunces", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Chog Twain: every Chog is looking at someone", template: "%s | Chog Twain" },
  description: "Two people, two Chogs that look at each other. Every day you both show up, they step closer. A meeting cannot be bought or rushed.",
  icons: { icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/brand/mark.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" },
  openGraph: { title: "Chog Twain", description: "Every Chog is looking at someone. Pick one, send it to a friend, show up every day.", images: ["/og/home"], type: "website" },
  twitter: { card: "summary_large_image", images: ["/og/home"] },
};
export const viewport: Viewport = { themeColor: "#fbf9ff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bagel.variable} ${fredoka.variable} ${nunito.variable} ${fraunces.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <a href="#main" className="sr-only">Skip to content</a>
          <NavCapsule />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}