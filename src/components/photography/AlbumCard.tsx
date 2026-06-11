import Image from "next/image";
import Link from "next/link";
import type { PhotoAlbum } from "@/types";
import { getPhotoImageUrl } from "@/data/photography";

interface AlbumCardProps {
  album: PhotoAlbum;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/photography/${album.slug}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={getPhotoImageUrl(album.coverSeed, 1200, 750)}
          alt={album.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
            {album.category} · {album.photoCount} photos
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
            {album.title}
          </h3>
        </div>
      </div>
      <p className="p-5 text-sm leading-relaxed text-white/65">
        {album.description}
      </p>
    </Link>
  );
}
