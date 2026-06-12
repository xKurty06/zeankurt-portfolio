"use client";

import { useRef, useState } from "react";
import Image from "next/image";
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

interface PhotographyTeaserProps {
  creativeCategories?: CreativeCategory[];
}

export function PhotographyTeaser({ creativeCategories = [] }: PhotographyTeaserProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const categoryCards = creativeCategories.length > 0
    ? creativeCategories.map((category) => ({
      id: category.id,
      title: category.name,
      description: category.description,
      image: category.showcaseImage ?? category.photos[0]?.image,
      href: `/photography/${category.slug}`,
      meta: `${category.photos.length} ${category.photos.length === 1 ? "frame" : "frames"}`,
    }))
    : [];
  const uniqueCategoryCards = categoryCards.filter(
    (card, index, cards) => cards.findIndex((item) => item.title === card.title) === index,
  );
  const shouldMarquee = uniqueCategoryCards.length > 4;
  const renderedCards = shouldMarquee ? [...uniqueCategoryCards, ...uniqueCategoryCards] : uniqueCategoryCards;

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
            scrub: 1.2,
          },
        });

        const onEnter = () => {
          gsap.to(img, { scale: 1.08, y: -8, duration: 0.6, ease: "power2.out" });
          if (overlay) gsap.to(overlay, { opacity: 1, duration: 0.35 });
          if (caption) gsap.to(caption, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
        };
        const onLeave = () => {
          gsap.to(img, { scale: 1, y: 0, duration: 0.7, ease: "elastic.out(1, 0.7)" });
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
    { scope: sectionRef },
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

        <div className="mt-10 overflow-hidden">
          <div
            onMouseEnter={() => setIsMarqueePaused(true)}
            onMouseLeave={() => setIsMarqueePaused(false)}
            className={
              shouldMarquee
                ? "photo-category-marquee flex w-max gap-4"
                : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            }
            style={shouldMarquee ? { animationPlayState: isMarqueePaused ? "paused" : "running" } : undefined}
          >
          {renderedCards.map((card, index) => (
            <Link
              key={`${card.id}-${index}`}
              href={card.href}
              data-photo-card
              data-interactive
              className={shouldMarquee
                ? "photo-card group relative block w-[78vw] shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-black sm:w-72 lg:w-80"
                : "photo-card group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-black"}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {card.image ? (
                  <div data-photo-img className="absolute inset-0">
                    <Image
                      src={card.image}
                      alt={`${card.title} category showcase`}
                      fill
                      className="object-cover"
                      sizes={shouldMarquee ? "(max-width: 640px) 78vw, 320px" : "(max-width: 640px) 100vw, 25vw"}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,28,0.9),rgba(4,8,18,0.96))]" />
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
                  {!card.image ? (
                    <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Upload showcase image in admin CMS
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
          </div>
        </div>

        <style jsx>{`
          .photo-category-marquee {
            animation: photo-category-marquee 34s linear infinite;
          }

          @keyframes photo-category-marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .photo-category-marquee {
              animation: none;
              overflow-x: auto;
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
