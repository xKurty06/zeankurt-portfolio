import type { Metadata } from "next";
import { PhotographyPageContent } from "@/components/photography/PhotographyPageContent";
import { siteConfig } from "@/data/site";
import { getPortfolioContent } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "Photography",
  description: `Photography portfolio by ${siteConfig.name} — ${siteConfig.photographyBrand} and Studio Nomads.`,
};

export default async function PhotographyPage() {
  const content = await getPortfolioContent();

  return <PhotographyPageContent creativeCategories={content.creativeCategories} />;
}
