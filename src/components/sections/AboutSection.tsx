"use client";

import { useRef, type ReactNode } from "react";
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

const ABOUT_HIGHLIGHTS: Array<{ label: CounterLabel; value: string }> = [
  { label: "Focus", value: "Full-stack systems" },
  { label: "Events", value: "Community work" },
  { label: "Education", value: "Verified learning" },
  { label: "Creative", value: "Photo/video sets" },
];

function AboutAccent({ children }: { children: ReactNode }) {
  return <strong className="emphasis-glow-blue font-semibold">{children}</strong>;
}

function WarmAccent({ children }: { children: ReactNode }) {
  return <strong className="emphasis-glow-gold font-semibold">{children}</strong>;
}

function RoseAccent({ children }: { children: ReactNode }) {
  return <strong className="emphasis-glow-rose font-semibold">{children}</strong>;
}

interface AboutSectionProps {
  skillCategories: SkillCategory[];
  certifications: Certification[];
  eventHighlights: EventHighlight[];
  creativePhotoCount: number;
}

export function AboutSection({
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

      const paras = sectionRef.current?.querySelectorAll<HTMLElement>("[data-about-para]");

      if (lowMotion) {
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
          <SectionHeading
            eyebrow="About"
            title="Building digital products and visual stories."
            description="I turn ideas into usable web products, creative systems, and visual stories that connect technology with real communities."
          />

          <div className="min-w-0">
            <div className="mx-auto max-w-3xl space-y-5 text-center sm:space-y-6 lg:mx-0 lg:max-w-none lg:text-left">
              <p
                data-about-para
                className="text-base leading-8 text-[var(--foreground-muted)] sm:text-[1.05rem] sm:leading-8"
                style={{ perspective: 600 }}
              >
                I work across <AboutAccent>full-stack development</AboutAccent>, Web3 experiments,
                and creative production, building interfaces that feel fast, clear, and useful.
                Most of my work sits where product thinking, engineering, and visual storytelling
                need to meet.
              </p>

              <p
                data-about-para
                className="text-base leading-8 text-[var(--foreground-muted)] sm:text-[1.05rem] sm:leading-8 lg:border-l lg:border-[rgba(72,202,228,0.32)] lg:pl-5"
                style={{ perspective: 600 }}
              >
                Recent work includes <AboutAccent>portfolio systems</AboutAccent>,{" "}
                <WarmAccent>hackathon builds</WarmAccent>, blockchain community projects,{" "}
                <RoseAccent>event coverage</RoseAccent>, and branded visual assets for teams that
                need both technical execution and stronger presentation.
              </p>

              <p
                data-about-para
                className="text-base leading-8 text-[var(--foreground-muted)] sm:text-[1.05rem] sm:leading-8"
                style={{ perspective: 600 }}
              >
                Outside the code editor, I shoot and edit photos and videos through{" "}
                <span className="emphasis-glow-rose font-semibold">Studio Nomads</span>, which keeps
                my frontend work grounded in composition, pacing, contrast, and how people scan a
                story on screen.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <RevealOnScroll delay={0.16}>
              <dl className="mx-auto mt-3 grid max-w-6xl grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-4">
                {ABOUT_HIGHLIGHTS.map((item) => {
                  const counter = counterMap[item.label as CounterLabel];

                  return (
                    <GlowCard
                      key={item.label}
                      className="min-w-0 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3 text-center sm:p-5 lg:p-5"
                      intensity={lowMotion ? 0.16 : 0.28}
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