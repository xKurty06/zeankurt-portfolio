"use client";

import { useRef, useState, useMemo } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/types";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { GlowCard } from "@/components/animation/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";

const INITIAL_SHOW = 6;

const STATUS_STYLES = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  wip: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
} as const;

function FeaturedCard({
  project,
  index,
  lowMotion,
}: {
  project: Project;
  index: number;
  lowMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();

      if (lowMotion) {
        gsap.set(cardRef.current, {
          autoAlpha: 1,
          y: 0,
          rotateY: 0,
          scale: 1,
          clearProps: "filter,transform,opacity,visibility",
        });

        return;
      }

      gsap.fromTo(
        cardRef.current,
        {
          autoAlpha: 0,
          y: 34,
          rotateY: index % 2 === 0 ? -5 : 5,
          scale: 0.96,
        },
        {
          autoAlpha: 1,
          y: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.65,
          delay: index * 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { dependencies: [lowMotion], scope: cardRef },
  );

  return (
    <GlowCard
      ref={cardRef}
      intensity={lowMotion ? 0.2 : 0.55}
      className="project-feature-card group min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] transition-shadow duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_32px_rgba(0,180,216,0.08)] sm:duration-500 sm:hover:shadow-[0_0_60px_rgba(0,180,216,0.13)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(145deg,rgba(10,15,26,0.96),rgba(2,62,138,0.22))]">
        {project.image ? (
          <ZoomableImage
            src={project.image}
            alt={project.title}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="absolute inset-0"
            imageClassName="object-cover"
            buttonClassName="right-3 top-3"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_24%_24%,rgba(72,202,228,0.16),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(0,119,182,0.2),transparent_32%)] px-6 text-center">
            <p className="max-w-[80%] font-[family-name:var(--font-syne)] text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {project.title}
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />

        <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,180,216,0.1),transparent_65%)]" />

        {project.status ? (
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest",
              STATUS_STYLES[project.status],
            )}
          >
            {project.status}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4 sm:p-5 md:p-6 xl:p-5">
        <div aria-hidden className="project-module-rail">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--blue-400)]">
              {project.year} · {project.role}
            </p>

            <h3 className="mt-1.5 font-[family-name:var(--font-syne)] text-lg font-semibold leading-tight text-white sm:text-xl xl:text-lg">
              {project.title}
            </h3>
          </div>

          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`GitHub — ${project.title}`}
              data-interactive
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white hover:shadow-[0_0_14px_var(--accent-glow)] sm:h-11 sm:w-11"
            >
              <SocialIcon platform="github" className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-interactive
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--blue-300)] transition hover:text-white"
          >
            View live <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </GlowCard>
  );
}

function CompactCard({ project }: { project: Project }) {
  return (
    <GlowCard
      intensity={0.35}
      className="project-compact-card group flex h-full min-w-0 flex-col rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_22px_rgba(0,180,216,0.08)] sm:p-5"
    >
      <span aria-hidden className="project-corner project-corner-tl" />
      <span aria-hidden className="project-corner project-corner-br" />
      <span aria-hidden className="project-module-dot" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-400)]">
            {project.year}
          </p>

          <h3 className="mt-1 font-[family-name:var(--font-syne)] text-base font-semibold leading-snug text-white">
            {project.title}
          </h3>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-0.5">
          {project.status ? (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest",
                STATUS_STYLES[project.status],
              )}
            >
              {project.status}
            </span>
          ) : null}

          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`GitHub — ${project.title}`}
              data-interactive
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:h-7 sm:w-7"
            >
              <SocialIcon platform="github" className="h-3.5 w-3.5" />
            </a>
          ) : null}

          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Live — ${project.title}`}
              data-interactive
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:h-7 sm:w-7"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-2.5 flex-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
        {project.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--border)] bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium text-[var(--blue-200)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </GlowCard>
  );
}

interface ProjectsSectionProps {
  projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const allProjectsGridRef = useRef<HTMLDivElement>(null);
  const lowMotion = useLowMotionDevice();

  const [activeTag, setActiveTag] = useState("All");
  const [expanded, setExpanded] = useState(false);

  useGSAP(
    () => {
      if (lowMotion) return;

      const section = sectionRef.current;

      if (!section) return;

      const onMove = (event: MouseEvent) => {
        const rect = section.getBoundingClientRect();

        section.style.setProperty("--projects-x", `${event.clientX - rect.left}px`);
        section.style.setProperty("--projects-y", `${event.clientY - rect.top}px`);
      };

      section.addEventListener("mousemove", onMove);

      return () => {
        section.removeEventListener("mousemove", onMove);
      };
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  const featuredProjects = useMemo(
    () => projects.filter((project) => project.featured),
    [projects],
  );

  const nonFeatured = useMemo(
    () => projects.filter((project) => !project.featured),
    [projects],
  );

  const nonFeaturedProjectTags = useMemo(
    () => Array.from(new Set(nonFeatured.flatMap((project) => project.tags))).sort(),
    [nonFeatured],
  );

  const filtered = useMemo(() => {
    if (activeTag === "All") return nonFeatured;

    return nonFeatured.filter((project) => project.tags.includes(activeTag));
  }, [activeTag, nonFeatured]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW;

  useGSAP(
    () => {
      registerGsapPlugins();

      const items = gsap.utils.toArray<HTMLElement>("[data-all-project-frame]");

      if (items.length === 0) return;

      if (lowMotion) {
        gsap.set(items, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          clearProps: "filter,transform,opacity,visibility",
        });

        return;
      }

      gsap.fromTo(
        items,
        {
          autoAlpha: 0,
          y: 10,
          scale: 0.99,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.02,
          ease: "power2.out",
          clearProps: "filter",
        },
      );
    },
    { dependencies: [visible, lowMotion], revertOnUpdate: true, scope: allProjectsGridRef },
  );

  return (
    <Section id="projects" ref={sectionRef}>
      {!lowMotion ? (
        <div aria-hidden className="projects-interactive-bg">
          <span className="projects-bg-band projects-bg-band-a" />
          <span className="projects-bg-band projects-bg-band-b" />
          <span className="projects-bg-pulse projects-bg-pulse-a" />
          <span className="projects-bg-pulse projects-bg-pulse-b" />
        </div>
      ) : null}

      <Container className="relative z-10 min-w-0">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Projects"
            title="Selected software work."
            description="Open-source templates, campus platforms, Web3 products, and hackathon builds."
          />
        </RevealOnScroll>

        <div
          className="mt-8 grid min-w-0 gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
          style={{ perspective: lowMotion ? undefined : 1400 }}
        >
          {featuredProjects.map((project, index) => (
            <FeaturedCard
              key={project.slug}
              project={project}
              index={index}
              lowMotion={lowMotion}
            />
          ))}
        </div>

        {nonFeatured.length > 0 ? (
          <div className="mt-12 sm:mt-16">
            <RevealOnScroll>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
                  All projects
                  <span className="ml-2 font-mono text-sm font-normal text-[var(--foreground-subtle)]">
                    {filtered.length}
                  </span>
                </h3>

                <div className="flex min-w-0 flex-wrap gap-2">
                  {["All", ...nonFeaturedProjectTags].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      data-interactive
                      onClick={() => {
                        setActiveTag(tag);
                        setExpanded(false);
                      }}
                      className={cn(
                        "min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:min-h-0 sm:py-1",
                        activeTag === tag
                          ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                          : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </RevealOnScroll>

            <div
              ref={allProjectsGridRef}
              className="mt-5 grid min-w-0 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
            >
              {visible.map((project) => (
                <div key={project.slug} data-all-project-frame>
                  <CompactCard project={project} />
                </div>
              ))}

              {filtered.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-[var(--foreground-subtle)]">
                  No projects match that filter.
                </p>
              ) : null}
            </div>

            {hasMore ? (
              <RevealOnScroll>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    data-interactive
                    onClick={() => setExpanded((value) => !value)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show {filtered.length - INITIAL_SHOW} more
                      </>
                    )}
                  </button>
                </div>
              </RevealOnScroll>
            ) : null}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}