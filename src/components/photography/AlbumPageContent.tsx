"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PhotoAlbum, PhotoItem } from "@/types";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { resolvePhotoAspectRatio } from "@/lib/photo-aspect";

const GRID_AUTO_ROW_HEIGHT = 8;
const FALLBACK_COLUMN_WIDTH = 280;
const DEFAULT_GRID_GAP = 16;
const PHOTOS_PER_PAGE = 24;

interface AlbumPageContentProps {
  album: Pick<
    PhotoAlbum,
    "slug" | "title" | "description" | "category" | "coverImage"
  >;
  photos?: PhotoItem[];
}

interface AlbumGridMetrics {
  columnWidth: number;
  columnGap: number;
  rowGap: number;
}

function getPhotoOrderNumber(photo: PhotoItem) {
  /*
    Prefer the number from the image filename.

    Example:
    creative-shots-0001.webp -> 1
    creative-shots-0012.jpg  -> 12

    This keeps the visual order aligned with your uploaded file numbering,
    even if the generated title says "Creative Shots 2".
  */
  const filename = (photo.image ?? "").split("?")[0].split("/").pop() ?? "";
  const filenameMatch = filename.match(/(?:^|[-_])0*(\d+)(?=\.[a-z0-9]+$|$)/i);

  if (filenameMatch) {
    return Number(filenameMatch[1]);
  }

  const titleMatch = photo.title.match(/0*(\d+)\s*$/);

  if (titleMatch) {
    return Number(titleMatch[1]);
  }

  return Number.MAX_SAFE_INTEGER;
}

function sortPhotosByNaturalOrder(photos: PhotoItem[]) {
  return [...photos].sort((a, b) => {
    const orderA = getPhotoOrderNumber(a);
    const orderB = getPhotoOrderNumber(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.title.localeCompare(b.title);
  });
}

function getFallbackRatio(aspectRatio: PhotoItem["aspectRatio"]) {
  if (aspectRatio === "portrait") return 3 / 4;
  if (aspectRatio === "square") return 1;

  return 4 / 3;
}

function readAlbumGridMetrics(element: HTMLElement): AlbumGridMetrics {
  const styles = window.getComputedStyle(element);

  const parsedColumns = styles.gridTemplateColumns
    .split(" ")
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  const columnGap = Number.parseFloat(styles.columnGap) || DEFAULT_GRID_GAP;
  const rowGap = Number.parseFloat(styles.rowGap) || DEFAULT_GRID_GAP;

  return {
    columnWidth: parsedColumns[0] ?? FALLBACK_COLUMN_WIDTH,
    columnGap,
    rowGap,
  };
}

function getGridItemWidth(metrics: AlbumGridMetrics, columnSpan: number) {
  return metrics.columnWidth * columnSpan + metrics.columnGap * (columnSpan - 1);
}

function getDynamicGridRowSpan({
  ratio,
  columnSpan,
  metrics,
  minimumRows,
}: {
  ratio: number;
  columnSpan: number;
  metrics: AlbumGridMetrics;
  minimumRows: number;
}) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 4 / 3;
  const itemWidth = getGridItemWidth(metrics, columnSpan);
  const targetHeight = itemWidth / safeRatio;

  return Math.max(
    minimumRows,
    Math.ceil(
      (targetHeight + metrics.rowGap) / (GRID_AUTO_ROW_HEIGHT + metrics.rowGap),
    ),
  );
}

export function AlbumPageContent({ album, photos }: AlbumPageContentProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gallerySectionRef = useRef<HTMLDivElement>(null);

  const albumPhotos = useMemo(
    () => sortPhotosByNaturalOrder(photos ?? []),
    [photos],
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [gridMetrics, setGridMetrics] = useState<AlbumGridMetrics>({
    columnWidth: FALLBACK_COLUMN_WIDTH,
    columnGap: DEFAULT_GRID_GAP,
    rowGap: DEFAULT_GRID_GAP,
  });

  const fallbackFeaturedPhoto =
    albumPhotos.find((photo) => photo.featured) ?? albumPhotos[0] ?? null;

  const featuredImage = album.coverImage ?? fallbackFeaturedPhoto?.image ?? null;

  const showCategoryLabel =
    album.category.trim().toLowerCase() !== album.title.trim().toLowerCase();

  const [featuredAspectRatio, setFeaturedAspectRatio] = useState<
    PhotoItem["aspectRatio"]
  >(fallbackFeaturedPhoto?.aspectRatio ?? "landscape");

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid) return;

    const updateGridMetrics = () => {
      const nextMetrics = readAlbumGridMetrics(grid);

      setGridMetrics((current) => {
        const sameColumnWidth =
          Math.abs(current.columnWidth - nextMetrics.columnWidth) < 0.5;
        const sameColumnGap =
          Math.abs(current.columnGap - nextMetrics.columnGap) < 0.5;
        const sameRowGap = Math.abs(current.rowGap - nextMetrics.rowGap) < 0.5;

        if (sameColumnWidth && sameColumnGap && sameRowGap) {
          return current;
        }

        return nextMetrics;
      });
    };

    updateGridMetrics();

    const observer = new ResizeObserver(updateGridMetrics);
    observer.observe(grid);

    window.addEventListener("resize", updateGridMetrics);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateGridMetrics);
    };
  }, []);

  const registerImageRatio = useCallback(
    (id: string, width: number, height: number) => {
      if (width <= 0 || height <= 0) return;

      const ratio = width / height;

      setImageRatios((current) => {
        if (Math.abs((current[id] ?? 0) - ratio) < 0.001) {
          return current;
        }

        return {
          ...current,
          [id]: ratio,
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!featuredImage) return;

    let mounted = true;
    const img = new Image();

    img.src = featuredImage;
    img.onload = () => {
      if (!mounted) return;

      setFeaturedAspectRatio(
        resolvePhotoAspectRatio(img.naturalWidth, img.naturalHeight),
      );
    };

    return () => {
      mounted = false;
    };
  }, [featuredImage]);

  const displayedFeaturedPhoto = useMemo(() => {
    if (!featuredImage) return fallbackFeaturedPhoto;

    const matchingAlbumPhoto = albumPhotos.find(
      (photo) => photo.image === featuredImage,
    );

    if (matchingAlbumPhoto) {
      return matchingAlbumPhoto;
    }

    return {
      id: `cover-${album.slug}`,
      title: `${album.title} Showcase`,
      category: album.category,
      image: featuredImage,
      aspectRatio: featuredAspectRatio,
      featured: true,
    } as PhotoItem;
  }, [
    album.slug,
    album.title,
    album.category,
    albumPhotos,
    featuredImage,
    featuredAspectRatio,
    fallbackFeaturedPhoto,
  ]);

  const isFeaturedImageFromAlbum = useMemo(() => {
    if (!displayedFeaturedPhoto) return false;

    return albumPhotos.some(
      (photo) =>
        photo.id === displayedFeaturedPhoto.id ||
        photo.image === displayedFeaturedPhoto.image,
    );
  }, [albumPhotos, displayedFeaturedPhoto]);

  const galleryPhotos = useMemo(() => {
    /*
      Important:
      Always show all database photos in the gallery.

      This prevents creative-shots-0001.jpg from being removed just because
      another separate showcase/cover image is displayed as the featured image.
    */
    return albumPhotos;
  }, [albumPhotos]);

  const totalPages = Math.max(1, Math.ceil(galleryPhotos.length / PHOTOS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedGalleryPhotos = useMemo(() => {
    const start = (safeCurrentPage - 1) * PHOTOS_PER_PAGE;
    const end = start + PHOTOS_PER_PAGE;

    return galleryPhotos.slice(start, end);
  }, [galleryPhotos, safeCurrentPage]);

  const lightboxPhotos = useMemo(() => {
    if (!displayedFeaturedPhoto) return albumPhotos;

    /*
      If the featured image is already one of the album photos,
      do not duplicate it in the lightbox.
    */
    if (isFeaturedImageFromAlbum) {
      return albumPhotos;
    }

    /*
      If the featured image is a separate showcase/cover image,
      add it as a virtual first lightbox item.
    */
    return [displayedFeaturedPhoto, ...albumPhotos];
  }, [albumPhotos, displayedFeaturedPhoto, isFeaturedImageFromAlbum]);

  useEffect(() => {
    setCurrentPage(1);
    setLightboxIndex(null);
  }, [album.slug]);

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

  const openPhotoInLightbox = (photo: PhotoItem | null) => {
    if (!photo) return;

    const index = lightboxPhotos.findIndex(
      (item) => item.id === photo.id || item.image === photo.image,
    );

    if (index >= 0) {
      setLightboxIndex(index);
    }
  };

  const getGalleryRowSpan = (photo: PhotoItem) => {
    const ratio = imageRatios[photo.id] ?? getFallbackRatio(photo.aspectRatio);

    if (photo.aspectRatio === "portrait") {
      /*
        Manual baseline: 18
        Portrait should never become shorter than your manual size.
        Extra-tall portrait images can become slightly taller.
      */
      return Math.max(18, Math.min(26, Math.round(18 * (0.75 / ratio))));
    }

    if (photo.aspectRatio === "square") {
      /*
        Manual baseline: 12
        Keep square stable.
      */
      return 12;
    }

    /*
      Manual baseline: 8
      Landscape should not become taller than your manual size.
      Wider landscape images can become slightly shorter.
    */
    return Math.min(8, Math.max(6, Math.round(8 * (4 / 3 / ratio))));
  };

  const getFeaturedRowSpan = () => {
    const featuredId = displayedFeaturedPhoto?.id ?? "featured";
    const ratio =
      imageRatios[featuredId] ?? getFallbackRatio(featuredAspectRatio);
    
      if (displayedFeaturedPhoto?.aspectRatio === "portrait") {
        return Math.max(36, Math.round(24 * (0.75 / ratio)));
      }
      if (displayedFeaturedPhoto?.aspectRatio === "square") {
        return 18;
      }
      return Math.min(16, Math.max(20, Math.round(24 * (4 / 3 / ratio))));
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
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to photography
          </Link>

          <div ref={gallerySectionRef}>
            <div
              ref={gridRef}
            className="mt-0 grid min-w-0 grid-cols-2 auto-rows-[8px] gap-4 [grid-auto-flow:dense] lg:grid-cols-4"
            >
            <div
              className="col-span-2 min-w-0 self-start lg:col-start-1 lg:row-start-1"
              style={{ gridRowEnd: "span 8" }}
            >
              {showCategoryLabel ? (
                <div className="inline-flex items-center gap-3 text-[var(--blue-200)]">
                  <span className="h-px w-10 bg-gradient-to-r from-[rgba(72,202,228,0.8)] to-transparent" />
                  <p className="font-[family-name:var(--font-syne)] text-[0.78rem] font-medium tracking-[0.18em] sm:text-[0.82rem]">
                    {album.category}
                  </p>
                </div>
              ) : null}

              <h1 className="mt-4 break-words font-[family-name:var(--font-syne)] text-[clamp(1.875rem,8vw,2.5rem)] font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                {album.title}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
                {album.description}
              </p>
              {totalPages > 1 ? (
                <div className="relative z-20 mt-6 flex w-full max-w-2xl flex-col gap-3 sm:gap-4">
                  <div className="flex justify-center lg:hidden">
                    <div className="inline-flex min-h-10 items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-2 font-mono text-xs text-[var(--blue-300)]">
                      {safeCurrentPage} / {totalPages}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                    <button
                      type="button"
                      onClick={() => goToPage(safeCurrentPage - 1)}
                      disabled={safeCurrentPage <= 1}
                      className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-white/70 transition enabled:hover:border-white/20 enabled:hover:bg-white/[0.05] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-10 lg:w-auto lg:justify-self-start"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>

                    <div className="hidden lg:inline-flex lg:min-h-10 lg:justify-self-center lg:items-center lg:rounded-full lg:border lg:border-[rgba(72,202,228,0.18)] lg:bg-[rgba(72,202,228,0.08)] lg:px-3 lg:py-2 lg:font-mono lg:text-xs lg:text-[var(--blue-300)]">
                      {safeCurrentPage} / {totalPages}
                    </div>

                    <button
                      type="button"
                      onClick={() => goToPage(safeCurrentPage + 1)}
                      disabled={safeCurrentPage >= totalPages}
                      className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-white/70 transition enabled:hover:border-white/20 enabled:hover:bg-white/[0.05] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-10 lg:w-auto lg:justify-self-end"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {featuredImage || displayedFeaturedPhoto ? (
              <button
                type="button"
                onClick={() => openPhotoInLightbox(displayedFeaturedPhoto)}
                className="group relative col-span-2 min-h-11 cursor-zoom-in overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] text-left transition hover:border-white/30 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:col-start-3 lg:row-start-1"
                style={{
                  gridRowEnd: `span ${getFeaturedRowSpan()}`,
                }}
              >
                {featuredImage ? (
                  <img
                    src={featuredImage}
                    alt={displayedFeaturedPhoto?.title ?? `${album.title} Showcase`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    loading="eager"
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget;
                      const featuredId = displayedFeaturedPhoto?.id ?? "featured";

                      registerImageRatio(featuredId, naturalWidth, naturalHeight);

                      setFeaturedAspectRatio(
                        resolvePhotoAspectRatio(naturalWidth, naturalHeight),
                      );
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                      No showcase image uploaded
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />

                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">
                    {album.category}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {isFeaturedImageFromAlbum
                      ? displayedFeaturedPhoto?.title
                      : `${album.title} Showcase`}
                  </p>
                </div>
              </button>
            ) : null}

              {paginatedGalleryPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => openPhotoInLightbox(photo)}
                className="group relative min-h-11 cursor-zoom-in overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{
                  gridRowEnd: `span ${getGalleryRowSpan(photo)}`,
                }}
              >
                {photo.image ? (
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget;

                      registerImageRatio(photo.id, naturalWidth, naturalHeight);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                      No image uploaded
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />

                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">
                    {photo.category}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {photo.title}
                  </p>
                </div>
              </button>
              ))}
            </div>
          </div>

          <PaginationControls
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={galleryPhotos.length}
            pageSize={PHOTOS_PER_PAGE}
            onPageChange={goToPage}
          />
        </Container>
      </section>

      <Lightbox
        photos={lightboxPhotos}
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
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] sm:text-left">
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-2 font-mono text-xs text-[var(--blue-300)] sm:hidden">
          Page {currentPage} / {totalPages}
        </span>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10 sm:w-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Previous
        </button>

        <span className="hidden min-h-10 items-center rounded-full border border-[rgba(72,202,228,0.18)] bg-[rgba(72,202,228,0.08)] px-3 py-2 font-mono text-xs text-[var(--blue-300)] sm:inline-flex">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10 sm:w-auto"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        </div>
      </div>
    </div>
  );
}
