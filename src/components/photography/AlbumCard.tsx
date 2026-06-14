"use client";

import { useState } from "react";
import Link from "next/link";
import type { PhotoAlbum } from "@/types";
import { cn } from "@/lib/cn";
import { resolvePhotoAspectRatio } from "@/lib/photo-aspect";

interface AlbumCardProps {
  album: PhotoAlbum;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const [coverAspectRatio, setCoverAspectRatio] = useState(album.coverAspectRatio);

  return (
    <Link
      href={`/photography/${album.slug}`}
      className="group block w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] sm:rounded-2xl"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]",
          coverAspectRatio === "portrait" && "aspect-[4/5]",
          coverAspectRatio === "landscape" && "aspect-[4/3]",
          coverAspectRatio === "square" && "aspect-square",
        )}
      >
        {album.coverImage ? (
          <img
            src={album.coverImage}
            alt={album.title}
            className="block h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setCoverAspectRatio(resolvePhotoAspectRatio(naturalWidth, naturalHeight));
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/70 sm:text-[10px] sm:tracking-[0.2em]">
            {album.category} · {album.photoCount} photos
          </p>
          <h3 className="mt-1 line-clamp-2 break-words font-[family-name:var(--font-syne)] text-sm font-semibold leading-tight text-white sm:mt-2 sm:text-xl">
            {album.title}
          </h3>
          {!album.coverImage ? (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
              No showcase image uploaded
            </p>
          ) : null}
        </div>
      </div>
      <p className="line-clamp-2 break-words p-3 text-xs leading-relaxed text-white/65 sm:p-5 sm:text-sm">
        {album.description}
      </p>
    </Link>
  );
}
