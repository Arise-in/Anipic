import type { Metadata, Viewport } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import { Providers } from "@/components/Providers";
import { PWARegister } from "@/components/PWARegister";
import Script from "next/script";

const siteUrl = "https://anipic.aniflix.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AniPic - Free Unlimited Image CDN & Hosting | By Aniflix",
    template: "%s | AniPic",
  },
  description: "Lightning fast, unlimited free image hosting powered by GitHub CDN. Upload images instantly, get shareable links, embed anywhere. No signup required. Made by Aniflix Developer Team.",
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
  keywords: [
    "image hosting",
    "free image hosting",
    "image CDN",
    "free CDN",
    "github image hosting",
    "image upload",
    "share images",
    "unlimited storage",
    "anime images",
    "aniflix",
    "image sharing",
    "photo hosting",
    "picture hosting",
    "image link generator",
    "direct image link",
    "embed images",
  ],
  authors: [{ name: "Aniflix Developer Team", url: "https://aniflix.in" }],
  creator: "Aniflix Developer Team",
  publisher: "Aniflix",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AniPic",
    title: "AniPic - Free Unlimited Image CDN & Hosting",
    description: "Lightning fast, unlimited free image hosting powered by GitHub CDN. Upload images instantly, get shareable links, embed anywhere. No signup required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AniPic - Free Unlimited Image CDN & Hosting",
    description: "Lightning fast, unlimited free image hosting powered by GitHub CDN. Upload images instantly, get shareable links, embed anywhere.",
    creator: "@aniflix_in",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
  verification: {
    google: "your-google-verification-code",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AniPic",
  description: "Lightning fast, unlimited free image hosting powered by GitHub CDN. Upload images instantly, get shareable links, embed anywhere.",
  url: siteUrl,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "Aniflix",
    url: "https://aniflix.in",
  },
  featureList: [
    "Unlimited free image hosting",
    "Lightning fast CDN",
    "No signup required",
    "Direct image links",
    "API access",
    "Embed anywhere",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
