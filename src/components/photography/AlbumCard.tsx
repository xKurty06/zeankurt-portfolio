import Link from "next/link";
import type { PhotoAlbum } from "@/types";

interface AlbumCardProps {
  album: PhotoAlbum;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/photography/${album.slug}`}
      className="group relative block min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_16px_44px_rgba(0,0,0,0.18)] transition duration-300 hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/[0.03]">
        {album.coverImage ? (
          <img
            src={album.coverImage}
            alt={album.title}
            loading="lazy"
            className="h-full w-full rounded-2xl object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full rounded-2xl bg-[radial-gradient(circle_at_30%_25%,rgba(72,202,228,0.18),transparent_32%),linear-gradient(145deg,rgba(10,15,26,0.96),rgba(2,62,138,0.22))]" />
        )}

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#030712]/88 via-[#030712]/18 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <h3 className="mt-1 break-words font-[family-name:var(--font-syne)] text-base font-semibold leading-snug text-white sm:text-lg">
            {album.title}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/65 sm:text-sm">
            {album.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
