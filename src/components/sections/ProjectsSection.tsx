"use client";

import { useRef, useState, useMemo } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { projects, featuredProjects, nonFeaturedProjectTags } from "@/data/projects";
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

function projectImageUrl(seed: string) {
  return `https://picsum.photos/seed/${seed}/1200/800`;
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
      className="group rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] transition-shadow duration-500 hover:border-[var(--border-strong)] hover:shadow-[0_0_60px_rgba(0,180,216,0.13)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={projectImageUrl(project.imageSeed)}
          alt={project.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.05]"
          sizes="(max-width: 1024px) 100vw, 50vw"
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
      <div className="space-y-3 p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--blue-400)]">
              {project.year} · {project.role}
            </p>
            <h3 className="mt-1.5 font-[family-name:var(--font-syne)] text-xl font-semibold text-white sm:text-2xl">
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

        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
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
      className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_28px_rgba(0,180,216,0.08)]"
    >
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
export function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeTag, setActiveTag] = useState("All");
  const [expanded, setExpanded] = useState(false);

  // Non-featured projects, filtered by tag
  const nonFeatured = useMemo(
    () => projects.filter((p) => !p.featured),
    [],
  );

  const filtered = useMemo(() => {
    if (activeTag === "All") return nonFeatured;
    return nonFeatured.filter((p) => p.tags.includes(activeTag));
  }, [activeTag, nonFeatured]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW;

  return (
    <Section id="projects" ref={sectionRef}>
      <Container>
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
          className="mt-12 grid gap-6 lg:grid-cols-2"
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
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((project, i) => (
                <RevealOnScroll key={project.slug} delay={i * 0.04} variant="scale-in">
                  <CompactCard project={project} />
                </RevealOnScroll>
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
