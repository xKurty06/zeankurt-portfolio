import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  hasSupabasePublicEnv,
} from "@/lib/supabase/config";
import {
  PORTFOLIO_CACHE_TAG
} from "@/lib/cache";
import {
  mapCertification,
  mapCreativeCategory,
  mapEvent,
  mapExperience,
  mapProject,
  mapSkillCategory,
} from "@/lib/cms/mappers";
import type {
  CmsCertificationRow,
  CmsCreativeCategoryRow,
  CmsEventRow,
  CmsExperienceRow,
  CmsProjectRow,
  CmsSkillCategoryRow,
  PortfolioContent,
} from "@/lib/cms/types";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    /Could not find the table/i.test(error?.message ?? "")
  );
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function fetchPortfolioContent(): Promise<PortfolioContent> {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Supabase public environment variables are required.");
  }

  const supabase =
    createSupabaseAdminClient() ??
    createClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

  const [
    projectsResult,
    experienceResult,
    certificationsResult,
    eventsResult,
    skillCategoriesResult,
    creativeCategoriesResult,
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
      .order("sort_order", { ascending: true })
      .order("event_date", { ascending: false }),

    supabase
      .from("skill_categories")
      .select("*, skills(*)")
      .eq("published", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("creative_categories")
      .select("*, creative_photos(*)")
      .eq("published", true)
      .order("sort_order", { ascending: true }),

    supabase.from("site_content").select("key,value").eq("key", "site_config"),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (experienceResult.error) throw experienceResult.error;
  if (certificationsResult.error) throw certificationsResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (skillCategoriesResult.error) throw skillCategoriesResult.error;

  const creativeCategoriesMissing =
    creativeCategoriesResult.error &&
    isMissingTableError(creativeCategoriesResult.error);

  if (creativeCategoriesResult.error && !creativeCategoriesMissing) {
    throw creativeCategoriesResult.error;
  }

  if (siteContentResult.error) throw siteContentResult.error;

  const siteRows = (siteContentResult.data ?? []) as Array<{
    key: string;
    value: unknown;
  }>;

  const siteConfig = siteRows.find((row) => row.key === "site_config")
    ?.value as PortfolioContent["siteConfig"] | undefined;

  if (!siteConfig) {
    throw new Error("Required site_config content is missing from Supabase.");
  }

  const projects = uniqueBy(
    ((projectsResult.data ?? []) as CmsProjectRow[]).map(mapProject),
    (project) => project.slug,
  );

  const experience = uniqueBy(
    ((experienceResult.data ?? []) as CmsExperienceRow[]).map(mapExperience),
    (item) => item.id,
  );

  const certifications = uniqueBy(
    ((certificationsResult.data ?? []) as CmsCertificationRow[]).map(
      mapCertification,
    ),
    (cert) => cert.image ?? `${cert.issuer}-${cert.name}-${cert.issued ?? ""}`,
  );

  const eventHighlights = uniqueBy(
    ((eventsResult.data ?? []) as CmsEventRow[]).map(mapEvent),
    (event) => event.id,
  );

  const skillCategories = uniqueBy(
    ((skillCategoriesResult.data ?? []) as CmsSkillCategoryRow[]).map(
      mapSkillCategory,
    ),
    (category) => category.name,
  );

  const creativeCategories = creativeCategoriesResult.error
    ? []
    : uniqueBy(
        ((creativeCategoriesResult.data ?? []) as CmsCreativeCategoryRow[]).map(
          mapCreativeCategory,
        ),
        (category) => category.slug,
      );

  return {
    siteConfig,
    projects,
    experience,
    certifications,
    eventHighlights,
    skillCategories,
    creativeCategories,
  };
}

export const getPortfolioContent = unstable_cache(
  fetchPortfolioContent,
  [PORTFOLIO_CACHE_TAG],
  {
    revalidate: 60,
    tags: [PORTFOLIO_CACHE_TAG],
  },
);
