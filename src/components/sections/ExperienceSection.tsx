"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight, MapPin, Sparkles, Users, X } from "lucide-react";
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

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
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

      {activeItem ? (
        <div
          className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeItem.organization} details`}
        >
          <div className="animate-modal-in max-h-[82dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[var(--background-elevated)] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)]">
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
          </div>
        </div>
      ) : null}
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

  const [activeCert, setActiveCert] = useState<{ name: string; image: string } | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...eventHighlights].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [eventHighlights],
  );

  const certificationGroups = useMemo(() => {
    const rawCertificationGroups = Object.entries(
      certifications.reduce<Record<string, typeof certifications>>((groups, cert) => {
        groups[cert.issuer] ??= [];
        groups[cert.issuer].push(cert);

        return groups;
      }, {}),
    );

    const majorCertificationGroups = rawCertificationGroups.filter(
      ([, items]) => items.length >= 3,
    );

    const otherCertificationItems = rawCertificationGroups
      .filter(([, items]) => items.length < 3)
      .flatMap(([, items]) => items);

    return [
      ...majorCertificationGroups,
      ...(otherCertificationItems.length ? ([["Other", otherCertificationItems]] as const) : []),
    ];
  }, [certifications]);

  const eventsByYear = useMemo(() => {
    const eventGroups = sortedEvents.reduce<Record<string, typeof eventHighlights>>(
      (groups, event) => {
        groups[event.year] ??= [];
        groups[event.year].push(event);

        return groups;
      },
      {},
    );

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

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeCert]);

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      if (!section) return;

      const cleanups: Array<() => void> = [];

      const line = section.querySelector<HTMLElement>("[data-timeline-line]");
      const traveller = section.querySelector<HTMLElement>("[data-timeline-traveller]");
      const cards = gsap.utils.toArray<HTMLElement>("[data-exp-card]", section);
      const certRows = gsap.utils.toArray<HTMLElement>("[data-cert-row]", section);

      if (lowMotion) {
        if (line) {
          gsap.set(line, {
            scaleY: 1,
            transformOrigin: "top center",
          });
        }

        if (traveller) {
          gsap.set(traveller, {
            autoAlpha: 0,
          });
        }

        gsap.set([...cards, ...certRows], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotateY: 0,
          scale: 1,
          clearProps: "filter,transform,opacity,visibility,boxShadow",
        });

        return;
      }

      if (line) {
        gsap.fromTo(
          line,
          {
            scaleY: 0,
            transformOrigin: "top center",
          },
          {
            scaleY: 1,
            duration: 0.8,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 76%",
              end: "bottom 84%",
              scrub: 0.35,
            },
          },
        );
      }

      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            autoAlpha: 0,
            x: -18,
            y: 10,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.45,
            delay: index * 0.04,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );

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

      certRows.forEach((row) => {
        const onEnter = () => gsap.to(row, { x: 3, duration: 0.22, ease: "power2.out" });
        const onLeave = () => gsap.to(row, { x: 0, duration: 0.25, ease: "power2.out" });

        row.addEventListener("mouseenter", onEnter);
        row.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          row.removeEventListener("mouseenter", onEnter);
          row.removeEventListener("mouseleave", onLeave);
        });
      });

      if (traveller && line && section) {
        let previousTop = 0;
        let stopTimer: number | null = null;
        const setTravellerTop = gsap.quickSetter(traveller, "top", "px");

        const updateTraveller = () => {
          if (line.offsetHeight <= 0) return;

          const offsetParent = traveller.offsetParent;
          if (!(offsetParent instanceof HTMLElement)) return;

          const parentRect = offsetParent.getBoundingClientRect();
          const viewportCenter = window.innerHeight / 2;
          const minTop = line.offsetTop;
          const maxTop = line.offsetTop + line.offsetHeight;
          const targetTop = viewportCenter - parentRect.top;
          const nextTop = gsap.utils.clamp(minTop, maxTop, targetTop);

          if (Math.abs(nextTop - previousTop) > 0.75) {
            traveller.dataset.travelDirection = nextTop > previousTop ? "down" : "up";
            traveller.dataset.travelState = "moving";
            previousTop = nextTop;

            if (stopTimer) {
              window.clearTimeout(stopTimer);
            }

            stopTimer = window.setTimeout(() => {
              traveller.dataset.travelState = "stopped";
            }, 160);
          }

          setTravellerTop(nextTop);
        };

        gsap.set(traveller, { yPercent: -50 });
        traveller.dataset.travelState = "stopped";

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.75,
          onRefresh: () => updateTraveller(),
          onUpdate: () => updateTraveller(),
        });

        cleanups.push(() => {
          if (stopTimer) {
            window.clearTimeout(stopTimer);
          }
        });
      }

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section id="experience" surface="subtle" ref={sectionRef}>
      {!lowMotion ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
          <BackgroundScene beamCount={16} />
        </div>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(72,202,228,0.08),transparent_42%)]"
        />
      )}

      <Container className="relative z-[1]">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Experience"
            title="Work, events, and community builds."
            description="From Studio Nomads and WebX to campus hackathons and blockchain communities, this is the work behind the portfolio."
          />
        </RevealOnScroll>

        <div className="mt-8 grid min-w-0 gap-7 sm:mt-10 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="relative min-w-0">
            <div
              data-timeline-line
              className="absolute bottom-2 left-0 top-2 hidden w-px md:block"
              style={{
                background:
                  "linear-gradient(to bottom, var(--blue-500), var(--blue-700), transparent)",
              }}
            />

            <div
              data-timeline-traveller
              aria-hidden
              className="timeline-traveller absolute left-[-5px] hidden h-[11px] w-[11px] rounded-full md:block"
              style={{
                background: "var(--blue-400)",
                boxShadow: "0 0 12px var(--blue-500), 0 0 24px rgba(0,180,216,0.5)",
                top: 0,
              }}
            />

            <MobileExperienceCarousel items={experience} />

            <div className="hidden space-y-3 sm:space-y-4 md:block md:pl-6">
              {experience.map((item) => (
                <article
                  key={item.id}
                  data-exp-card
                  className="relative min-w-0 rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.92),rgba(8,15,30,0.9))] p-4 transition-colors duration-300 hover:border-[rgba(72,202,228,0.28)] hover:bg-[linear-gradient(180deg,rgba(8,15,30,0.96),rgba(10,18,34,0.94))] sm:p-5 md:p-6"
                >
                  <div className="timeline-dot absolute -left-[calc(1.5rem+6px)] top-7 hidden h-3 w-3 rounded-full border-2 border-[var(--blue-500)] bg-[var(--background-subtle)] md:block" />

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
              ))}
            </div>
          </div>

          <div className="sui-modular-panel relative min-w-0 space-y-5 overflow-hidden sm:space-y-6">
            {!lowMotion ? (
              <>
                <span aria-hidden className="sui-stack-ring sui-stack-ring-a" />
                <span aria-hidden className="sui-stack-ring sui-stack-ring-b" />
              </>
            ) : null}

            <RevealOnScroll delay={0.08} variant={lowMotion ? "fade-up" : "scale-in"}>
              <GlowCard
                intensity={lowMotion ? 0.15 : 0.28}
                tilt={false}
                className="rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(8,15,30,0.92))] p-4 sm:p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white sm:text-xl">
                      Certifications
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
                      Uploaded credentials grouped by issuer, with direct file links for images and PDFs.
                    </p>
                  </div>

                  <div className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--blue-300)]">
                    {certifications.length} certs
                  </div>
                </div>

                <div className="events-scroll mt-5 max-h-[60dvh] space-y-5 overflow-y-auto pr-2 md:max-h-[28rem]">
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
                                {[cert.issuer, cert.issued].filter(Boolean).join(" · ")}
                              </p>
                            </div>

                            {cert.image ? (
                              <button
                                type="button"
                                onClick={() => setActiveCert({ name: cert.name, image: cert.image ?? "" })}
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
            </RevealOnScroll>

            <RevealOnScroll delay={0.14} variant={lowMotion ? "fade-up" : "scale-in"}>
              <GlowCard
                intensity={lowMotion ? 0.15 : 0.28}
                tilt={false}
                className="rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(8,15,30,0.92))] p-4 sm:p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white sm:text-xl">
                      Events
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
                      Structured event history across community town halls, workshops, meetups,
                      conferences, and hackathons.
                    </p>
                  </div>

                  <div className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--blue-300)]">
                    {eventHighlights.length} events
                  </div>
                </div>

                <div className="events-scroll mt-5 max-h-[60dvh] min-w-0 space-y-5 overflow-y-auto overflow-x-hidden pr-2 lg:max-h-[42rem]">
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
                                <span className="min-w-0 break-words">{event.venue}</span>
                              </div>

                              {event.organizers ? (
                                <div className="flex items-start gap-2">
                                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--blue-400)]" />
                                  <span className="min-w-0 break-words">{event.organizers}</span>
                                </div>
                              ) : null}

                              {event.role ? (
                                <div className="flex items-start gap-2">
                                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--blue-400)]" />
                                  <span className="min-w-0 break-words">{event.role}</span>
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
            </RevealOnScroll>
          </div>
        </div>
      </Container>

      {activeCert ? (
        <div
          className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={activeCert.name}
        >
          <div className="animate-modal-in w-full max-w-5xl rounded-3xl border border-white/10 bg-[var(--background-elevated)] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)] md:p-5">
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
          </div>
        </div>
      ) : null}
    </Section>
  );
}
