"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { AnimatedCounter } from "@/components/animation/AnimatedCounter";
import { GlowCard } from "@/components/animation/GlowCard";
import { Container, Section } from "@/components/ui/Container";
import { FlickeringGrid } from "@/components/ui/FlickeringGridHero";
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
      const paras = sectionRef.current?.querySelectorAll<HTMLElement>("[data-about-para]");

      if (lowMotion) {
        if (sweep) {
          gsap.set(sweep, { autoAlpha: 0 });
        }

        if (paras?.length) {
          gsap.set(paras, {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            clearProps: "filter,transform,opacity,visibility",
          });
        }

        return;
      }

      if (sweep) {
        gsap.fromTo(
          sweep,
          { x: "-110%" },
          {
            x: "110%",
            duration: 1.2,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: sweep,
              start: "top 88%",
              toggleActions: "play none none reset",
            },
          },
        );
      }

      if (paras?.length) {
        gsap.fromTo(
          paras,
          {
            autoAlpha: 0,
            y: 14,
          },
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.07,
            duration: 0.45,
            ease: "power2.out",
            scrollTrigger: {
              trigger: paras[0],
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section
      id="about"
      surface="elevated"
      ref={sectionRef}
      className="overflow-hidden pb-24 sm:pb-28 lg:pb-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[rgba(72,202,228,0.07)] to-transparent sm:h-32" />
        <div className="absolute -left-24 top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.1),transparent_70%)] blur-2xl sm:h-56 sm:w-56" />
        <div className="absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 bg-[radial-gradient(circle,rgba(0,119,182,0.08),transparent_72%)] blur-3xl sm:h-72 sm:w-72" />

        {!lowMotion ? (
          <FlickeringGrid
            className="absolute inset-0 hidden opacity-50 [mask-image:radial-gradient(circle_at_center,white,transparent_78%)] sm:block"
            color="var(--blue-400)"
            squareSize={3}
            gridGap={8}
            flickerChance={0.12}
            maxOpacity={0.13}
          />
        ) : null}
      </div>

      <Container>
        <div className="relative z-10 grid min-w-0 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
          <RevealOnScroll>
            <div className="relative mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
              <div
                aria-hidden
                data-about-sweep
                className="pointer-events-none absolute inset-y-0 w-14 bg-gradient-to-r from-transparent via-[rgba(0,180,216,0.1)] to-transparent blur-sm sm:w-20"
              />

              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--blue-400)] sm:text-xs">
                About
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-syne)] text-[clamp(2rem,8vw,3.15rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-5xl lg:mx-0 lg:text-6xl">
                Developer, builder, and visual storyteller.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg sm:leading-8 lg:mx-0">
                Computer Science at Cavite State University. Full-stack developer and
                Co-founder at Studio Nomads. Based in Cavite, Philippines.
              </p>
            </div>
          </RevealOnScroll>

          <div className="min-w-0">
            <div className="mx-auto max-w-3xl space-y-5 text-left sm:space-y-6 lg:mx-0 lg:max-w-none">
              {aboutContent.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  data-about-para
                  className="text-base leading-8 text-[var(--foreground-muted)] sm:text-[1.05rem] sm:leading-8"
                  style={{ perspective: 600 }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <RevealOnScroll delay={0.16}>
              <dl className="mx-auto mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:mt-9 sm:gap-4 lg:mx-0 lg:max-w-none">
                {aboutContent.highlights.map((item) => {
                  const counter = counterMap[item.label as CounterLabel];

                  return (
                    <GlowCard
                      key={item.label}
                      className="min-w-0 cursor-default rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3 text-center sm:p-5 lg:text-left"
                      intensity={lowMotion ? 0.16 : 0.28}
                      data-interactive
                    >
                      <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-400)] sm:text-[10px]">
                        {item.label}
                      </dt>

                      <dd className="mt-2 break-words text-lg font-semibold leading-tight text-white min-[390px]:text-xl sm:text-2xl">
                        {counter ? (
                          <AnimatedCounter
                            to={counter.to}
                            suffix={counter.suffix}
                            prefix={counter.prefix}
                            className="text-[var(--blue-300)]"
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