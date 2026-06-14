import { ScrollProgressBar } from "@/components/animation/ScrollProgressBar";
import { GsapInit } from "@/lib/gsap";
// Loader intentionally omitted from admin layout to avoid blocking scroll

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <GsapInit />
      <ScrollProgressBar />
      <main className="flex-1">{children}</main>
    </>
  );
}
