"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { MapPin, Sparkles, Users, X } from "lucide-react";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { GlowCard } from "@/components/animation/GlowCard";
import { Badge } from "@/components/ui/Badge";
import BackgroundScene from "@/components/ui/AuroraSectionHero";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins, ScrollTrigger } from "@/lib/gsap";
import type { Certification, EventHighlight, ExperienceItem } from "@/types";

interface ExperienceSectionProps {
  experience: ExperienceItem[];
  certifications: Certification[];
  eventHighlights: EventHighlight[];
}

export function ExperienceSection({
  experience,
  certifications,
  eventHighlights,
}: ExperienceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeCert, setActiveCert] = useState<{ name: string; image: string } | null>(null);
  const sortedEvents = [...eventHighlights].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const rawCertificationGroups = Object.entries(
    certifications.reduce<Record<string, typeof certifications>>((groups, cert) => {
      groups[cert.issuer] ??= [];
      groups[cert.issuer].push(cert);
      return groups;
    }, {}),
  );
  const majorCertificationGroups = rawCertificationGroups.filter(([, items]) => items.length >= 3);
  const otherCertificationItems = rawCertificationGroups
    .filter(([, items]) => items.length < 3)
    .flatMap(([, items]) => items);
  const certificationGroups = [
    ...majorCertificationGroups,
    ...(otherCertificationItems.length ? ([["Other", otherCertificationItems]] as const) : []),
  ];
  const eventGroups = sortedEvents.reduce<Record<string, typeof eventHighlights>>((groups, event) => {
    groups[event.year] ??= [];
    groups[event.year].push(event);
    return groups;
  }, {});
  const eventsByYear = Object.keys(eventGroups)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => [year, eventGroups[year]] as const);
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
      const cleanups: Array<() => void> = [];

      const line = sectionRef.current?.querySelector<HTMLElement>("[data-timeline-line]");
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0, transformOrigin: "top center" },
          {
            scaleY: 1,
            duration: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "bottom 80%",
              scrub: 0.5,
            },
          },
        );
      }

      const cards = gsap.utils.toArray<HTMLElement>("[data-exp-card]");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, x: -40, rotateY: -5 },
          {
            autoAlpha: 1,
            x: 0,
            rotateY: 0,
            duration: 0.8,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );

        const onEnter = () => {
          gsap.to(card, {
            y: -4,
            boxShadow: "0 0 40px rgba(0,180,216,0.15)",
            duration: 0.3,
            ease: "power2.out",
          });
        };

        const onLeave = () => {
          gsap.to(card, {
            y: 0,
            boxShadow: "0 0 0px rgba(0,180,216,0)",
            duration: 0.5,
            ease: "elastic.out(1, 0.6)",
          });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
        });
      });

      const certRows = gsap.utils.toArray<HTMLElement>("[data-cert-row]");
      certRows.forEach((row) => {
        const onEnter = () => gsap.to(row, { x: 4, duration: 0.28, ease: "power2.out" });
        const onLeave = () => gsap.to(row, { x: 0, duration: 0.35, ease: "power2.out" });

        row.addEventListener("mouseenter", onEnter);
        row.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          row.removeEventListener("mouseenter", onEnter);
          row.removeEventListener("mouseleave", onLeave);
        });
      });

      const traveller = sectionRef.current?.querySelector<HTMLElement>("[data-timeline-traveller]");
      const lineEl = sectionRef.current?.querySelector<HTMLElement>("[data-timeline-line]");
      if (traveller && lineEl && sectionRef.current) {
        let previousTop = 0;
        let stopTimer: number | null = null;
        const setTravellerTop = gsap.quickSetter(traveller, "top", "px");

        const updateTraveller = () => {
          if (lineEl.offsetHeight <= 0) return;

          const offsetParent = traveller.offsetParent;
          if (!(offsetParent instanceof HTMLElement)) return;

          const parentRect = offsetParent.getBoundingClientRect();

          const viewportCenter = window.innerHeight / 2;
          const minTop = lineEl.offsetTop;
          const maxTop = lineEl.offsetTop + lineEl.offsetHeight;
          const targetTop = viewportCenter - parentRect.top;
          const nextTop = gsap.utils.clamp(minTop, maxTop, targetTop);

          if (Math.abs(nextTop - previousTop) > 0.5) {
            traveller.dataset.travelDirection = nextTop > previousTop ? "down" : "up";
            traveller.dataset.travelState = "moving";
            previousTop = nextTop;

            if (stopTimer) {
              window.clearTimeout(stopTimer);
            }

            stopTimer = window.setTimeout(() => {
              traveller.dataset.travelState = "stopped";
            }, 140);
          }

          setTravellerTop(nextTop);
        };

        gsap.set(traveller, { yPercent: -50 });
        traveller.dataset.travelState = "stopped";

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
          onRefresh: () => updateTraveller(),
          onUpdate: () => updateTraveller(),
        });

        return () => {
          if (stopTimer) {
            window.clearTimeout(stopTimer);
          }
          cleanups.forEach((cleanup) => cleanup());
        };
      }

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    { scope: sectionRef },
  );

  return (
    <Section id="experience" surface="subtle" ref={sectionRef}>
      <BackgroundScene beamCount={44} />
      <Container className="relative z-[1]">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Experience"
            title="Building in public - work, events, and hackathons."
            description="From co-founding NameThat and Studio Nomads to contributing across Team1 Philippines, Base Philippines, and campus blockchain events."
          />
        </RevealOnScroll>

        <div className="mt-12 grid min-w-0 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-w-0">
            <div
              data-timeline-line
              className="absolute left-0 top-2 bottom-2 hidden w-px md:block"
              style={{
                background: "linear-gradient(to bottom, var(--blue-500), var(--blue-700), transparent)",
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

            <div className="space-y-4 md:pl-6">
              {experience.map((item) => (
                <article
                  key={item.id}
                  data-exp-card
                  className="relative min-w-0 rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.92),rgba(8,15,30,0.9))] p-5 transition-colors duration-300 hover:border-[rgba(72,202,228,0.28)] hover:bg-[linear-gradient(180deg,rgba(8,15,30,0.96),rgba(10,18,34,0.94))] md:p-6"
                >
                  <div className="timeline-dot absolute -left-[calc(1.5rem+6px)] top-7 hidden h-3 w-3 rounded-full border-2 border-[var(--blue-500)] bg-[var(--background-subtle)] md:block" />

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 break-words text-lg font-semibold leading-snug text-white">
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
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                    {item.period}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="sui-modular-panel relative min-w-0 space-y-6 overflow-hidden">
            <span aria-hidden className="sui-stack-ring sui-stack-ring-a" />
            <span aria-hidden className="sui-stack-ring sui-stack-ring-b" />
            <RevealOnScroll delay={0.08} variant="scale-in">
              <GlowCard
                intensity={0.35}
                tilt={false}
                className="rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(8,15,30,0.92))] p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
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
                      <div className="sticky top-0 z-10 mb-3 flex items-center gap-3 py-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(72,202,228,0.22)] to-[rgba(72,202,228,0.08)]" />
                        <div className="flex items-center gap-2 rounded-full border border-[rgba(72,202,228,0.16)] bg-[rgba(72,202,228,0.06)] px-3 py-1 shadow-[0_0_24px_rgba(0,180,216,0.08)]">
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
                            className="cert-row flex items-start justify-between gap-4 rounded-2xl border border-[rgba(72,202,228,0.12)] bg-[linear-gradient(180deg,rgba(8,14,28,0.9),rgba(10,18,32,0.88))] p-4"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">{cert.name}</p>
                              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                                {[cert.issuer, cert.issued].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            {cert.image ? (
                              <button
                                type="button"
                                onClick={() => setActiveCert({ name: cert.name, image: cert.image ?? "" })}
                                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition-colors duration-300 hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                              >
                                View cert
                              </button>
                            ) : (
                              <span className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-dashed border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-subtle)] sm:min-h-0 sm:py-1.5">
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

            <RevealOnScroll delay={0.14} variant="scale-in">
              <GlowCard
                intensity={0.35}
                tilt={false}
                className="rounded-2xl border border-[rgba(72,202,228,0.14)] bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(8,15,30,0.92))] p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
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
                      <div className="sticky top-0 z-10 mb-3 flex items-center gap-3 py-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(72,202,228,0.22)] to-[rgba(72,202,228,0.08)]" />
                        <div className="flex items-center gap-2 rounded-full border border-[rgba(72,202,228,0.16)] bg-[rgba(72,202,228,0.06)] px-3 py-1 shadow-[0_0_24px_rgba(0,180,216,0.08)]">
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
                            className="event-card min-w-0 rounded-2xl border border-[rgba(72,202,228,0.12)] bg-[linear-gradient(180deg,rgba(8,14,28,0.9),rgba(10,18,32,0.88))] p-4 transition-colors duration-300 hover:border-[rgba(72,202,228,0.24)]"
                          >
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--blue-300)]">
                                  {event.date}
                                </p>
                                <h4 className="mt-2 break-words text-base font-semibold leading-snug text-white">
                                  {event.title}
                                </h4>
                              </div>
                              <span className="rounded-full border border-[var(--border)] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--foreground-muted)]">
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
              <div>
                <p className="text-lg font-semibold text-white">{activeCert.name}</p>
                <p className="mt-1 text-xs font-mono uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
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
