"use client";

import Image from "next/image";
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
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MapPin,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { GlowCard } from "@/components/animation/GlowCard";
import { Badge } from "@/components/ui/Badge";
import BackgroundScene from "@/components/ui/AuroraSectionHero";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";
import type { Certification, EventHighlight, ExperienceItem } from "@/types";

interface ExperienceSectionProps {
  experience: ExperienceItem[];
  certifications: Certification[];
  eventHighlights: EventHighlight[];
}

const EXPERIENCE_PREVIEW_LIMIT = 100;
const EXPERIENCE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Work", value: "work" },
  { label: "Community", value: "community" },
  { label: "Hackathon", value: "hackathon" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ExperienceItem["type"] | "all";
}>;

type ExperienceFilter = (typeof EXPERIENCE_FILTERS)[number]["value"];

function getExperiencePreview(description: string) {
  if (description.length <= EXPERIENCE_PREVIEW_LIMIT) {
    return {
      text: description,
      truncated: false,
    };
  }

  return {
    text: `${description
      .slice(0, EXPERIENCE_PREVIEW_LIMIT)
      .trimEnd()
      .replace(/[.,;:\s]+$/, "")}...`,
    truncated: true,
  };
}

function ExperienceFilterControl({
  activeFilter,
  onChange,
}: {
  activeFilter: ExperienceFilter;
  onChange: (filter: ExperienceFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

  const rootRef = useRef<HTMLDivElement>(null);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLabel =
    EXPERIENCE_FILTERS.find((filter) => filter.value === activeFilter)?.label ??
    "All";

  const updateDropdownPosition = useCallback(() => {
    const button = mobileFilterButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 1024;

    const width = isMobile ? viewportWidth - 24 : 320;
    const left = isMobile
      ? 12
      : Math.min(Math.max(16, rect.right - width), viewportWidth - width - 16);

    const dropdownMaxHeight = 260;
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

  const handleSelect = (filter: ExperienceFilter) => {
    onChange(filter);
    setOpen(false);
  };

  return (
    <>
      <div ref={rootRef} className="relative w-full min-w-0">
        <div className="flex justify-end md:hidden">
          <button
            ref={mobileFilterButtonRef}
            type="button"
            data-interactive
            onClick={() => {
              updateDropdownPosition();
              setOpen((current) => !current);
            }}
            aria-expanded={open}
            className={cn(
              "inline-flex min-h-10 max-w-full cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
              activeFilter !== "all" || open
                ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
            )}
          >
            <span className="max-w-[13rem] truncate">
              {activeFilter === "all" ? "All Filters" : activeLabel}
            </span>

            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition",
                open && "rotate-180",
              )}
            />
          </button>
        </div>

        <div className="hidden flex-wrap gap-2 md:flex">
          {EXPERIENCE_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                data-interactive
                aria-pressed={isActive}
                onClick={() => handleSelect(filter.value)}
                className={cn(
                  "inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-300)] sm:px-4",
                  isActive
                    ? "border-[rgba(72,202,228,0.42)] bg-[rgba(72,202,228,0.14)] text-[var(--blue-100)] shadow-[0_0_22px_rgba(0,180,216,0.12)]"
                    : "border-[var(--border)] bg-white/[0.03] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {mounted && open
        ? createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="rounded-2xl border border-[var(--border-strong)] bg-[var(--background-elevated)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-300)]">
                  Filter by experience
                </p>

                {activeFilter !== "all" ? (
                  <button
                    type="button"
                    data-interactive
                    onClick={() => handleSelect("all")}
                    className="cursor-pointer text-xs font-medium text-[var(--foreground-muted)] transition hover:text-white"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_FILTERS.map((filter) => {
                  const isActive = activeFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      data-interactive
                      onClick={() => handleSelect(filter.value)}
                      className={cn(
                        "inline-flex max-w-full cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        isActive
                          ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                          : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
                      )}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MobileExperienceCarousel({
  items,
  emptyMessage = "No experience items available.",
}: {
  items: ExperienceItem[];
  emptyMessage?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(items.length > 1);
  const [activeItem, setActiveItem] = useState<ExperienceItem | null>(null);

  const updateState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-experience-carousel-card]"),
    );

    if (cards.length === 0) {
      setCurrentSlide(0);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(scrollerCenter - cardCenter);

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

    const cards = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-experience-carousel-card]"),
    );

    const target = cards[index];
    if (!target) return;

    const left =
      target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;

    scroller.scrollTo({ left, behavior: "smooth" });
  }, []);

  const scrollPrev = () => {
    scrollToIndex(Math.max(0, currentSlide - 1));
  };

  const scrollNext = () => {
    scrollToIndex(Math.min(items.length - 1, currentSlide + 1));
  };

  useEffect(() => {
    const scroller = scrollerRef.current;

    setCurrentSlide(0);
    setCanScrollPrev(false);
    setCanScrollNext(items.length > 1);

    if (scroller) {
      scroller.scrollTo({ left: 0, behavior: "auto" });
    }

    window.requestAnimationFrame(updateState);
  }, [items, updateState]);

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
  }, [items, updateState]);

  useEffect(() => {
    if (!activeItem) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeItem]);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--foreground-subtle)]">
        {emptyMessage}
      </p>
    );
  }

  const isSingleItem = items.length === 1;

  return (
    <div className="relative md:hidden">
      <div
        ref={scrollerRef}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isSingleItem && "justify-center overflow-hidden",
        )}
      >
        {items.map((item, index) => {
          const preview = getExperiencePreview(item.description);

          return (
            <div
              key={item.id}
              data-experience-carousel-card
              className={cn(
                "shrink-0 snap-center transform-gpu transition-all duration-500 ease-out motion-reduce:transform-none motion-reduce:opacity-100",
                currentSlide === index
                  ? "scale-100 opacity-100"
                  : "scale-[0.96] opacity-70",
                isSingleItem
                  ? "w-[calc(100vw-2rem)] max-w-none"
                  : "w-[82vw] max-w-[21rem]",
              )}
            >
              <article className="flex h-full min-h-[15.5rem] min-w-0 flex-col rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.92),rgba(8,15,30,0.9))] p-4 shadow-[0_16px_44px_rgba(0,0,0,0.24)] transition-transform duration-300 active:scale-[0.985] min-[390px]:p-5">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-white">
                      {item.organization}
                    </h3>

                    <span className="shrink-0 pt-0.5">
                      <Badge>{item.type}</Badge>
                    </span>
                  </div>

                  <p className="mt-1 break-words text-sm leading-relaxed text-[var(--blue-300)]">
                    {item.role}
                  </p>
                </div>

                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                  {item.period}
                </p>

                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                  {preview.text}
                  {preview.truncated ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        data-interactive
                        onClick={() => setActiveItem(item)}
                        className="inline cursor-pointer font-medium text-[var(--blue-300)] underline-offset-4 transition hover:text-white hover:underline"
                      >
                        See more
                      </button>
                    </>
                  ) : null}
                </p>
              </article>
            </div>
          );
        })}
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous experience"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-0 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.82)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition enabled:hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Next experience"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-0 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.82)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition enabled:hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="min-w-6 text-right font-mono text-[10px] text-[var(--blue-300)]">
              {String(currentSlide + 1).padStart(2, "0")}
            </span>

            <div className="relative h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--blue-300)] shadow-[0_0_12px_rgba(72,202,228,0.45)] transition-all duration-500 ease-out"
                style={{
                  width: `${((currentSlide + 1) / items.length) * 100}%`,
                }}
              />
            </div>

            <span className="min-w-6 font-mono text-[10px] text-[var(--foreground-subtle)]">
              {String(items.length).padStart(2, "0")}
            </span>
          </div>
        </>
      ) : null}

      <AnimatePresence>
        {activeItem ? (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeItem.organization} details`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.975, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.975, y: 20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-[82dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[var(--background-elevated)] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2">
                    <Badge>{activeItem.type}</Badge>
                  </div>

                  <h3 className="break-words text-lg font-semibold leading-snug text-white">
                    {activeItem.organization}
                  </h3>

                  <p className="mt-1 break-words text-sm leading-relaxed text-[var(--blue-300)]">
                    {activeItem.role}
                  </p>

                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                    {activeItem.period}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/10"
                  aria-label="Close experience details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm leading-7 text-[var(--foreground-muted)]">
                {activeItem.description}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ExperienceSection({
  experience,
  certifications,
  eventHighlights,
}: ExperienceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lowMotion = useLowMotionDevice();

  const [activeCert, setActiveCert] = useState<{
    name: string;
    image: string;
  } | null>(null);
  const [activeExperienceFilter, setActiveExperienceFilter] =
    useState<ExperienceFilter>("all");

  const filteredExperience = useMemo(
    () =>
      activeExperienceFilter === "all"
        ? experience
        : experience.filter((item) => item.type === activeExperienceFilter),
    [activeExperienceFilter, experience],
  );

  const sortedEvents = useMemo(
    () =>
      [...eventHighlights].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [eventHighlights],
  );

  const certificationGroups = useMemo(() => {
    const rawCertificationGroups = Object.entries(
      certifications.reduce<Record<string, typeof certifications>>(
        (groups, cert) => {
          groups[cert.issuer] ??= [];
          groups[cert.issuer].push(cert);

          return groups;
        },
        {},
      ),
    );

    const majorCertificationGroups = rawCertificationGroups.filter(
      ([, items]) => items.length >= 3,
    );

    const otherCertificationItems = rawCertificationGroups
      .filter(([, items]) => items.length < 3)
      .flatMap(([, items]) => items);

    return [
      ...majorCertificationGroups,
      ...(otherCertificationItems.length
        ? ([["Other", otherCertificationItems]] as const)
        : []),
    ];
  }, [certifications]);

  const eventsByYear = useMemo(() => {
    const eventGroups = sortedEvents.reduce<
      Record<string, typeof eventHighlights>
    >((groups, event) => {
      groups[event.year] ??= [];
      groups[event.year].push(event);

      return groups;
    }, {});

    return Object.keys(eventGroups)
      .sort((a, b) => Number(b) - Number(a))
      .map((year) => [year, eventGroups[year]] as const);
  }, [eventHighlights, sortedEvents]);

  const isPdf = activeCert?.image.toLowerCase().endsWith(".pdf") ?? false;

  useEffect(() => {
    if (!activeCert) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveCert(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeCert]);

  useEffect(() => {
    if (lowMotion) return;

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
    };
  }, [activeExperienceFilter, filteredExperience.length, lowMotion]);

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      if (!section) return;

      const rail = section.querySelector<HTMLElement>("[data-timeline-rail]");
      const traveller = section.querySelector<HTMLElement>(
        "[data-timeline-traveller]",
      );

      if (!rail || !traveller) return;

      if (lowMotion) {
        gsap.set(traveller, {
          autoAlpha: 1,
          top: rail.offsetTop,
          yPercent: -50,
        });

        return;
      }

      let stopTimer: number | null = null;
      let previousScrollY = window.scrollY;

      const setTravellerTop = gsap.quickTo(traveller, "top", {
        duration: 0.28,
        ease: "power2.out",
      });

      const updateTraveller = () => {
        const offsetParent = traveller.offsetParent;

        if (!(offsetParent instanceof HTMLElement)) return;

        const railHeight = rail.offsetHeight;
        if (railHeight <= 0) return;

        const parentRect = offsetParent.getBoundingClientRect();
        const railTop = rail.offsetTop;
        const railBottom = railTop + railHeight;
        const viewportMiddle = window.innerHeight / 2;

        const nextTop = gsap.utils.clamp(
          railTop,
          railBottom,
          viewportMiddle - parentRect.top,
        );

        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - previousScrollY;

        if (Math.abs(scrollDelta) > 0.5) {
          traveller.dataset.travelDirection = scrollDelta > 0 ? "down" : "up";
        }

        traveller.dataset.travelState = "moving";
        previousScrollY = currentScrollY;

        setTravellerTop(nextTop);

        if (stopTimer) {
          window.clearTimeout(stopTimer);
        }

        stopTimer = window.setTimeout(() => {
          traveller.dataset.travelState = "stopped";
        }, 180);
      };

      gsap.set(traveller, {
        autoAlpha: 1,
        top: rail.offsetTop,
        yPercent: -50,
      });

      traveller.dataset.travelDirection = "down";
      traveller.dataset.travelState = "stopped";

      const scrollTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.35,
        invalidateOnRefresh: true,
        onRefresh: updateTraveller,
        onUpdate: updateTraveller,
      });

      const initialFrame = window.requestAnimationFrame(updateTraveller);

      return () => {
        window.cancelAnimationFrame(initialFrame);

        if (stopTimer) {
          window.clearTimeout(stopTimer);
        }

        scrollTrigger.kill();
        gsap.killTweensOf(traveller);
      };
    },
    {
      dependencies: [lowMotion],
      scope: sectionRef,
    },
  );

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      if (!section) return;

      const cleanups: Array<() => void> = [];

      const experienceList = section.querySelector<HTMLElement>(
        "[data-experience-list]",
      );
      const cards = gsap.utils.toArray<HTMLElement>("[data-exp-card]", section);
      const certRows = gsap.utils.toArray<HTMLElement>(
        "[data-cert-row]",
        section,
      );
      const eventCards = gsap.utils.toArray<HTMLElement>(
        "[data-event-card]",
        section,
      );

      if (lowMotion) {
        gsap.set([...cards, ...certRows, ...eventCards], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotateY: 0,
          scale: 1,
          clearProps: "filter,transform,opacity,visibility,boxShadow",
        });

        return;
      }

      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          {
            autoAlpha: 0,
            x: -18,
            y: 10,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.42,
            stagger: 0.035,
            ease: "power2.out",
            scrollTrigger: {
              trigger: experienceList ?? section,
              start: "top 86%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      cards.forEach((card) => {
        const onEnter = () => {
          gsap.to(card, {
            y: -3,
            boxShadow: "0 0 28px rgba(0,180,216,0.1)",
            duration: 0.24,
            ease: "power2.out",
          });
        };

        const onLeave = () => {
          gsap.to(card, {
            y: 0,
            boxShadow: "0 0 0px rgba(0,180,216,0)",
            duration: 0.28,
            ease: "power2.out",
          });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
        });
      });

      [...certRows, ...eventCards].forEach((row) => {
        const onEnter = () =>
          gsap.to(row, { x: 3, duration: 0.22, ease: "power2.out" });

        const onLeave = () =>
          gsap.to(row, { x: 0, duration: 0.25, ease: "power2.out" });

        row.addEventListener("mouseenter", onEnter);
        row.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          row.removeEventListener("mouseenter", onEnter);
          row.removeEventListener("mouseleave", onLeave);
        });
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    {
      dependencies: [
        lowMotion,
        activeExperienceFilter,
        filteredExperience.length,
      ],
      revertOnUpdate: true,
      scope: sectionRef,
    },
  );

  return (
    <Section
      id="experience"
      surface="subtle"
      ref={sectionRef}
      className="relative z-0 !overflow-visible"
    >
      {!lowMotion ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        >
          <BackgroundScene beamCount={16} />
        </div>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_0%,rgba(72,202,228,0.08),transparent_42%)]"
        />
      )}

      <Container className="relative z-10">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Experience"
            titleClassName="lg:max-w-none lg:whitespace-nowrap"
            title={
              <>
                Work, <span className="emphasis-glow-gold">events</span>, and{" "}
                <span className="emphasis-glow-blue">community builds</span>.
              </>
            }
            description={
              <>
                From{" "}
                <span className="emphasis-glow-rose font-medium">
                  Studio Nomads
                </span>{" "}
                and{" "}
                <span className="emphasis-glow-white font-medium">WebX</span> to
                campus hackathons and{" "}
                <span className="emphasis-glow-blue font-medium">
                  blockchain communities
                </span>
                , this is the work behind the portfolio.
              </>
            }
          />
        </RevealOnScroll>

        <div className="mt-8 grid min-w-0 items-start gap-7 sm:mt-10 sm:gap-8 lg:grid-cols-[minmax(0,1.1fr)_3rem_minmax(0,0.9fr)] lg:gap-7">
          <div className="relative min-w-0 lg:h-[80rem]">
            <div className="flex min-w-0 flex-col lg:h-full">
              <div className="mb-5 sm:mb-6">
                <ExperienceFilterControl
                  activeFilter={activeExperienceFilter}
                  onChange={setActiveExperienceFilter}
                />
              </div>

              <MobileExperienceCarousel items={filteredExperience} />

              <div
                data-experience-list
                className="events-scroll hidden max-h-[60dvh] space-y-3 overflow-y-auto overflow-x-hidden scroll-smooth pr-2 sm:space-y-4 md:block md:max-h-[36rem] lg:max-h-none lg:flex-1"
              >
                {filteredExperience.length > 0 ? (
                  filteredExperience.map((item) => (
                    <article
                      key={item.id}
                      data-exp-card
                      className="relative min-w-0 rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.92),rgba(8,15,30,0.9))] p-4 transition-colors duration-300 hover:border-[rgba(72,202,228,0.28)] hover:bg-[linear-gradient(180deg,rgba(8,15,30,0.96),rgba(10,18,34,0.94))] sm:p-5 md:p-6"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <h3 className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-white sm:text-lg">
                            {item.organization}
                          </h3>

                          <span className="shrink-0 pt-0.5">
                            <Badge>{item.type}</Badge>
                          </span>
                        </div>

                        <p className="mt-1 break-words text-sm leading-relaxed text-[var(--blue-300)]">
                          {item.role}
                        </p>
                      </div>

                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground-subtle)] sm:text-xs">
                        {item.period}
                      </p>

                      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.02] px-4 py-8 text-center text-sm text-[var(--foreground-subtle)]">
                    No experience items found for this filter.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative z-0 hidden h-[80rem] items-stretch justify-center overflow-visible lg:flex"
          >
            <div
              data-timeline-rail
              className="absolute -top-[34rem] -bottom-56 left-1/2 w-px -translate-x-1/2"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(72,202,228,0.08) 12%, rgba(72,202,228,0.5) 28%, var(--blue-500) 48%, var(--blue-700) 72%, rgba(72,202,228,0.32) 88%, transparent 100%)",
              }}
            />

            <div
              data-timeline-traveller
              className="timeline-traveller absolute left-1/2 hidden h-[11px] w-[11px] -translate-x-1/2 rounded-full lg:block"
              style={{
                background: "var(--blue-400)",
                boxShadow:
                  "0 0 12px var(--blue-500), 0 0 24px rgba(0,180,216,0.5)",
                top: 0,
              }}
            />
          </div>

          <div className="sui-modular-panel relative flex min-w-0 flex-col gap-5 overflow-hidden sm:gap-6 lg:h-[80rem]">
            {!lowMotion ? (
              <>
                <span aria-hidden className="sui-stack-ring sui-stack-ring-a" />
                <span aria-hidden className="sui-stack-ring sui-stack-ring-b" />
              </>
            ) : null}

            <GlowCard
              intensity={lowMotion ? 0.15 : 0.28}
              tilt={false}
              className="flex min-h-0 flex-col rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(8,15,30,0.92))] p-4 sm:p-5 md:p-6 lg:basis-[39rem]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white sm:text-xl">
                    Certifications
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
                    Uploaded credentials grouped by issuer, with direct file
                    links for images and PDFs.
                  </p>
                </div>

                <div className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--blue-300)]">
                  {certifications.length} certs
                </div>
              </div>

              <div className="events-scroll mt-5 max-h-[60dvh] min-h-0 space-y-5 overflow-y-auto pr-2 md:max-h-[28rem] lg:max-h-none lg:flex-1">
                {certificationGroups.map(([issuer, items]) => (
                  <section key={issuer}>
                    <div className="relative z-10 mb-3 flex items-center justify-center gap-3 py-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(72,202,228,0.22)] to-[rgba(72,202,228,0.08)]" />

                      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[rgba(72,202,228,0.16)] bg-[rgba(72,202,228,0.06)] px-3 py-1 shadow-[0_0_20px_rgba(0,180,216,0.06)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-100)]">
                          {issuer}
                        </span>

                        <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                          {items.length}
                        </span>
                      </div>

                      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[rgba(72,202,228,0.22)] to-[rgba(72,202,228,0.08)]" />
                    </div>

                    <ul className="space-y-3">
                      {items.map((cert, index) => (
                        <li
                          key={cert.id ?? `${issuer}-${cert.name}-${index}`}
                          data-cert-row
                          className="cert-row flex items-start justify-between gap-3 rounded-2xl border border-[rgba(72,202,228,0.12)] bg-[linear-gradient(180deg,rgba(8,14,28,0.9),rgba(10,18,32,0.88))] p-3 sm:gap-4 sm:p-4"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-white">
                              {cert.name}
                            </p>

                            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                              {[cert.issuer, cert.issued]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>

                          {cert.image ? (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCert({
                                  name: cert.name,
                                  image: cert.image ?? "",
                                })
                              }
                              className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition-colors duration-300 hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                            >
                              View cert
                            </button>
                          ) : (
                            <span className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-dashed border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-subtle)] sm:min-h-0 sm:py-1.5">
                              Add image
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </GlowCard>

            <GlowCard
              intensity={lowMotion ? 0.15 : 0.28}
              tilt={false}
              className="flex min-h-0 flex-col rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(8,15,30,0.92))] p-4 sm:p-5 md:p-6 lg:flex-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white sm:text-xl">
                    Events
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
                    Structured event history across community town halls,
                    workshops, meetups, conferences, and hackathons.
                  </p>
                </div>

                <div className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--blue-300)]">
                  {eventHighlights.length} events
                </div>
              </div>

              <div className="events-scroll mt-5 max-h-[60dvh] min-h-0 min-w-0 space-y-5 overflow-y-auto overflow-x-hidden pr-2 lg:max-h-none lg:flex-1">
                {eventsByYear.map(([year, events]) => (
                  <section key={year}>
                    <div className="relative z-10 mb-3 flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(72,202,228,0.22)] to-[rgba(72,202,228,0.08)]" />

                      <div className="flex items-center gap-2 rounded-full border border-[rgba(72,202,228,0.16)] bg-[rgba(72,202,228,0.06)] px-3 py-1 shadow-[0_0_20px_rgba(0,180,216,0.06)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--blue-100)]">
                          {year}
                        </span>

                        <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                          {events.length}
                        </span>
                      </div>

                      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[rgba(72,202,228,0.22)] to-[rgba(72,202,228,0.08)]" />
                    </div>

                    <div className="space-y-3">
                      {events.map((event) => (
                        <article
                          key={event.id}
                          data-event-card
                          className="event-card min-w-0 rounded-2xl border border-[rgba(72,202,228,0.12)] bg-[linear-gradient(180deg,rgba(8,14,28,0.9),rgba(10,18,32,0.88))] p-3 transition-colors duration-300 hover:border-[rgba(72,202,228,0.24)] sm:p-4"
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--blue-300)]">
                                {event.date}
                              </p>

                              <h4 className="mt-2 break-words text-sm font-semibold leading-snug text-white sm:text-base">
                                {event.title}
                              </h4>
                            </div>

                            <span className="shrink-0 rounded-full border border-[var(--border)] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--foreground-muted)]">
                              {event.category}
                            </span>
                          </div>

                          <div className="mt-3 min-w-0 space-y-2 text-sm text-[var(--foreground-muted)]">
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--blue-400)]" />
                              <span className="min-w-0 break-words">
                                {event.venue}
                              </span>
                            </div>

                            {event.organizers ? (
                              <div className="flex items-start gap-2">
                                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--blue-400)]" />
                                <span className="min-w-0 break-words">
                                  {event.organizers}
                                </span>
                              </div>
                            ) : null}

                            {event.role ? (
                              <div className="flex items-start gap-2">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--blue-400)]" />
                                <span className="min-w-0 break-words">
                                  {event.role}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </GlowCard>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {activeCert ? (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={activeCert.name}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.975, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.975, y: 20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[var(--background-elevated)] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)] md:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="break-words text-lg font-semibold text-white">
                    {activeCert.name}
                  </p>

                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                    Certificate viewer
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCert(null)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/10"
                  aria-label="Close certificate viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isPdf ? (
                <iframe
                  src={activeCert.image}
                  title={activeCert.name}
                  className="h-[75vh] w-full rounded-2xl border border-[var(--border)] bg-white"
                />
              ) : (
                <div className="relative h-[75vh] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)]">
                  <Image
                    src={activeCert.image}
                    alt={activeCert.name}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Section>
  );
}
