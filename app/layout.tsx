import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "PDTV — Pakistan Diamond Television",
    template: "%s | PDTV",
  },
  description: "Pakistan Ki Awaaz, Duniya Tak — English, Urdu and Sindhi news from PDTV.",
  keywords: ["PDTV", "Pakistan news", "Urdu news", "Sindhi news", "Pakistan Diamond Television"],
  openGraph: {
    type: "website",
    title: "PDTV — Pakistan Diamond Television",
    description: "Pakistan Ki Awaaz, Duniya Tak",
    siteName: "PDTV",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable}`}>{children}</body>
    </html>
  );
}
