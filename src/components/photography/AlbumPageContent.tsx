"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PhotoAlbum } from "@/types";
import { getPhotosByAlbum, getPhotoImageUrl } from "@/data/photography";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";

interface AlbumPageContentProps {
  album: PhotoAlbum;
}

export function AlbumPageContent({ album }: AlbumPageContentProps) {
  const albumPhotos = useMemo(() => getPhotosByAlbum(album.slug), [album.slug]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <Container className="pb-16 pt-28 md:pt-32">
        <Link
          href="/photography"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to photography
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
              {album.category}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-semibold text-white sm:text-5xl">
              {album.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
              {album.description}
            </p>
          </div>

          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={getPhotoImageUrl(album.coverSeed, 1200, 750)}
              alt={album.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          </div>
        </div>

        <div className="mt-12">
          <GalleryGrid
            photos={albumPhotos}
            onPhotoClick={(photo) => {
              const index = albumPhotos.findIndex((item) => item.id === photo.id);
              setLightboxIndex(index);
            }}
          />
        </div>
      </Container>

      <Lightbox
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
