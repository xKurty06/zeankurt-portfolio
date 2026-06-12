import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PhotographyTeaser } from "@/components/sections/PhotographyTeaser";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { getPortfolioContent } from "@/lib/cms/queries";
import { getCreativePhotoCount } from "@/lib/photography";

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
      <PhotographyTeaser creativeCategories={content.creativeCategories} />
      <ContactSection siteConfig={content.siteConfig} />
    </>
  );
}
