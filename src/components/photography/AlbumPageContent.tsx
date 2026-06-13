"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PhotoAlbum, PhotoItem } from "@/types";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { resolvePhotoAspectRatio } from "@/lib/photo-aspect";

interface AlbumPageContentProps {
  album: Pick<PhotoAlbum, "slug" | "title" | "description" | "category" | "coverImage">;
  photos?: PhotoItem[];
}

export function AlbumPageContent({ album, photos }: AlbumPageContentProps) {
  const albumPhotos = useMemo(() => photos ?? [], [photos]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const heroPhotos = albumPhotos.slice(0, 4);
  const featuredPhoto = heroPhotos[0] ?? null;
  const supportingPhotos = heroPhotos.slice(1);
  const showCategoryLabel =
    album.category.trim().toLowerCase() !== album.title.trim().toLowerCase();
  const featuredImage = album.coverImage ?? featuredPhoto?.image ?? null;
  const [featuredAspectRatio, setFeaturedAspectRatio] = useState<PhotoItem["aspectRatio"]>(
    featuredPhoto?.aspectRatio ?? "landscape",
  );

  const getAspectClass = (aspectRatio: PhotoItem["aspectRatio"]) => {
    if (aspectRatio === "portrait") return "aspect-[4/5]";
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
          <div className="absolute left-[6%] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.2),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-10 right-[8%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.26),transparent_72%)] blur-3xl" />
        </div>

        <Container className="relative z-10 pb-16 pt-28 md:pt-32">
          <Link
            href="/photography"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to photography
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,32rem)] lg:items-start">
            <div className="lg:pt-2">
              {showCategoryLabel ? (
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  {album.category}
                </p>
              ) : null}
              <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-semibold text-white sm:text-5xl">
                {album.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
                {album.description}
              </p>

              {supportingPhotos.length > 0 ? (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {supportingPhotos.map((photo, photoIndex) => {
                    const index = albumPhotos.findIndex((item) => item.id === photo.id);
                    const isLastOddWide =
                      supportingPhotos.length > 1 &&
                      supportingPhotos.length % 2 === 1 &&
                      photoIndex === supportingPhotos.length - 1;

                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className={cn(
                          "group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left",
                          isLastOddWide && "sm:col-span-2",
                        )}
                      >
                        <div
                          className={cn(
                            "relative overflow-hidden",
                            isLastOddWide ? "aspect-[16/9]" : getAspectClass(photo.aspectRatio),
                          )}
                        >
                          {photo.image ? (
                            <img
                              src={photo.image}
                              alt={photo.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                              {photo.category}
                            </p>
                            <p className="mt-1 text-sm font-medium text-white">{photo.title}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(featuredPhoto ? albumPhotos.findIndex((item) => item.id === featuredPhoto.id) : 0)}
              className={`overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] text-left lg:justify-self-end ${getAspectClass(featuredAspectRatio)}`}
            >
              {featuredImage ? (
                <img
                  src={featuredImage}
                  alt={album.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget;
                    setFeaturedAspectRatio(resolvePhotoAspectRatio(naturalWidth, naturalHeight));
                  }}
                />
              ) : (
                <div className="flex h-full min-h-[18rem] items-end p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                    No showcase image uploaded
                  </p>
                </div>
              )}
            </button>
          </div>

          <div className="mt-12">
            <GalleryGrid
              photos={albumPhotos}
              onPhotoClick={(_photo, index) => {
                setLightboxIndex(index);
              }}
            />
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
