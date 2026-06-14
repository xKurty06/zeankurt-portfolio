"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { siteConfig } from "@/data/site";
import type { CreativeCategory } from "@/types";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { DottedSurface } from "@/components/ui/DottedSurface";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";

interface PhotographyTeaserProps {
  creativeCategories?: CreativeCategory[];
}

export function PhotographyTeaser({ creativeCategories = [] }: PhotographyTeaserProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const marqueeViewportRef = useRef<HTMLDivElement>(null);
  const lowMotion = useLowMotionDevice();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const categoryCards = creativeCategories.length > 0
    ? creativeCategories.map((category) => ({
      id: category.id,
      title: category.name,
      description: category.description,
      image: category.showcaseImage ?? category.photos[0]?.image,
      aspectRatio: category.photos[0]?.aspectRatio ?? "landscape",
      href: `/photography/${category.slug}`,
      meta: `${category.photos.length} ${category.photos.length === 1 ? "frame" : "frames"}`,
    }))
    : [];
  const uniqueCategoryCards = categoryCards.filter(
    (card, index, cards) => cards.findIndex((item) => item.title === card.title) === index,
  );
  const shouldMarquee = uniqueCategoryCards.length > 4;
  const enableInteractiveMarquee = shouldMarquee && !prefersReducedMotion;
  const renderedCards = shouldMarquee ? [...uniqueCategoryCards, ...uniqueCategoryCards] : uniqueCategoryCards;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!enableInteractiveMarquee) return;

    const viewport = marqueeViewportRef.current;
    if (!viewport) return;

    let intervalId = 0;
    let isPointerDown = false;
    let isDragging = false;
    let isHovered = false;
    let startX = 0;
    let startScrollLeft = 0;
    let pointerLastX = 0;
    let pointerLastTime = 0;
    let velocity = 0;
    let preventClick = false;
    let loopWidth = 0;
    const dragThreshold = 8;
    let autoSpeed = window.innerWidth >= 1024 ? 0.04 : 0.065;

    const measure = () => {
      loopWidth = viewport.scrollWidth / 2;
      autoSpeed = window.innerWidth >= 1024 ? 0.04 : 0.065;
      if (loopWidth > viewport.clientWidth && viewport.scrollLeft === 0) {
        viewport.scrollLeft = loopWidth;
      }
    };

    const syncLoopPosition = () => {
      if (loopWidth <= viewport.clientWidth) return;
      if (viewport.scrollLeft >= loopWidth) {
        viewport.scrollLeft -= loopWidth;
      } else if (viewport.scrollLeft <= 0) {
        viewport.scrollLeft += loopWidth;
      }
    };

    const step = () => {
      if (loopWidth <= viewport.clientWidth) {
        return;
      }

      if (!isPointerDown && !isHovered && Math.abs(velocity) > 0.01) {
        viewport.scrollLeft += velocity * 16;
        velocity *= 0.94;
        syncLoopPosition();
      } else if (!isPointerDown && !isHovered) {
        viewport.scrollLeft += autoSpeed * 16;
        syncLoopPosition();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      isPointerDown = true;
      isDragging = false;
      preventClick = false;
      velocity = 0;
      startX = event.clientX;
      startScrollLeft = viewport.scrollLeft;
      pointerLastX = event.clientX;
      pointerLastTime = event.timeStamp;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return;
      const deltaX = event.clientX - startX;
      if (!isDragging && Math.abs(deltaX) < dragThreshold) return;
      if (!isDragging) {
        isDragging = true;
        preventClick = true;
        viewport.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      viewport.scrollLeft = startScrollLeft - deltaX;
      const elapsed = Math.max(1, event.timeStamp - pointerLastTime);
      velocity = (pointerLastX - event.clientX) / elapsed;
      pointerLastX = event.clientX;
      pointerLastTime = event.timeStamp;
      syncLoopPosition();
    };

    const releasePointer = (event: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      if (isDragging && viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      if (!isDragging) {
        velocity = 0;
        return;
      }
      isDragging = false;
      velocity = Math.max(-1.25, Math.min(1.25, velocity));
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!preventClick) return;
      preventClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    const resetPointerState = () => {
      isPointerDown = false;
      isDragging = false;
      preventClick = false;
    };

    measure();
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    viewport.addEventListener("click", handleClickCapture, true);
    viewport.addEventListener("dragstart", handleDragStart);
    viewport.addEventListener("mouseenter", handleMouseEnter);
    viewport.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", resetPointerState);
    window.addEventListener("resize", measure);

    intervalId = window.setInterval(step, 16);

    return () => {
      window.clearInterval(intervalId);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      viewport.removeEventListener("click", handleClickCapture, true);
      viewport.removeEventListener("dragstart", handleDragStart);
      viewport.removeEventListener("mouseenter", handleMouseEnter);
      viewport.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", resetPointerState);
      window.removeEventListener("resize", measure);
    };
  }, [enableInteractiveMarquee]);

  useGSAP(
    () => {
      registerGsapPlugins();

      const photos = gsap.utils.toArray<HTMLElement>("[data-photo-card]");
      const cleanups: Array<() => void> = [];

      photos.forEach((card, i) => {
        // Staggered reveal with vertical clip
        gsap.fromTo(
          card,
          { autoAlpha: 0, clipPath: "inset(100% 0 0 0)", y: 20 },
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0 0 0)",
            y: 0,
            duration: 0.85,
            delay: i * 0.1,
            ease: "expo.out",
            scrollTrigger: {
              trigger: card, start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );

        // Hover: photo slides up with parallax within card
        const img = card.querySelector<HTMLElement>("[data-photo-img]");
        const overlay = card.querySelector<HTMLElement>("[data-photo-overlay]");
        const caption = card.querySelector<HTMLElement>("[data-photo-caption]");

        if (!img) return;

        gsap.to(img, {
          yPercent: i % 2 === 0 ? -5 : 5,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: lowMotion ? false : 1.2,
          },
        });

        if (lowMotion) return;

        const onEnter = () => {
          if (overlay) gsap.to(overlay, { opacity: 1, duration: 0.35 });
          if (caption) gsap.to(caption, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
        };
        const onLeave = () => {
          if (overlay) gsap.to(overlay, { opacity: 0.8, duration: 0.45 });
          if (caption) gsap.to(caption, { y: 6, opacity: 0.85, duration: 0.4, ease: "power2.out" });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
        });
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section
      id="photography-teaser"
      surface="elevated"
      ref={sectionRef}
      className="photography-theme relative isolate overflow-hidden bg-[var(--photo-surface)] text-[var(--photo-accent)]"
    >
      <DottedSurface className="opacity-100 mix-blend-screen" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(72,202,228,0.18),transparent_24%),radial-gradient(circle_at_82%_76%,rgba(144,224,239,0.14),transparent_26%),linear-gradient(180deg,rgba(5,8,18,0.28),rgba(5,8,18,0.56)_40%,rgba(3,7,18,0.76))]"
      />

      <Container className="relative z-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <RevealOnScroll>
            <SectionHeading
              eyebrow="Photography"
              title="Visual work under shot.by.zk."
              description="Event coverage, portraits, and editorial frames — produced solo and with Studio Nomads."
            />
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <Button href="/photography" variant="secondary">
              View full gallery
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </RevealOnScroll>
        </div>

        <div
          ref={marqueeViewportRef}
          className={
            enableInteractiveMarquee
              ? "photo-marquee-viewport mt-10 max-w-full overflow-x-auto overflow-y-hidden"
              : "mt-10 max-w-full overflow-hidden"
          }
        >
          <div
            className={
              enableInteractiveMarquee
                ? "photo-category-marquee flex w-max max-w-none gap-4"
                : "grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            }
          >
          {renderedCards.map((card, index) => (
            <Link
              key={`${card.id}-${index}`}
              href={card.href}
              data-photo-card
              data-interactive
              draggable={false}
              className={shouldMarquee
                ? "photo-card group relative block w-[78vw] max-w-[22rem] shrink-0 select-none overflow-hidden rounded-2xl border border-[var(--border)] bg-black sm:w-72 lg:w-80"
                : "photo-card group relative block min-w-0 select-none overflow-hidden rounded-2xl border border-[var(--border)] bg-black"}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]">
                {card.image ? (
                  <div
                    className="absolute inset-0 select-none"
                  >
                    <img
                      data-photo-img
                      src={card.image}
                      alt={`${card.title} category showcase`}
                      draggable={false}
                      className="h-full w-full scale-[1.08] select-none object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,28,0.9),rgba(4,8,18,0.96))]"
                  />
                )}
                {/* Gradient overlay */}
                <div
                  data-photo-overlay
                  className="absolute inset-0 opacity-80"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                  }}
                />
                {/* Hover glow rim */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    boxShadow: "inset 0 0 30px rgba(0,180,216,0.2)",
                  }}
                />
                {/* Caption */}
                <div
                  data-photo-caption
                  className="absolute inset-x-0 bottom-0 p-4"
                  style={{ opacity: 0.85, transform: "translateY(6px)" }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--blue-300)]">
                    {card.meta}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">{card.title}</p>
                  {card.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/65">{card.description}</p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
          </div>
        </div>

        <style jsx>{`
          .photo-marquee-viewport {
            -ms-overflow-style: none;
            scrollbar-width: none;
            touch-action: pan-y;
            cursor: grab;
            user-select: none;
            -webkit-user-select: none;
          }

          .photo-marquee-viewport::-webkit-scrollbar {
            display: none;
          }

          .photo-marquee-viewport:active {
            cursor: grabbing;
          }

          .photo-category-marquee {
            padding-bottom: 0.25rem;
          }

          :global(.photo-card) {
            -webkit-user-drag: none;
          }

          @media (prefers-reduced-motion: reduce) {
            .photo-category-marquee {
              max-width: 100%;
            }
          }
        `}</style>

        <RevealOnScroll delay={0.12}>
          <p className="mt-6 text-sm text-[var(--foreground-muted)]">
            Follow{" "}
            <a
              href="https://www.instagram.com/shot.by.zk/"
              target="_blank"
              rel="noopener noreferrer"
              data-interactive
              className="text-[var(--blue-300)] hover:text-white transition"
            >
              @{siteConfig.photographyBrand}
            </a>{" "}
            and{" "}
            <a
              href="https://www.facebook.com/officialstudionomads/"
              target="_blank"
              rel="noopener noreferrer"
              data-interactive
              className="text-[var(--blue-300)] hover:text-white transition"
            >
              @{siteConfig.studioNomadsBrand}
            </a>{" "}
            for latest shoots and Studio Nomads collaborations.
          </p>
        </RevealOnScroll>
      </Container>
    </Section>
  );
}
