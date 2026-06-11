import { projects } from "@/data/projects";
import {
  certifications,
  eventHighlights,
  experience,
  skillCategories,
} from "@/data/skills";
import { aboutContent, siteConfig } from "@/data/site";
import type { PortfolioContent } from "@/lib/cms/types";

export const fallbackPortfolioContent: PortfolioContent = {
  siteConfig,
  aboutContent,
  projects,
  experience,
  certifications,
  eventHighlights,
  skillCategories,
};
