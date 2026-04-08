import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import CookieConsent from "@/components/cookie-consent";
import "./globals.css";

const siteUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Track Your Time",
    template: "%s | Track Your Time",
  },
  description:
    "A simple and powerful time tracking tool. Log your work, manage projects, and gain insights into how you spend your time.",
  keywords: [
    "time tracking",
    "time management",
    "productivity",
    "project management",
    "work log",
    "time log",
  ],
  authors: [{ name: "Track Your Time" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Track Your Time",
    title: "Track Your Time",
    description:
      "A simple and powerful time tracking tool. Log your work, manage projects, and gain insights into how you spend your time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Time",
    description:
      "A simple and powerful time tracking tool. Log your work, manage projects, and gain insights into how you spend your time.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
