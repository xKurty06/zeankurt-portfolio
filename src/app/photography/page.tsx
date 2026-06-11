import type { Metadata } from "next";
import { PhotographyPageContent } from "@/components/photography/PhotographyPageContent";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Photography",
  description: `Photography portfolio by ${siteConfig.name} — ${siteConfig.photographyBrand} and Studio Nomads.`,
};

export default function PhotographyPage() {
  return <PhotographyPageContent />;
}
