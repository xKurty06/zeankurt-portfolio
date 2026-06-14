"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PhotoAlbum, PhotoItem } from "@/types";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { resolvePhotoAspectRatio } from "@/lib/photo-aspect";

const ALBUM_PHOTOS_PER_PAGE = 24;

interface AlbumPageContentProps {
  album: Pick<PhotoAlbum, "slug" | "title" | "description" | "category" | "coverImage">;
  photos?: PhotoItem[];
}

export function AlbumPageContent({ album, photos }: AlbumPageContentProps) {
  const gallerySectionRef = useRef<HTMLDivElement>(null);

  const albumPhotos = useMemo(() => photos ?? [], [photos]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const featuredPhoto = albumPhotos.find((photo) => photo.featured) ?? albumPhotos[0] ?? null;
  const supportingPhotos = albumPhotos
    .filter((photo) => photo.id !== featuredPhoto?.id)
    .slice(0, 4);

  const showCategoryLabel =
    album.category.trim().toLowerCase() !== album.title.trim().toLowerCase();

  const featuredImage = album.coverImage ?? featuredPhoto?.image ?? null;

  const [featuredAspectRatio, setFeaturedAspectRatio] = useState<PhotoItem["aspectRatio"]>(
    featuredPhoto?.aspectRatio ?? "landscape",
  );

  const totalPages = Math.max(1, Math.ceil(albumPhotos.length / ALBUM_PHOTOS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPhotos = useMemo(() => {
    const start = (safeCurrentPage - 1) * ALBUM_PHOTOS_PER_PAGE;
    const end = start + ALBUM_PHOTOS_PER_PAGE;

    return albumPhotos.slice(start, end);
  }, [albumPhotos, safeCurrentPage]);

  useEffect(() => {
    if (!featuredImage) return;

    let mounted = true;
    const img = new Image();

    img.src = featuredImage;

    img.onload = () => {
      if (!mounted) return;

      const aspect = resolvePhotoAspectRatio(img.naturalWidth, img.naturalHeight);
      setFeaturedAspectRatio(aspect);
    };

    return () => {
      mounted = false;
    };
  }, [featuredImage]);

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

  const openPhotoInLightbox = (photo: PhotoItem) => {
    const index = albumPhotos.findIndex((item) => item.id === photo.id);

    if (index >= 0) {
      setLightboxIndex(index);
    }
  };

  const openFeaturedInLightbox = () => {
    if (!featuredPhoto) return;

    openPhotoInLightbox(featuredPhoto);
  };

  const getAspectClass = (aspectRatio: PhotoItem["aspectRatio"]) => {
    if (aspectRatio === "portrait") return "aspect-[3/4]";
    if (aspectRatio === "square") return "aspect-square";

    return "aspect-[4/3]";
  };

  return (
    <>
      <section className="relative isolate min-h-dvh overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.72),rgba(3,7,18,0.42)_30%,rgba(3,7,18,0.58)_68%,rgba(3,7,18,0.82))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(72,202,228,0.22),transparent_28%),radial-gradient(circle_at_82%_30%,rgba(0,180,216,0.16),transparent_30%),radial-gradient(circle_at_46%_72%,rgba(2,62,138,0.24),transparent_40%)]" />
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(72,202,228,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(72,202,228,0.07)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:linear-gradient(180deg,transparent,white_10%,white_90%,transparent)]" />
          <div className="absolute left-[6%] top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.2),transparent_70%)] blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute bottom-10 right-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.26),transparent_72%)] blur-3xl sm:h-96 sm:w-96" />
        </div>

        <Container className="relative z-10 pb-16 pt-20 md:pt-20">
          <Link
            href="/photography"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to photography
          </Link>

          <div className="mt-0 grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-[auto_1fr_1fr]">
            <div className="col-span-2 lg:col-span-2">
              {showCategoryLabel ? (
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  {album.category}
                </p>
              ) : null}

              <h1 className="mt-3 break-words font-[family-name:var(--font-syne)] text-[clamp(1.875rem,8vw,2.5rem)] font-semibold text-white sm:text-5xl">
                {album.title}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
                {album.description}
              </p>
            </div>

            <button
              type="button"
              onClick={openFeaturedInLightbox}
              className={cn(
                "relative col-span-2 row-span-2 min-h-11 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] text-left transition hover:border-white/30 hover:shadow-lg lg:col-span-2 lg:row-span-3 lg:aspect-auto lg:h-full",
                getAspectClass(featuredAspectRatio),
              )}
            >
              {featuredImage ? (
                <img
                  src={featuredImage}
                  alt={album.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget;
                    setFeaturedAspectRatio(resolvePhotoAspectRatio(naturalWidth, naturalHeight));
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-end p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                    No showcase image uploaded
                  </p>
                </div>
              )}
            </button>

            {supportingPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => openPhotoInLightbox(photo)}
                className={cn(
                  "group relative min-h-11 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                  getAspectClass(photo.aspectRatio),
                )}
              >
                {photo.image ? (
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]" />
                )}

                <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />

                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">
                    {photo.category}
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">{photo.title}</p>
                </div>
              </button>
            ))}
          </div>

          <div ref={gallerySectionRef} className="mt-10 scroll-mt-28">
            <div className="mb-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  Album gallery
                </p>

                <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-start">
                  <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold text-white">
                    Frames
                  </h2>

                  <span className="inline-flex items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--blue-300)] shadow-[0_0_18px_rgba(0,180,216,0.08)]">
                    {albumPhotos.length} frames
                  </span>
                </div>
              </div>
            </div>

            {albumPhotos.length > 0 ? (
              <>
                <GalleryGrid
                  photos={paginatedPhotos}
                  onPhotoClick={(photo) => openPhotoInLightbox(photo)}
                />

                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalItems={albumPhotos.length}
                  pageSize={ALBUM_PHOTOS_PER_PAGE}
                  onPageChange={goToPage}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/65">
                No published photos available yet.
              </div>
            )}
          </div>
        </Container>
      </section>

      <Lightbox
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
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
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white disabled:pointer-events-none disabled:opacity-40"
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
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}