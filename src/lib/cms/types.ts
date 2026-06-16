import type {
  Certification,
  CreativeCategory,
  EventHighlight,
  ExperienceItem,
  Project,
  SkillCategory,
} from "@/types";
import type { SiteConfig } from "@/types/site";

export interface PortfolioContent {
  siteConfig: SiteConfig;
  projects: Project[];
  experience: ExperienceItem[];
  certifications: Certification[];
  eventHighlights: EventHighlight[];
  skillCategories: SkillCategory[];
  creativeCategories: CreativeCategory[];
}

export interface CmsProjectRow {
  slug: string;
  title: string;
  description: string;
  long_description: string | null;
  tags: string[] | null;
  github_url: string | null;
  live_url: string | null;
  image_path: string | null;
  image_seed: string | null;
  year: string;
  role: string;
  featured: boolean;
  status: Project["status"] | null;
  sort_order: number | null;
  published: boolean;
}

export interface CmsExperienceRow {
  slug: string;
  organization: string;
  role: string;
  period: string;
  description: string;
  type: ExperienceItem["type"];
  sort_order: number | null;
  published: boolean;
}

export interface CmsCertificationRow {
  id?: string;
  name: string;
  issuer: string;
  issued: string | null;
  expires: string | null;
  image_path: string | null;
  sort_order: number | null;
  published: boolean;
}

export interface CmsEventRow {
  slug: string;
  title: string;
  event_date: string;
  year: string | null;
  venue: string;
  organizers: string | null;
  role: string | null;
  category: EventHighlight["category"] | null;
  image_path: string | null;
  sort_order: number | null;
  published: boolean;
}

export interface CmsSkillCategoryRow {
  id: string;
  name: string;
  sort_order: number | null;
  published: boolean;
  skills?: CmsSkillRow[];
}

export interface CmsSkillRow {
  id: string;
  category_id: string;
  name: string;
  sort_order: number | null;
}

export interface CmsCreativeCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  showcase_image_path: string | null;
  sort_order: number | null;
  published: boolean;
  creative_photos?: CmsCreativePhotoRow[];
}

export interface CmsCreativePhotoRow {
  id: string;
  category_id: string;
  title: string;
  image_path: string;
  aspect_ratio: "portrait" | "landscape" | "square";
  featured: boolean;
  sort_order: number | null;
  published: boolean;
}
