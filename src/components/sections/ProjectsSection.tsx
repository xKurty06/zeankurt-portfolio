"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

function MobileProjectCarousel({
  projects,
  emptyMessage = "No projects available.",
}: {
  projects: Project[];
  emptyMessage?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(projects.length > 1);

  const updateState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const items = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-carousel-card]"),
    );

    if (items.length === 0) {
      setCurrentSlide(0);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(scrollerCenter - itemCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentSlide(closestIndex);
    setCanScrollPrev(scroller.scrollLeft > 8);
    setCanScrollNext(
      scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 8,
    );
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const items = Array.from(
        scroller.querySelectorAll<HTMLElement>("[data-carousel-card]"),
      );

      const target = items[index];
      if (!target) return;

      const left =
        target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;

      scroller.scrollTo({
        left,
        behavior: "smooth",
      });
    },
    [],
  );

  const scrollPrev = () => {
    scrollToIndex(Math.max(0, currentSlide - 1));
  };

  const scrollNext = () => {
    scrollToIndex(Math.min(projects.length - 1, currentSlide + 1));
  };

  useEffect(() => {
    updateState();

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      window.requestAnimationFrame(updateState);
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateState);

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateState);
    };
  }, [projects, updateState]);

  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--foreground-subtle)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="relative md:hidden">
      <div
        ref={scrollerRef}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project) => (
          <div
            key={project.slug}
            data-carousel-card
            className="w-[82vw] max-w-[21rem] shrink-0 snap-center"
          >
            <MobileProjectCard project={project} />
          </div>
        ))}
      </div>

      {projects.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous project"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-0 top-[42%] z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.82)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Next project"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-0 top-[42%] z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.82)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-5 flex justify-center gap-2">
            {projects.map((project, index) => (
              <button
                key={project.slug}
                type="button"
                aria-label={`Go to project ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentSlide === index
                    ? "w-6 bg-[var(--blue-300)] shadow-[0_0_12px_rgba(72,202,228,0.45)]"
                    : "w-2 bg-white/20 hover:bg-white/40",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MobileProjectCard({ project }: { project: Project }) {
  return (
    <article className="h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-[0_16px_44px_rgba(0,0,0,0.24)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(145deg,rgba(10,15,26,0.96),rgba(2,62,138,0.22))]">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_24%_24%,rgba(72,202,228,0.16),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(0,119,182,0.2),transparent_32%)] px-6 text-center">
            <p className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
              {project.title}
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/85 via-transparent to-transparent" />

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

      <div className="space-y-3 p-4 text-left">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--blue-400)]">
          {project.year} · {project.role}
        </p>

        <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold leading-tight text-white">
          {project.title}
        </h3>

        <p className="line-clamp-3 text-sm leading-7 text-[var(--foreground-muted)]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--blue-300)] transition hover:border-[var(--border-strong)] hover:text-white"
            >
              View live <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}

          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`GitHub — ${project.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
            >
              <SocialIcon platform="github" className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

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
          scale: 1,
          rotateY: 0,
          clearProps: "filter,transform,opacity,visibility",
        });

        return;
      }

      gsap.fromTo(
        cardRef.current,
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
          delay: index * 0.04,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 90%",
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
      intensity={lowMotion ? 0.18 : 0.35}
      className="project-feature-card group min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] transition-shadow duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_28px_rgba(0,180,216,0.08)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(145deg,rgba(10,15,26,0.96),rgba(2,62,138,0.22))] sm:aspect-[16/9]">
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
          <div className="min-w-0 flex-1">
            <p className="break-words font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--blue-400)]">
              {project.year} · {project.role}
            </p>

            <h3 className="mt-1.5 break-words font-[family-name:var(--font-syne)] text-lg font-semibold leading-tight text-white sm:text-xl xl:text-lg">
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

        <p className="text-sm leading-7 text-[var(--foreground-muted)]">
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
            className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--blue-300)] transition hover:text-white"
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
      intensity={0.22}
      className="project-compact-card group flex h-full min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 transition duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_22px_rgba(0,180,216,0.08)] sm:p-5"
    >
      <span aria-hidden className="project-corner project-corner-tl" />
      <span aria-hidden className="project-corner project-corner-br" />
      <span aria-hidden className="project-module-dot" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-400)]">
            {project.year}
          </p>

          <h3 className="mt-1 break-words font-[family-name:var(--font-syne)] text-base font-semibold leading-snug text-white">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:h-8 sm:w-8"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:h-8 sm:w-8"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-2.5 flex-1 text-sm leading-7 text-[var(--foreground-muted)] sm:text-xs sm:leading-relaxed">
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

  useGSAP(
    () => {
      registerGsapPlugins();

      const items = gsap.utils.toArray<HTMLElement>(
        "[data-all-project-frame]",
        allProjectsGridRef.current,
      );

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
          y: 8,
          scale: 0.99,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.24,
          stagger: 0.018,
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
        <div aria-hidden className="projects-interactive-bg hidden sm:block">
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

        <div className="mt-7 md:hidden">
          <MobileProjectCarousel projects={featuredProjects} />
        </div>

        <div
          className="mt-7 hidden min-w-0 gap-4 sm:mt-10 sm:gap-5 md:grid md:grid-cols-2 xl:grid-cols-3"
          style={{ perspective: lowMotion ? undefined : 1200 }}
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
          <div className="mt-10 sm:mt-14">
            <RevealOnScroll>
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
                  All projects
                  <span className="ml-2 font-mono text-sm font-normal text-[var(--foreground-subtle)]">
                    {filtered.length}
                  </span>
                </h3>

                <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-end sm:overflow-visible [&::-webkit-scrollbar]:hidden">
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
                        "min-h-10 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:min-h-0 sm:py-1",
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

            <div className="mt-5 md:hidden">
              <MobileProjectCarousel
                projects={visible}
                emptyMessage="No projects match that filter."
              />
            </div>

            <div
              ref={allProjectsGridRef}
              className="mt-5 hidden min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 md:grid xl:grid-cols-3"
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