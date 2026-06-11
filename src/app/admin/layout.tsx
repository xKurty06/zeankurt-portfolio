import { CustomCursor } from "@/components/animation/CustomCursor";
import { ScrollProgressBar } from "@/components/animation/ScrollProgressBar";
import { GsapInit } from "@/lib/gsap";
// Loader intentionally omitted from admin layout to avoid blocking scroll
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <GsapInit />
          <ScrollProgressBar />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
