"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { GlowCard } from "@/components/animation/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";
import type { SkillCategory } from "@/types";

interface SkillsSectionProps {
  skillCategories: SkillCategory[];
}

export function SkillsSection({ skillCategories }: SkillsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lowMotion = useLowMotionDevice();

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-skill-card]", section);

      if (lowMotion) {
        gsap.set(cards, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          clearProps: "filter,transform,opacity,visibility",
        });

        gsap.set("[data-badge-item]", {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          rotation: 0,
          clearProps: "filter,transform,opacity,visibility",
        });

        return;
      }

      cards.forEach((card, cardIndex) => {
        gsap.fromTo(
          card,
          {
            autoAlpha: 0,
            y: 16,
            scale: 0.985,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.38,
            delay: cardIndex * 0.035,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              toggleActions: "play none none reverse",
            },
          },
        );

        const badges = card.querySelectorAll<HTMLElement>("[data-badge-item]");

        if (badges.length) {
          gsap.fromTo(
            badges,
            {
              autoAlpha: 0,
              scale: 0.94,
              y: 5,
            },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              duration: 0.24,
              stagger: 0.015,
              ease: "power2.out",
              delay: cardIndex * 0.03 + 0.06,
              scrollTrigger: {
                trigger: card,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }
      });
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section id="skills" ref={sectionRef} className="py-10 sm:py-16 lg:py-24">
      {!lowMotion ? (
        <div aria-hidden className="skills-ambient-bg hidden sm:block">
          <span className="skills-bg-stream skills-bg-stream-a" />
          <span className="skills-bg-stream skills-bg-stream-b" />
          <span className="skills-bg-dot skills-bg-dot-a" />
          <span className="skills-bg-dot skills-bg-dot-b" />
          <span className="skills-bg-dot skills-bg-dot-c" />
        </div>
      ) : null}

      <Container className="relative z-10 min-w-0">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Skills"
            title="Tools for product, web, and creative work."
            description="Full-stack development for websites and software products, paired with media production shaped by hackathons, client work, and hands-on builds."
          />
        </RevealOnScroll>

        <div
          className="relative mt-7 grid min-w-0 grid-cols-1 gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
          style={{ perspective: lowMotion ? undefined : 1200 }}
        >
          {skillCategories.map((category) => (
            <GlowCard
              key={category.name}
              data-skill-card
              intensity={lowMotion ? 0.16 : 0.28}
              className="h-full min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 text-left transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_24px_rgba(0,180,216,0.07)] sm:p-5 md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words font-[family-name:var(--font-syne)] text-base font-semibold leading-snug text-white sm:text-lg">
                  {category.name}
                </h3>

                <span className="shrink-0 rounded-full border border-[var(--border)] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-[var(--blue-300)]">
                  {category.skills.length}
                </span>
              </div>

              <div className="mt-3 flex min-w-0 flex-wrap justify-start gap-1.5 sm:mt-4 sm:gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    data-badge-item
                    className="inline-block max-w-full break-words"
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
