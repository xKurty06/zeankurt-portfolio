"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PhotoAlbum, PhotoItem } from "@/types";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { resolvePhotoAspectRatio } from "@/lib/photo-aspect";

interface AlbumPageContentProps {
  album: Pick<
    PhotoAlbum,
    "slug" | "title" | "description" | "category" | "coverImage"
  >;
  photos?: PhotoItem[];
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

export function AlbumPageContent({ album, photos }: AlbumPageContentProps) {
  const albumPhotos = useMemo(
    () => sortPhotosByNaturalOrder(photos ?? []),
    [photos],
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fallbackFeaturedPhoto =
    albumPhotos.find((photo) => photo.featured) ?? albumPhotos[0] ?? null;

  const featuredImage = album.coverImage ?? fallbackFeaturedPhoto?.image ?? null;

  const showCategoryLabel =
    album.category.trim().toLowerCase() !== album.title.trim().toLowerCase();

  const [featuredAspectRatio, setFeaturedAspectRatio] = useState<
    PhotoItem["aspectRatio"]
  >(fallbackFeaturedPhoto?.aspectRatio ?? "landscape");

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

  const openPhotoInLightbox = (photo: PhotoItem | null) => {
    if (!photo) return;

    const index = lightboxPhotos.findIndex(
      (item) => item.id === photo.id || item.image === photo.image,
    );

    if (index >= 0) {
      setLightboxIndex(index);
    }
  };

  const getGalleryRowSpan = (aspectRatio: PhotoItem["aspectRatio"]) => {
    if (aspectRatio === "portrait") return 18;
    if (aspectRatio === "square") return 12;

    return 8;
  };

  const getFeaturedRowSpan = (aspectRatio: PhotoItem["aspectRatio"]) => {
    if (aspectRatio === "portrait") {
      return 44;
    }

    if (aspectRatio === "square") {
      return 26;
    }

    /*
      Landscape featured image should have similar height
      to a normal portrait gallery card.
    */
    return 17;
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

          <div className="mt-0 grid min-w-0 grid-cols-2 auto-rows-[8px] gap-4 [grid-auto-flow:dense] lg:grid-cols-4">
            <div
              className="col-span-2 min-w-0 self-start lg:col-start-1 lg:row-start-1"
              style={{ gridRowEnd: "span 6" }}
            >
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

            {featuredImage || displayedFeaturedPhoto ? (
              <button
                type="button"
                onClick={() => openPhotoInLightbox(displayedFeaturedPhoto)}
                className="group relative col-span-2 min-h-11 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] text-left transition hover:border-white/30 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:col-start-3 lg:row-start-1"
                style={{
                  gridRowEnd: `span ${getFeaturedRowSpan(featuredAspectRatio)}`,
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

            {galleryPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => openPhotoInLightbox(photo)}
                className="group relative min-h-11 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{
                  gridRowEnd: `span ${getGalleryRowSpan(photo.aspectRatio)}`,
                }}
              >
                {photo.image ? (
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
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
