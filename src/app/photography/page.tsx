import type { Metadata } from "next";
import { PhotographyPageContent } from "@/components/photography/PhotographyPageContent";
import { PORTFOLIO_REVALIDATE_SECONDS } from "@/lib/cache";
import { getPortfolioContent } from "@/lib/cms/queries";

export const revalidate = PORTFOLIO_REVALIDATE_SECONDS;
export const dynamic = "force-static";

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