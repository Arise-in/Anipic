import type { Metadata, Viewport } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import { Providers } from "@/components/Providers";
import { PWARegister } from "@/components/PWARegister";
import Script from "next/script";

export const metadata: Metadata = {
  title: "AniPic - Free Image CDN | By Aniflix",
  description: "Lightning fast, unlimited image hosting powered by GitHub. Get instant shareable links with a stunning interface. Made by Aniflix Developer Team.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
    shortcut: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AniPic",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "AniPic",
  keywords: ["image hosting", "CDN", "free", "github", "image upload", "share images", "aniflix", "anime"],
  authors: [{ name: "Aniflix Developer Team", url: "https://aniflix.in" }],
  openGraph: {
    type: "website",
    siteName: "AniPic",
    title: "AniPic - Free Image CDN | By Aniflix",
    description: "Lightning fast, unlimited image hosting powered by GitHub. Made by Aniflix Developer Team.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AniPic - Free Image CDN | By Aniflix",
    description: "Lightning fast, unlimited image hosting powered by GitHub. Made by Aniflix Developer Team.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff0040",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="ca3c1284-24c0-4ee4-bee9-466b6e786097"
        />
          <Providers>{children}</Providers>
          <PWARegister />
          <VisualEditsMessenger />
      </body>
    </html>
  );
}
