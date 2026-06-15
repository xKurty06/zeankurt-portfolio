import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ScrollProgressBar } from "@/components/animation/ScrollProgressBar";
import { LoaderWrapper } from "@/components/animation/LoaderWrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Footer } from "@/components/layout/Footer";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import { SavingIndicator } from "@/components/ui/SavingIndicator";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { PORTFOLIO_REVALIDATE_SECONDS } from "@/lib/cache";
import { getPortfolioContent } from "@/lib/cms/queries";
import { GsapInit } from "@/lib/gsap";
import { SavingProvider } from "@/lib/saving";
import "./globals.css";

export const revalidate = PORTFOLIO_REVALIDATE_SECONDS;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { siteConfig } = await getPortfolioContent();

  return {
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
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { siteConfig } = await getPortfolioContent();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SavingProvider>
            <GsapInit />
            <LoaderWrapper />
            <ScrollProgressBar />
            <ConditionalHeader siteConfig={siteConfig} />

            {children}

            <Footer siteConfig={siteConfig} />
            <ScrollToTopButton />
            <SavingIndicator />
          </SavingProvider>
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  );
}