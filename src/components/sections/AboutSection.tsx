"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { photos } from "@/data/photography";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { AnimatedCounter } from "@/components/animation/AnimatedCounter";
import { GlowCard } from "@/components/animation/GlowCard";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import type { Certification, EventHighlight, SkillCategory } from "@/types";

type CounterData = {
  to: number;
  suffix: string;
  prefix?: string;
};

type CounterLabel = "Focus" | "Events" | "Education" | "Creative";

interface AboutSectionProps {
  aboutContent: {
    paragraphs: string[];
    highlights: Array<{ label: string; value: string }>;
  };
  skillCategories: SkillCategory[];
  certifications: Certification[];
  eventHighlights: EventHighlight[];
}

export function AboutSection({
  aboutContent,
  skillCategories,
  certifications,
  eventHighlights,
}: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const counterMap: Record<CounterLabel, CounterData> = {
    Focus: { to: skillCategories.length, suffix: "+ stacks" },
    Events: { to: eventHighlights.length, suffix: "+ events" },
    Education: { to: certifications.length, suffix: "+ certs" },
    Creative: { to: photos.length, suffix: "+ shoots" },
  };

  useGSAP(
    () => {
      registerGsapPlugins();

      // Animated light sweep across the section heading on scroll
      const sweep = sectionRef.current?.querySelector<HTMLElement>("[data-about-sweep]");
      if (sweep) {
        gsap.fromTo(
          sweep,
          { x: "-110%" },
          {
            x: "110%",
            duration: 1.4,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: sweep,
              start: "top 85%",
              toggleActions: "play none none reset",
            },
          },
        );
      }

      // Paragraph lines reveal with stagger
      const paras = sectionRef.current?.querySelectorAll<HTMLElement>("[data-about-para]");
      if (paras?.length) {
        gsap.fromTo(
          paras,
          { autoAlpha: 0, y: 28, rotateX: 5 },
          {
            autoAlpha: 1, y: 0, rotateX: 0,
            stagger: 0.12,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: paras[0],
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

    },
    { scope: sectionRef },
  );

  return (
    <Section id="about" surface="elevated" ref={sectionRef} className="overflow-visible">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

          {/* Left: heading with sweep highlight */}
          <RevealOnScroll>
            <div className="relative">
              {/* Traveling light sweep */}
              <div
                aria-hidden
                data-about-sweep
                className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-[rgba(0,180,216,0.12)] to-transparent blur-sm"
              />
              <SectionHeading
                eyebrow="About"
                title="Developer, builder, and visual storyteller."
                description="Computer Science at Cavite State University. Full-stack developer and Co-founder at Studio Nomads. Based in Cavite, Philippines."
              />
            </div>
          </RevealOnScroll>

          {/* Right: paragraphs + highlight cards */}
          <div className="space-y-6">
            {aboutContent.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 24)}
                data-about-para
                className="text-base leading-relaxed text-[var(--foreground-muted)] sm:text-lg"
                style={{ perspective: 600 }}
              >
                {paragraph}
              </p>
            ))}

            <RevealOnScroll delay={0.2}>
              <dl className="grid gap-3 sm:grid-cols-2">
                {aboutContent.highlights.map((item) => {
                  const counter = counterMap[item.label as CounterLabel];
                  return (
                    <GlowCard
                      key={item.label}
                      className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-3 cursor-default"
                      intensity={0.4}
                      data-interactive
                    >
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--blue-400)]">
                        {item.label}
                      </dt>
                      <dd className="mt-1.5 text-sm font-medium text-white">
                        {counter ? (
                          <AnimatedCounter
                            to={counter.to}
                            suffix={counter.suffix}
                            prefix={counter.prefix}
                            className="text-[var(--blue-300)] font-semibold"
                          />
                        ) : (
                          item.value
                        )}
                      </dd>
                    </GlowCard>
                  );
                })}
              </dl>
            </RevealOnScroll>
          </div>
        </div>
      </Container>
    </Section>
  );
}
