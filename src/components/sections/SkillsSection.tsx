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
            y: 18,
            scale: 0.98,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
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
              scale: 0.92,
              y: 6,
            },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              duration: 0.28,
              stagger: 0.018,
              ease: "power2.out",
              delay: cardIndex * 0.03 + 0.08,
              scrollTrigger: {
                trigger: card,
                start: "top 92%",
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
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section id="skills" ref={sectionRef}>
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
            title="Stack, systems, and creative tooling."
            description="Full-stack development for websites, web systems, and software products, paired with media production work shaped by hackathons, templates, and real client projects."
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
              intensity={lowMotion ? 0.18 : 0.32}
              className="h-full min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 text-center transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_24px_rgba(0,180,216,0.07)] sm:p-5 sm:text-left md:p-6"
            >
              <h3 className="font-[family-name:var(--font-syne)] text-base font-semibold text-white sm:text-lg">
                {category.name}
              </h3>

              <div className="mt-3 flex min-w-0 flex-wrap justify-center gap-1.5 sm:mt-4 sm:justify-start sm:gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    data-badge-item
                    data-interactive
                    className="inline-block max-w-full cursor-default break-words"
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