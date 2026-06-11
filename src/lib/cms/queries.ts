import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fallbackPortfolioContent } from "@/lib/cms/fallback";
import {
  mapCertification,
  mapEvent,
  mapExperience,
  mapProject,
  mapSkillCategory,
} from "@/lib/cms/mappers";
import type {
  CmsCertificationRow,
  CmsEventRow,
  CmsExperienceRow,
  CmsProjectRow,
  CmsSkillCategoryRow,
  PortfolioContent,
} from "@/lib/cms/types";

const REVALIDATE_SECONDS = 300;

async function fetchPortfolioContent(): Promise<PortfolioContent> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackPortfolioContent;

  try {
    const [
      projectsResult,
      experienceResult,
      certificationsResult,
      eventsResult,
      skillCategoriesResult,
      siteContentResult,
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("year", { ascending: false }),
      supabase
        .from("experience_items")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("certifications")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("event_date", { ascending: false }),
      supabase
        .from("skill_categories")
        .select("*, skills(*)")
        .eq("published", true)
        .order("sort_order", { ascending: true }),
      supabase.from("site_content").select("key,value"),
    ]);

    if (
      projectsResult.error ||
      experienceResult.error ||
      certificationsResult.error ||
      eventsResult.error ||
      skillCategoriesResult.error ||
      siteContentResult.error
    ) {
      return fallbackPortfolioContent;
    }

    const siteRows = (siteContentResult.data ?? []) as Array<{ key: string; value: unknown }>;
    const siteConfig =
      (siteRows.find((row) => row.key === "site_config")?.value as PortfolioContent["siteConfig"] | undefined) ??
      fallbackPortfolioContent.siteConfig;
    const aboutContent =
      (siteRows.find((row) => row.key === "about_content")?.value as PortfolioContent["aboutContent"] | undefined) ??
      fallbackPortfolioContent.aboutContent;

    return {
      siteConfig,
      aboutContent,
      projects: ((projectsResult.data ?? []) as CmsProjectRow[]).map(mapProject),
      experience: ((experienceResult.data ?? []) as CmsExperienceRow[]).map(mapExperience),
      certifications: ((certificationsResult.data ?? []) as CmsCertificationRow[]).map(mapCertification),
      eventHighlights: ((eventsResult.data ?? []) as CmsEventRow[]).map(mapEvent),
      skillCategories: ((skillCategoriesResult.data ?? []) as CmsSkillCategoryRow[]).map(mapSkillCategory),
    };
  } catch {
    return fallbackPortfolioContent;
  }
}

export const getPortfolioContent = unstable_cache(
  fetchPortfolioContent,
  ["portfolio-content"],
  {
    revalidate: REVALIDATE_SECONDS,
    tags: ["portfolio-content"],
  },
);
