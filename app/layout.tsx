import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.pdtv.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "PDTV | Pakistan Diamond Television",
    template: "%s | PDTV",
  },

  description:
    "PDTV Pakistan Diamond Television delivers the latest news from Pakistan, Sindh and around the world in Sindhi, Urdu and English.",

  keywords: [
    "PDTV",
    "Pakistan Diamond Television",
    "Pakistan news",
    "Sindh news",
    "Sindhi news",
    "Urdu news",
    "English news Pakistan",
    "latest Pakistan news",
    "breaking news Pakistan",
    "Pakistan politics",
    "Pakistan sports",
    "Pakistan business",
  ],

  applicationName: "PDTV",

  authors: [
    {
      name: "PDTV News",
      url: siteUrl,
    },
  ],

  creator: "PDTV Pakistan Diamond Television",
  publisher: "PDTV Pakistan Diamond Television",

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "PDTV",
    title: "PDTV | Pakistan Diamond Television",
    description:
      "Pakistan Ki Awaaz, Duniya Tak — news in Sindhi, Urdu and English.",
    images: [
      {
        url: "/pdtv-logo.png",
        width: 1024,
        height: 1024,
        alt: "PDTV Pakistan Diamond Television",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PDTV | Pakistan Diamond Television",
    description:
      "Latest news from Pakistan, Sindh and around the world.",
    images: ["/pdtv-logo.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/pdtv-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sd" data-scroll-behavior="smooth">
      <body className={geistSans.variable}>
        {children}
      </body>
    </html>
  );
}