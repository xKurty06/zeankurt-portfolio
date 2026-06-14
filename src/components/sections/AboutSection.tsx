"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { AnimatedCounter } from "@/components/animation/AnimatedCounter";
import { GlowCard } from "@/components/animation/GlowCard";
import { Container, Section } from "@/components/ui/Container";
import { FlickeringGrid } from "@/components/ui/FlickeringGridHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";
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
  creativePhotoCount: number;
}

export function AboutSection({
  aboutContent,
  skillCategories,
  certifications,
  eventHighlights,
  creativePhotoCount,
}: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lowMotion = useLowMotionDevice();

  const counterMap: Record<CounterLabel, CounterData> = {
    Focus: { to: skillCategories.length, suffix: "+ stacks" },
    Events: { to: eventHighlights.length, suffix: "+ events" },
    Education: { to: certifications.length, suffix: "+ certs" },
    Creative: { to: creativePhotoCount, suffix: "+ shoots" },
  };

  useGSAP(
    () => {
      registerGsapPlugins();

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

      const paras = sectionRef.current?.querySelectorAll<HTMLElement>("[data-about-para]");

      if (paras?.length) {
        gsap.fromTo(
          paras,
          { autoAlpha: 0, y: 22, rotateX: 4 },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.1,
            duration: 0.75,
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
    <Section id="about" surface="elevated" ref={sectionRef} className="overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(72,202,228,0.08)] to-transparent sm:h-32" />
        <div className="absolute -left-20 top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.1),transparent_70%)] blur-2xl sm:h-56 sm:w-56" />
        <div className="absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 bg-[radial-gradient(circle,rgba(0,119,182,0.1),transparent_72%)] blur-3xl sm:h-72 sm:w-72" />

        {!lowMotion ? (
          <FlickeringGrid
            className="absolute inset-0 hidden opacity-70 [mask-image:radial-gradient(circle_at_center,white,transparent_78%)] sm:block"
            color="var(--blue-400)"
            squareSize={3}
            gridGap={7}
            flickerChance={0.18}
            maxOpacity={0.18}
          />
        ) : null}
      </div>

      <Container>
        <div className="relative z-10 grid min-w-0 gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
          <RevealOnScroll>
            <div className="relative">
              <div
                aria-hidden
                data-about-sweep
                className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[rgba(0,180,216,0.12)] to-transparent blur-sm sm:w-20"
              />

              <SectionHeading
                eyebrow="About"
                title="Developer, builder, and visual storyteller."
                description="Computer Science at Cavite State University. Full-stack developer and Co-founder at Studio Nomads. Based in Cavite, Philippines."
              />
            </div>
          </RevealOnScroll>

          <div className="min-w-0 space-y-4 sm:space-y-5">
            {aboutContent.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                data-about-para
                className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base md:text-lg"
                style={{ perspective: 600 }}
              >
                {paragraph}
              </p>
            ))}

            <RevealOnScroll delay={0.2}>
              <dl className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {aboutContent.highlights.map((item) => {
                  const counter = counterMap[item.label as CounterLabel];

                  return (
                    <GlowCard
                      key={item.label}
                      className="min-w-0 cursor-default rounded-lg border border-[var(--border)] bg-white/[0.02] p-3 sm:p-4"
                      intensity={0.4}
                      data-interactive
                    >
                      <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--blue-400)] sm:text-[10px]">
                        {item.label}
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-white">
                        {counter ? (
                          <AnimatedCounter
                            to={counter.to}
                            suffix={counter.suffix}
                            prefix={counter.prefix}
                            className="font-semibold text-[var(--blue-300)]"
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