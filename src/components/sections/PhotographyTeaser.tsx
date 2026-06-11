"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { featuredPhotos, getPhotoImageUrl } from "@/data/photography";
import { siteConfig } from "@/data/site";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { DottedSurface } from "@/components/ui/DottedSurface";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

export function PhotographyTeaser() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();

      const photos = gsap.utils.toArray<HTMLElement>("[data-photo-card]");

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
      });
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

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPhotos.map((photo) => (
            <Link
              key={photo.id}
              href="/photography"
              data-photo-card
              data-interactive
              className="photo-card group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-black"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <div data-photo-img className="absolute inset-0">
                  <Image
                    src={getPhotoImageUrl(photo.imageSeed, 800, 1000)}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
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
                    {photo.category}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{photo.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

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
