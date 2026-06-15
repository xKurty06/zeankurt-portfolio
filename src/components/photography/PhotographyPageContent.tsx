"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import type { SiteConfig } from "@/types/site";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import {
  buildPhotoCategories,
  buildPhotographyAlbums,
  buildPhotographyPhotos,
} from "@/lib/photography";
import { AlbumCard } from "@/components/photography/AlbumCard";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { BackgroundBoxes } from "@/components/ui/BackgroundBoxes";
import { SocialLinks } from "@/components/ui/SocialLinks";
import type { CreativeCategory } from "@/types";

const PHOTOS_PER_PAGE = 24;

interface PhotographyPageContentProps {
  creativeCategories: CreativeCategory[];
  siteConfig: SiteConfig;
}

export function PhotographyPageContent({
  creativeCategories,
  siteConfig,
}: PhotographyPageContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const gallerySectionRef = useRef<HTMLElement>(null);

  const photoAlbums = useMemo(
    () => buildPhotographyAlbums(creativeCategories),
    [creativeCategories],
  );

  const photoCategories = useMemo(
    () => buildPhotoCategories(creativeCategories),
    [creativeCategories],
  );

  const photos = useMemo(
    () => buildPhotographyPhotos(creativeCategories),
    [creativeCategories],
  );

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "All") return photos;

    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory, photos]);

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPhotos = useMemo(() => {
    const start = (safeCurrentPage - 1) * PHOTOS_PER_PAGE;
    const end = start + PHOTOS_PER_PAGE;

    return filteredPhotos.slice(start, end);
  }, [filteredPhotos, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setLightboxIndex(null);
  }, [activeCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);

    setCurrentPage(nextPage);
    setLightboxIndex(null);

    requestAnimationFrame(() => {
      gallerySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  useGSAP(
    () => {
      registerGsapPlugins();

      gsap.from("[data-photo-hero='line']", {
        autoAlpha: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
      });
    },
    { scope: heroRef },
  );

  return (
    <>
      <div
        ref={heroRef}
        className="relative isolate overflow-hidden border-b border-white/10 pb-16 pt-28 md:pb-20 md:pt-32"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-slate-950/80" />

          <div className="absolute inset-0 opacity-80 [mask-image:linear-gradient(180deg,transparent,white_7%,white_88%,transparent)]">
            <BackgroundBoxes variant="full" className="[filter:brightness(0.88)]" />
          </div>

          <div className="pointer-events-none absolute inset-0 z-[1] bg-slate-950/40 [mask-image:radial-gradient(transparent,white)]" />
        </div>

        <Container className="pointer-events-none relative z-10">
          <p
            data-photo-hero="line"
            className="font-mono text-xs uppercase tracking-[0.28em] text-white/50"
          >
            {siteConfig.photographyBrand}
          </p>

          <h1
            data-photo-hero="line"
            className="mt-4 max-w-3xl break-words font-[family-name:var(--font-syne)] text-[clamp(1.875rem,8vw,2.5rem)] font-semibold leading-tight text-white sm:text-5xl md:text-6xl"
          >
            Photography & visual stories from events, portraits, and the streets.
          </h1>

          <p
            data-photo-hero="line"
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
          >
            Work published under shot.by.zk and produced with Studio Nomads — covering Web3
            community events, campus activations, and editorial shoots.
          </p>

          <div data-photo-hero="line" className="pointer-events-auto mt-8">
            <SocialLinks links={socialGroups.photography} />
          </div>
        </Container>
      </div>

      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.72),rgba(3,7,18,0.42)_30%,rgba(3,7,18,0.58)_68%,rgba(3,7,18,0.82))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(72,202,228,0.22),transparent_28%),radial-gradient(circle_at_82%_30%,rgba(0,180,216,0.16),transparent_30%),radial-gradient(circle_at_46%_72%,rgba(2,62,138,0.24),transparent_40%)]" />
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(72,202,228,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(72,202,228,0.07)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:linear-gradient(180deg,transparent,white_10%,white_90%,transparent)]" />
          <div className="absolute left-[6%] top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.2),transparent_70%)] blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute bottom-10 right-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.26),transparent_72%)] blur-3xl sm:h-96 sm:w-96" />
        </div>

        <Container className="relative z-10 py-14 md:py-20">
          <section id="albums" className="scroll-mt-28 px-0 py-0">
            <div className="mb-8 flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  Albums
                </p>

                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold text-white">
                  Collections
                </h2>
              </div>
            </div>

            {photoAlbums.length > 0 ? (
              <div className="grid max-w-full grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {photoAlbums.map((album) => (
                  <AlbumCard key={album.slug} album={album} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/65">
                No photography categories are published yet.
              </div>
            )}
          </section>

          <section ref={gallerySectionRef} className="mt-20 scroll-mt-28">
            <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  Gallery
                </p>

                <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-start">
                  <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold leading-tight text-white">
                    All frames
                  </h2>

                  <span className="inline-flex items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--blue-300)] shadow-[0_0_18px_rgba(0,180,216,0.08)]">
                    {filteredPhotos.length} frames
                  </span>
                </div>
              </div>

              {photos.length > 0 ? (
                <GalleryFilter
                  categories={photoCategories}
                  active={activeCategory}
                  onChange={setActiveCategory}
                />
              ) : null}
            </div>

            {filteredPhotos.length > 0 ? (
              <>
                <GalleryGrid
                  photos={paginatedPhotos}
                  onPhotoClick={(photo) => {
                    const index = filteredPhotos.findIndex((item) => item.id === photo.id);

                    if (index >= 0) {
                      setLightboxIndex(index);
                    }
                  }}
                />

                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalItems={filteredPhotos.length}
                  pageSize={PHOTOS_PER_PAGE}
                  onPageChange={goToPage}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/65">
                No published photos available yet.
              </div>
            )}
          </section>
        </Container>
      </section>

      <Lightbox
        photos={filteredPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}

function GalleryFilter({
  categories,
  active,
  onChange,
}: {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-end sm:overflow-visible [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          data-interactive
          onClick={() => onChange(category)}
          className={cn(
            "min-h-10 shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:min-h-0 sm:py-1",
            active === category
              ? "border-[var(--blue-500)] bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
              : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-4 sm:flex-row">
      <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] sm:text-left">
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Previous
        </button>

        <span className="inline-flex min-h-10 items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-2 font-mono text-xs text-[var(--blue-300)]">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
