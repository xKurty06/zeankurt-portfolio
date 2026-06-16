"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, X } from "lucide-react";
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

        <Container className="pointer-events-none relative z-10 text-center md:text-left">
          <p
            data-photo-hero="line"
            className="mx-auto inline-flex rounded-full py-1 font-[family-name:var(--font-syne)] text-[0.76rem] font-medium tracking-[0.14em] text-[var(--blue-200)] shadow-[0_0_18px_rgba(0,180,216,0.08)] md:mx-0"
          >
            {siteConfig.photographyBrand}
          </p>

          <h1
            data-photo-hero="line"
            className="mx-auto mt-3 max-w-[22rem] break-words font-[family-name:var(--font-syne)] text-[clamp(2.1rem,10vw,3rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:max-w-3xl sm:text-5xl md:mx-0 md:max-w-5xl md:text-6xl lg:text-[4.35rem] lg:max-w-none"
          >
            Photography &{" "}
            <span className="text-[var(--blue-200)] drop-shadow-[0_0_18px_rgba(72,202,228,0.22)]">
              visual stories
            </span>{" "}
            from events, portraits, and the streets.
          </h1>

          <p
            data-photo-hero="line"
            className="mx-auto mt-4 max-w-[34rem] text-base leading-7 text-white/70 sm:text-lg sm:leading-8 md:mx-0 md:max-w-2xl"
          >
            Work published under{" "}
            <span className="font-medium text-[var(--blue-200)]">shot.by.zk</span> and
            produced with{" "}
            <span className="font-medium text-white">Studio Nomads</span> — covering
            community events, campus activations, and editorial shoots.
          </p>

          <div data-photo-hero="line" className="pointer-events-auto mt-7 flex justify-center md:justify-start">
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
            <div className="mb-7 flex flex-col items-center gap-2 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-syne)] text-[0.74rem] font-medium tracking-[0.13em] text-[var(--blue-200)] sm:text-[0.8rem]">
                  Albums
                </p>

                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                  Collections
                </h2>
              </div>
            </div>

            {photoAlbums.length > 0 ? (
              <div className="grid max-w-full grid-cols-2 gap-1 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
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

          <section ref={gallerySectionRef} className="mt-16 scroll-mt-28 md:mt-20">
            <div className="mb-7 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-syne)] text-[0.74rem] font-medium tracking-[0.13em] text-[var(--blue-200)] sm:text-[0.8rem]">
                  Gallery
                </p>

                <div className="mt-2 flex flex-row items-center justify-center gap-2 sm:items-center sm:justify-start">
                  <h2 className="font-[family-name:var(--font-syne)] text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                    All frames
                  </h2>

                  <span className="inline-flex items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--blue-300)] shadow-[0_0_18px_rgba(0,180,216,0.08)]">
                    {filteredPhotos.length} frames
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:hidden">
                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <InlinePaginationControls
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    className="min-w-0 flex-1"
                  />

                  {photos.length > 0 ? (
                    <GalleryFilter
                      categories={photoCategories}
                      active={activeCategory}
                      onChange={setActiveCategory}
                      className={totalPages > 1 ? "w-auto min-w-[9.25rem] shrink-0" : "w-full"}
                    />
                  ) : null}
                </div>
              </div>

              {photos.length > 0 ? (
                <GalleryFilter
                  categories={photoCategories}
                  active={activeCategory}
                  onChange={setActiveCategory}
                  className="hidden sm:flex"
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
  className,
}: {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasActiveFilter = active !== "All";
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [active]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!mobileFilterRef.current) return;

      const target = event.target;

      if (target instanceof Node && !mobileFilterRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [mobileOpen]);

  return (
    <div className={cn("w-full sm:w-auto", className)}>
      <div ref={mobileFilterRef} className="relative sm:hidden">
        <div className="flex min-h-11 items-center rounded-full border border-[var(--border)] bg-white/[0.02] pr-1">
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 px-4 text-left text-xs font-medium text-white/80"
            aria-expanded={mobileOpen}
            aria-label="Open gallery filters"
          >
            <span className="truncate">All filters</span>
            {!hasActiveFilter ? (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-white/60 transition duration-200 ease-out",
                  mobileOpen && "rotate-180 text-white/85",
                )}
              />
            ) : null}
          </button>

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={() => onChange("All")}
              className="mr-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center text-white/70 transition hover:border-white/20 hover:text-white"
              aria-label="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            "absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-[var(--border)] bg-[rgba(4,8,18,0.96)] p-2 shadow-[0_18px_48px_rgba(2,8,23,0.42)] backdrop-blur transition duration-200 ease-out",
            mobileOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
          aria-hidden={!mobileOpen}
        >
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={cn(
                "flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 text-left text-sm transition",
                active === category
                  ? "bg-[var(--accent-soft)] text-white"
                  : "text-[var(--foreground-muted)] hover:bg-white/[0.04] hover:text-white",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex sm:flex-wrap sm:justify-end sm:overflow-visible [&::-webkit-scrollbar]:hidden">
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
    </div>
  );
}

function InlinePaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-2 text-[11px] font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="truncate">Prev</span>
      </button>

      <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-2.5 py-2 font-mono text-[11px] text-[var(--blue-300)]">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-2 text-[11px] font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="truncate">Next</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
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
    <div className="mt-10 flex flex-col gap-4 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-white/[0.02] sm:px-4 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center font-mono text-xs tracking-[0.14em] text-[var(--foreground-subtle)] sm:text-left">
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:flex sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex min-h-11 w-auto cursor-pointer items-center justify-start gap-2 justify-self-start rounded-full border border-[var(--border)] bg-white/[0.02] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10 sm:justify-center"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <span className="inline-flex min-h-10 min-w-[3.75rem] items-center justify-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-2.5 py-2 font-mono text-xs text-[var(--blue-300)] sm:hidden">
            {currentPage} / {totalPages}
          </span>

          <span className="hidden min-h-10 items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-2 font-mono text-xs text-[var(--blue-300)] sm:inline-flex">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="inline-flex min-h-11 w-auto cursor-pointer items-center justify-end gap-2 justify-self-end rounded-full border border-[var(--border)] bg-white/[0.02] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10 sm:justify-center"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
