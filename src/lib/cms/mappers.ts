import type {
  CmsCertificationRow,
  CmsCreativeCategoryRow,
  CmsEventRow,
  CmsExperienceRow,
  CmsProjectRow,
  CmsSkillCategoryRow,
} from "@/lib/cms/types";
import type {
  Certification,
  CreativeCategory,
  EventHighlight,
  ExperienceItem,
  Project,
  SkillCategory,
} from "@/types";

function formatEventDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapProject(row: CmsProjectRow): Project {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    tags: row.tags ?? [],
    githubUrl: row.github_url ?? undefined,
    liveUrl: row.live_url ?? undefined,
    image: row.image_path ?? "",
    imageSeed: row.image_seed || row.slug,
    year: row.year,
    role: row.role,
    featured: row.featured,
    status: row.status ?? undefined,
  };
}

export function mapExperience(row: CmsExperienceRow): ExperienceItem {
  return {
    id: row.slug,
    organization: row.organization,
    role: row.role,
    period: row.period,
    description: row.description,
    type: row.type,
  };
}

export function mapCertification(row: CmsCertificationRow): Certification {
  return {
    id: row.id ?? row.image_path ?? `${row.issuer}-${row.name}`,
    name: row.name,
    issuer: row.issuer,
    issued: row.issued ?? undefined,
    expires: row.expires ?? undefined,
    image: row.image_path ?? undefined,
  };
}

export function mapEvent(row: CmsEventRow): EventHighlight {
  const year = row.year || new Date(`${row.event_date}T00:00:00`).getFullYear().toString();

  return {
    id: row.slug,
    title: row.title,
    date: formatEventDate(row.event_date),
    year,
    venue: row.venue,
    organizers: row.organizers ?? undefined,
    role: row.role ?? undefined,
    category: row.category ?? undefined,
  };
}

export function mapSkillCategory(row: CmsSkillCategoryRow): SkillCategory {
  return {
    name: row.name,
    skills: (row.skills ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((skill) => skill.name),
  };
}

export function mapCreativeCategory(row: CmsCreativeCategoryRow): CreativeCategory {
  const photos = (row.creative_photos ?? [])
    .filter((photo) => photo.published)
    .slice()
    .sort((a, b) => {
      const sortOrderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const sortOrderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;

      if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;

      const createdAtA = new Date(a.created_at).getTime();
      const createdAtB = new Date(b.created_at).getTime();

      if (createdAtA !== createdAtB) return createdAtB - createdAtA;

      return a.id.localeCompare(b.id);
    })
    .map((photo) => ({
      id: photo.id,
      title: photo.title,
      category: row.name,
      albumSlug: row.slug,
      imageSeed: photo.id,
      image: photo.image_path,
      aspectRatio: photo.aspect_ratio,
      featured: photo.featured,
      sortOrder: photo.sort_order ?? Number.MAX_SAFE_INTEGER,
      createdAt: photo.created_at,
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    showcaseImage: row.showcase_image_path ?? photos[0]?.image,
    sortOrder: row.sort_order ?? 0,
    photos,
  };
}
