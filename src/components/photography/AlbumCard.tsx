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
      className="group mb-5 block break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
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
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
            {album.category} · {album.photoCount} photos
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
            {album.title}
          </h3>
          {!album.coverImage ? (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
              No showcase image uploaded
            </p>
          ) : null}
        </div>
      </div>
      <p className="p-5 text-sm leading-relaxed text-white/65">
        {album.description}
      </p>
    </Link>
  );
}
