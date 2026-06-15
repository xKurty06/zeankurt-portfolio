import type { Metadata } from "next";
import { PhotographyPageContent } from "@/components/photography/PhotographyPageContent";
import { getPortfolioContent } from "@/lib/cms/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { siteConfig } = await getPortfolioContent();

  return {
    title: "Photography",
    description: `Photography portfolio by ${siteConfig.name} — ${siteConfig.photographyBrand} and Studio Nomads.`,
  };
}

export default async function PhotographyPage() {
  const content = await getPortfolioContent();

  return (
    <PhotographyPageContent
      creativeCategories={content.creativeCategories}
      siteConfig={content.siteConfig}
    />
  );
}