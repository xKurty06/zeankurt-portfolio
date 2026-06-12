import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Syne } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import { ScrollProgressBar } from "@/components/animation/ScrollProgressBar";
import { GsapInit } from "@/lib/gsap";
import { LoaderWrapper } from "@/components/animation/LoaderWrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { siteConfig } from "@/data/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — My Personal Portfolio`,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.title}`,
    description: siteConfig.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <GsapInit />
          {/* Page loader */}
          {/* <LoaderWrapper /> */}
          <ScrollProgressBar />
          <ConditionalHeader />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
