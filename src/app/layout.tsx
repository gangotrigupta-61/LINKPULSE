import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LinkPulse — Smart URL Shortener & Analytics",
    template: "%s | LinkPulse",
  },
  description:
    "LinkPulse is a fast, production-quality URL shortener with real-time analytics. Track clicks, devices, browsers, and referrers for every short link you create.",
  keywords: ["url shortener", "link analytics", "short links", "bitly alternative"],
  authors: [{ name: "LinkPulse" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "LinkPulse — Smart URL Shortener & Analytics",
    description:
      "Create short links and track every click with detailed analytics.",
    type: "website",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
