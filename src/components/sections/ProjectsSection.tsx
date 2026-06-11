"use client";

import { useRef, useState, useMemo } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { projects as fallbackProjects } from "@/data/projects";
import type { Project } from "@/types";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { GlowCard } from "@/components/animation/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const INITIAL_SHOW = 6;

function projectImageUrl(project: Project) {
  return project.image || `https://picsum.photos/seed/${project.imageSeed}/1200/800`;
}

const STATUS_STYLES = {
  live:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  wip:      "bg-amber-500/15  text-amber-400  border-amber-500/30",
  archived: "bg-zinc-500/15   text-zinc-400   border-zinc-500/30",
} as const;

// ─── Featured card (large, 16/10 image) ──────────────────────────────────────
function FeaturedCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();
      gsap.fromTo(
        cardRef.current,
        { autoAlpha: 0, y: 60, rotateY: index % 2 === 0 ? -10 : 10, scale: 0.93 },
        {
          autoAlpha: 1, y: 0, rotateY: 0, scale: 1,
          duration: 0.9, delay: index * 0.1, ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current, start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: cardRef },
  );

  return (
    <GlowCard
      ref={cardRef}
      intensity={0.55}
      className="project-feature-card group rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] transition-shadow duration-500 hover:border-[var(--border-strong)] hover:shadow-[0_0_60px_rgba(0,180,216,0.13)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={projectImageUrl(project)}
          alt={project.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.05]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,180,216,0.1),transparent_65%)]" />
        {project.status ? (
          <span className={cn(
            "absolute top-3 right-3 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest",
            STATUS_STYLES[project.status],
          )}>
            {project.status}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="space-y-3 p-5 md:p-6 xl:p-5">
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
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white hover:shadow-[0_0_14px_var(--accent-glow)]"
            >
              <SocialIcon platform="github" className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
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

// ─── Compact card (small, no image) ──────────────────────────────────────────
function CompactCard({ project }: { project: Project }) {
  return (
    <GlowCard
      intensity={0.4}
      className="project-compact-card group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_28px_rgba(0,180,216,0.08)]"
    >
      <span aria-hidden className="project-corner project-corner-tl" />
      <span aria-hidden className="project-corner project-corner-br" />
      <span aria-hidden className="project-module-dot" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-400)]">
            {project.year}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-syne)] text-base font-semibold leading-snug text-white">
            {project.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          {project.status ? (
            <span className={cn(
              "rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest",
              STATUS_STYLES[project.status],
            )}>
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
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

// ─── Section ──────────────────────────────────────────────────────────────────
interface ProjectsSectionProps {
  projects?: Project[];
}

export function ProjectsSection({ projects = fallbackProjects }: ProjectsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const allProjectsGridRef = useRef<HTMLDivElement>(null);
  const [activeTag, setActiveTag] = useState("All");
  const [expanded, setExpanded] = useState(false);

  useGSAP(
    () => {
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
    { scope: sectionRef },
  );

  // Non-featured projects, filtered by tag
  const featuredProjects = useMemo(
    () => projects.filter((project) => project.featured),
    [projects],
  );

  const nonFeatured = useMemo(
    () => projects.filter((p) => !p.featured),
    [projects],
  );

  const nonFeaturedProjectTags = useMemo(
    () => Array.from(new Set(nonFeatured.flatMap((project) => project.tags))).sort(),
    [nonFeatured],
  );

  const filtered = useMemo(() => {
    if (activeTag === "All") return nonFeatured;
    return nonFeatured.filter((p) => p.tags.includes(activeTag));
  }, [activeTag, nonFeatured]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW;

  useGSAP(
    () => {
      registerGsapPlugins();
      const items = gsap.utils.toArray<HTMLElement>("[data-all-project-frame]");

      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 14, scale: 0.985, filter: "blur(6px)" },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.38,
          stagger: 0.035,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [visible], revertOnUpdate: true, scope: allProjectsGridRef },
  );

  return (
    <Section id="projects" ref={sectionRef}>
      <div aria-hidden className="projects-interactive-bg">
        <span className="projects-bg-band projects-bg-band-a" />
        <span className="projects-bg-band projects-bg-band-b" />
        <span className="projects-bg-pulse projects-bg-pulse-a" />
        <span className="projects-bg-pulse projects-bg-pulse-b" />
      </div>

      <Container className="relative z-10">
        {/* ── Heading ── */}
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Projects"
            title="Selected software work."
            description="Open-source templates, campus platforms, Web3 products, and hackathon builds."
          />
        </RevealOnScroll>

        {/* ── Featured 2-col grid ── */}
        <div
          className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          style={{ perspective: 1400 }}
        >
          {featuredProjects.map((project, i) => (
            <FeaturedCard key={project.slug} project={project} index={i} />
          ))}
        </div>

        {/* ── All projects ── */}
        {nonFeatured.length > 0 && (
          <div className="mt-16">
            <RevealOnScroll>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
                  All projects
                  <span className="ml-2 font-mono text-sm font-normal text-[var(--foreground-subtle)]">
                    {filtered.length}
                  </span>
                </h3>

                {/* Tag filter pills */}
                <div className="flex flex-wrap gap-2">
                  {["All", ...nonFeaturedProjectTags].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      data-interactive
                      onClick={() => { setActiveTag(tag); setExpanded(false); }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
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

            {/* Compact grid */}
            <div ref={allProjectsGridRef} className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((project, i) => (
                <div key={project.slug} data-all-project-frame>
                  <CompactCard project={project} />
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-[var(--foreground-subtle)]">
                  No projects match that filter.
                </p>
              )}
            </div>

            {/* Show more / less */}
            {hasMore && (
              <RevealOnScroll>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    data-interactive
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
                  >
                    {expanded ? (
                      <><ChevronUp className="h-4 w-4" /> Show less</>
                    ) : (
                      <><ChevronDown className="h-4 w-4" /> Show {filtered.length - INITIAL_SHOW} more</>
                    )}
                  </button>
                </div>
              </RevealOnScroll>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}
