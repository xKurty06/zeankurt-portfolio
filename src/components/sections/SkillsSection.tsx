"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { skillCategories } from "@/data/skills";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { GlowCard } from "@/components/animation/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

export function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();

      const cards = gsap.utils.toArray<HTMLElement>("[data-skill-card]");
      const section = sectionRef.current;

      cards.forEach((card, ci) => {
        // Card spring-in
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 50, scale: 0.93, rotateX: 8 },
          {
            autoAlpha: 1, y: 0, scale: 1, rotateX: 0,
            duration: 0.8, delay: ci * 0.07,
            ease: "back.out(1.3)",
            scrollTrigger: {
              trigger: card, start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );

        // Badge "ping" scatter on scroll
        const badges = card.querySelectorAll<HTMLElement>("[data-badge-item]");
        if (badges.length) {
          gsap.fromTo(
            badges,
            { autoAlpha: 0, scale: 0.5, y: 12, rotation: (i: number) => (i % 2 === 0 ? -8 : 8) },
            {
              autoAlpha: 1, scale: 1, y: 0, rotation: 0,
              duration: 0.5, stagger: { amount: 0.4, ease: "power2.out" },
              ease: "back.out(2)",
              delay: ci * 0.07 + 0.18,
              scrollTrigger: {
                trigger: card, start: "top 90%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }
      });

      if (section) {
        const onMove = (event: MouseEvent) => {
          const sectionRect = section.getBoundingClientRect();
          section.style.setProperty("--skills-bg-x", `${event.clientX - sectionRect.left}px`);
          section.style.setProperty("--skills-bg-y", `${event.clientY - sectionRect.top}px`);
        };

        section.addEventListener("mousemove", onMove);

        return () => {
          section.removeEventListener("mousemove", onMove);
        };
      }
    },
    { scope: sectionRef },
  );

  return (
    <Section id="skills" ref={sectionRef}>
      <div aria-hidden className="skills-ambient-bg">
        <span className="skills-bg-stream skills-bg-stream-a" />
        <span className="skills-bg-stream skills-bg-stream-b" />
        <span className="skills-bg-dot skills-bg-dot-a" />
        <span className="skills-bg-dot skills-bg-dot-b" />
        <span className="skills-bg-dot skills-bg-dot-c" />
      </div>

      <Container className="relative z-10">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Skills"
            title="Stack, systems, and creative tooling."
            description="Full-stack development for websites, web systems, and software products, paired with media production work shaped by hackathons, templates, and real client projects."
          />
        </RevealOnScroll>

        <div
          className="relative mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          style={{ perspective: 1200 }}
        >
          {skillCategories.map((category) => (
            <GlowCard
              key={category.name}
              data-skill-card
              intensity={0.45}
              className="h-full rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 md:p-6 transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_32px_rgba(0,180,216,0.08)]"
            >
              <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
                {category.name}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    data-badge-item
                    data-interactive
                    className="inline-block cursor-default"
                  >
                    <Badge>{skill}</Badge>
                  </span>
                ))}
              </div>
            </GlowCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}
