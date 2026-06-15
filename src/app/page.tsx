import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PhotographyTeaser } from "@/components/sections/PhotographyTeaser";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { PORTFOLIO_REVALIDATE_SECONDS } from "@/lib/cache";
import { getPortfolioContent } from "@/lib/cms/queries";
import { getCreativePhotoCount } from "@/lib/photography";

export const revalidate = PORTFOLIO_REVALIDATE_SECONDS;
export const dynamic = "force-static";

export default async function HomePage() {
  const content = await getPortfolioContent();

  return (
    <>
      <HeroSection siteConfig={content.siteConfig} />

      <AboutSection
        aboutContent={content.aboutContent}
        certifications={content.certifications}
        eventHighlights={content.eventHighlights}
        skillCategories={content.skillCategories}
        creativePhotoCount={getCreativePhotoCount(content.creativeCategories)}
      />

      <ProjectsSection projects={content.projects} />

      <ExperienceSection
        certifications={content.certifications}
        eventHighlights={content.eventHighlights}
        experience={content.experience}
      />

      <SkillsSection skillCategories={content.skillCategories} />

      <PhotographyTeaser
        creativeCategories={content.creativeCategories}
        siteConfig={content.siteConfig}
      />

      <ContactSection siteConfig={content.siteConfig} />
    </>
  );
}