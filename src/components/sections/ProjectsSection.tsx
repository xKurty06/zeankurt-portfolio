"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
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
const ALL_FILTER = "All";
const PRIMARY_ROLE_FILTER_LIMIT = 4;

const STATUS_STYLES = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  wip: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
} as const;

function getStatusClass(status: Project["status"]) {
  if (!status) return "";

  return (
    STATUS_STYLES[status as keyof typeof STATUS_STYLES] ??
    "border-[var(--border)] bg-white/[0.04] text-[var(--foreground-muted)]"
  );
}

function getPrimaryFilterRoles(roles: string[], projects: Project[]) {
  const roleCounts = new Map<string, number>();

  projects.forEach((project) => {
    if (!project.role) return;

    roleCounts.set(project.role, (roleCounts.get(project.role) ?? 0) + 1);
  });

  return [...roles]
    .sort((a, b) => {
      const countDiff = (roleCounts.get(b) ?? 0) - (roleCounts.get(a) ?? 0);

      if (countDiff !== 0) return countDiff;

      return a.localeCompare(b);
    })
    .slice(0, PRIMARY_ROLE_FILTER_LIMIT);
}

function ProjectFilter({
  roles,
  projects,
  activeRole,
  onChange,
}: {
  roles: string[];
  projects: Project[];
  activeRole: string;
  onChange: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownMode, setDropdownMode] = useState<"all" | "more">("all");

  const rootRef = useRef<HTMLDivElement>(null);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownAnchorRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const primaryRoles = useMemo(
    () => getPrimaryFilterRoles(roles, projects),
    [projects, roles],
  );

  const moreRoles = useMemo(
    () => roles.filter((role) => !primaryRoles.includes(role)),
    [primaryRoles, roles],
  );

  const activeIsMore =
    activeRole !== ALL_FILTER &&
    !primaryRoles.includes(activeRole) &&
    roles.includes(activeRole);

  const visibleRoles = [ALL_FILTER, ...primaryRoles];

  const dropdownRoles = dropdownMode === "all" ? [ALL_FILTER, ...roles] : moreRoles;

  const updateDropdownPosition = useCallback(() => {
    const button = dropdownAnchorRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 1024;

    const width = isMobile ? viewportWidth - 24 : 384;
    const left = isMobile
      ? 12
      : Math.min(Math.max(16, rect.right - width), viewportWidth - width - 16);

    const dropdownMaxHeight = isMobile ? 300 : 300;
    const preferredTop = rect.bottom + 8;
    const top = Math.min(preferredTop, viewportHeight - dropdownMaxHeight - 16);

    setDropdownStyle({
      position: "fixed",
      top: Math.max(12, top),
      left,
      width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        rootRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openDropdown = (
    mode: "all" | "more",
    anchor: HTMLButtonElement | null,
  ) => {
    dropdownAnchorRef.current = anchor;
    setDropdownMode(mode);
    updateDropdownPosition();
    setOpen((current) => (dropdownMode === mode ? !current : true));
  };

  const handleSelect = (role: string) => {
    const nextRole = activeRole === role ? ALL_FILTER : role;

    onChange(nextRole);
    setOpen(false);
  };

  return (
    <>
      <div ref={rootRef} className="relative w-full min-w-0 lg:w-auto lg:max-w-[40rem]">
        <div className="flex justify-end lg:hidden">
          <button
            ref={mobileFilterButtonRef}
            type="button"
            data-interactive
            onClick={() => openDropdown("all", mobileFilterButtonRef.current)}
            aria-expanded={open && dropdownMode === "all"}
            className={cn(
              "inline-flex min-h-10 max-w-full cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
              activeRole !== ALL_FILTER || (open && dropdownMode === "all")
                ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
            )}
          >
            <span className="max-w-[13rem] truncate">
              {activeRole === ALL_FILTER ? "All Filters" : activeRole}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition",
                open && dropdownMode === "all" && "rotate-180",
              )}
            />
          </button>
        </div>

        <div className="hidden max-w-full gap-2 pb-1 lg:flex lg:max-w-[40rem] lg:justify-end lg:overflow-visible">
          {visibleRoles.map((role) => (
            <button
              key={role}
              type="button"
              data-interactive
              onClick={() => handleSelect(role)}
              className={cn(
                "inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                activeRole === role
                  ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                  : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
              )}
            >
              <span className="max-w-[8rem] truncate">{role}</span>
            </button>
          ))}

          {moreRoles.length > 0 ? (
            <button
              ref={moreButtonRef}
              type="button"
              data-interactive
              onClick={() => openDropdown("more", moreButtonRef.current)}
              aria-expanded={open && dropdownMode === "more"}
              className={cn(
                "inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                activeIsMore || (open && dropdownMode === "more")
                  ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                  : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
              )}
            >
              More roles
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                {moreRoles.length}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition",
                  open && dropdownMode === "more" && "rotate-180",
                )}
              />
            </button>
          ) : null}
        </div>
      </div>

      {mounted && open && dropdownRoles.length > 0
        ? createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="rounded-2xl border border-[var(--border-strong)] bg-[var(--background-elevated)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-300)]">
                {dropdownMode === "all" ? "Filter by role" : "More roles"}
              </p>

              {activeRole !== ALL_FILTER ? (
                <button
                  type="button"
                  onClick={() => handleSelect(ALL_FILTER)}
                  className="cursor-pointer text-xs font-medium text-[var(--foreground-muted)] transition hover:text-white"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="max-h-64 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-wrap gap-2">
                {dropdownRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    data-interactive
                    onClick={() => handleSelect(role)}
                    className={cn(
                      "inline-flex max-w-full cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      activeRole === role
                        ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                        : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
                    )}
                  >
                    <span className="max-w-[13rem] truncate sm:max-w-none">
                      {role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </>
  );
}


function MobileProjectCarousel({
  projects,
  emptyMessage = "No projects available.",
  showImage = true,
}: {
  projects: Project[];
  emptyMessage?: string;
  showImage?: boolean;
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

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const items = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-carousel-card]"),
    );

    const target = items[index];
    if (!target) return;

    const left =
      target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;

    scroller.scrollTo({ left, behavior: "smooth" });
  }, []);

  const scrollPrev = () => {
    scrollToIndex(Math.max(0, currentSlide - 1));
  };

  const scrollNext = () => {
    scrollToIndex(Math.min(projects.length - 1, currentSlide + 1));
  };

  useEffect(() => {
    const scroller = scrollerRef.current;

    setCurrentSlide(0);
    setCanScrollPrev(false);
    setCanScrollNext(projects.length > 1);

    if (scroller) {
      scroller.scrollTo({ left: 0, behavior: "auto" });
    }

    window.requestAnimationFrame(updateState);
  }, [projects, updateState]);

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
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project) => (
          <div
            key={project.slug}
            data-carousel-card
            className={cn(
              "shrink-0 snap-center",
              showImage ? "w-[82vw] max-w-[21rem]" : "w-[80vw] max-w-[20rem]",
            )}
          >
            <MobileProjectCard project={project} showImage={showImage} />
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
            className={cn(
              "absolute left-0 z-10 inline-flex h-9 w-9 cursor-pointer -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.82)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition enabled:hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-35",
              showImage ? "top-[42%]" : "top-1/2",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Next project"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              "absolute right-0 z-10 inline-flex h-9 w-9 cursor-pointer -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.82)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition enabled:hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-35",
              showImage ? "top-[42%]" : "top-1/2",
            )}
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
                  "h-2 cursor-pointer rounded-full transition-all duration-300",
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

function MobileProjectCard({
  project,
  showImage = true,
}: {
  project: Project;
  showImage?: boolean;
}) {
  return (
    <article
      className={cn(
        "h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-[0_16px_44px_rgba(0,0,0,0.24)]",
        !showImage && "p-4 text-left",
      )}
    >
      {showImage ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,rgba(10,15,26,0.96),rgba(2,62,138,0.22))]">
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_24%_24%,rgba(72,202,228,0.16),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(0,119,182,0.2),transparent_32%)] px-6 text-center">
              <p className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
                {project.title}
              </p>
            </div>
          )}

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#030712]/85 via-transparent to-transparent" />

          {project.status ? (
            <span
              className={cn(
                "absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest",
                getStatusClass(project.status),
              )}
            >
              {project.status}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className={cn("space-y-3 text-left", showImage ? "p-4" : "")}>
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 break-words font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--blue-400)]">
            {project.year} · {project.role}
          </p>

          {!showImage && project.status ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest",
                getStatusClass(project.status),
              )}
            >
              {project.status}
            </span>
          ) : null}
        </div>

        <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold leading-tight text-white">
          {project.title}
        </h3>

        <p className="line-clamp-4 text-sm leading-7 text-[var(--foreground-muted)]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, showImage ? 4 : 5).map((tag) => (
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
        { autoAlpha: 0, y: 18, scale: 0.98 },
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
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,rgba(10,15,26,0.96),rgba(2,62,138,0.22))] sm:aspect-[16/9]">
        {project.image ? (
          <ZoomableImage
            src={project.image}
            alt={project.title}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="absolute inset-0 rounded-2xl"
            imageClassName="rounded-2xl object-cover"
            buttonClassName="right-3 top-3"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_24%_24%,rgba(72,202,228,0.16),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(0,119,182,0.2),transparent_32%)] px-6 text-center">
            <p className="max-w-[80%] font-[family-name:var(--font-syne)] text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {project.title}
            </p>
          </div>
        )}

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#030712] via-transparent to-transparent" />

        {project.status ? (
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest",
              getStatusClass(project.status),
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
            {project.year} · {project.role}
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
                getStatusClass(project.status),
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
  const [activeRole, setActiveRole] = useState(ALL_FILTER);
  const [expanded, setExpanded] = useState(false);

  const featuredProjects = useMemo(
    () => projects.filter((project) => project.featured),
    [projects],
  );

  const nonFeatured = useMemo(
    () => projects.filter((project) => !project.featured),
    [projects],
  );

  const nonFeaturedProjectRoles = useMemo(
    () =>
      Array.from(new Set(nonFeatured.map((project) => project.role)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [nonFeatured],
  );

  const filtered = useMemo(() => {
    if (activeRole === ALL_FILTER) return nonFeatured;

    return nonFeatured.filter((project) => project.role === activeRole);
  }, [activeRole, nonFeatured]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW;

  const handleFilterChange = (role: string) => {
    setActiveRole(role);
    setExpanded(false);
  };

  useGSAP(
    () => {
      if (lowMotion) return;

      return;
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
        { autoAlpha: 0, y: 8, scale: 0.99 },
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
    {
      dependencies: [visible, lowMotion],
      revertOnUpdate: true,
      scope: allProjectsGridRef,
    },
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

      <Container className="relative z-10 min-w-0 overflow-visible">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Projects"
            title="Selected software work."
            description="Building modern web systems, blockchain-driven products, and creative visuals for communities, startups, and real-world digital experiences."
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
          <div className="relative z-20 mt-10 overflow-visible sm:mt-14">
            <RevealOnScroll>
              <div className="relative z-[80] flex flex-col items-center gap-4 overflow-visible text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
                {/* 1. Added w-full here to let the container expand */}
                <div className="shrink-0 w-full">
                  {/* 2. Added w-full block here so the heading takes up the whole line */}
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white w-full block">
                    {/* 3. Added w-full here to push the children to the edges */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex justify-start ">
                        All projects
                        <span className="ml-2 font-mono text-sm font-normal text-[var(--foreground-subtle)]">
                          {filtered.length}
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <ProjectFilter
                          roles={nonFeaturedProjectRoles}
                          projects={nonFeatured}
                          activeRole={activeRole}
                          onChange={handleFilterChange}
                        />
                      </div>
                    </div>
                  </h3>
                </div>



              </div>
            </RevealOnScroll>

            <div className="relative z-0 mt-5 grid min-w-0 grid-cols-1 gap-4 md:hidden">
              {visible.length > 0 ? (
                visible.map((project) => (
                  <MobileProjectCard
                    key={project.slug}
                    project={project}
                    showImage={false}
                  />
                ))
              ) : (
                <p className="py-8 text-center text-sm text-[var(--foreground-subtle)]">
                  No projects match that role.
                </p>
              )}
            </div>

            <div
              ref={allProjectsGridRef}
              className="relative z-0 mt-5 hidden min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 md:grid xl:grid-cols-3"
            >
              {visible.map((project) => (
                <div key={project.slug} data-all-project-frame>
                  <CompactCard project={project} />
                </div>
              ))}

              {filtered.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-[var(--foreground-subtle)]">
                  No projects match that role.
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
                    className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
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
