import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Youth Red Crescent Team — Rangpur Govt. Polytechnic Institute",
    template: "%s | Youth Red Crescent RPI",
  },
  description:
    "Official website of Youth Red Crescent Team, Rangpur Govt. Polytechnic Institute — Bangladesh Red Crescent Society youth wing. Blood donation, disaster response, events & live emergency notices.",
  keywords: [
    "Youth Red Crescent", "Rangpur Polytechnic", "BDRCS", "blood donation Rangpur",
    "Red Crescent Bangladesh", "রেড ক্রিসেন্ট",
  ],
  icons: { icon: "/logos/bdrcs.png" },
  openGraph: {
    title: "Youth Red Crescent Team — RPI",
    description: "Serving humanity at Rangpur Govt. Polytechnic Institute",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e30613",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className="font-app antialiased bg-background text-foreground min-h-screen flex flex-col"
      >
        <AppProviders>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
