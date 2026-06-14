"use client";

import { useRef, useState, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/cn";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import type { PhotoItem } from "@/types";

interface GalleryGridProps {
  photos: PhotoItem[];
  onPhotoClick: (photo: PhotoItem, index: number) => void;
  className?: string;
}

export function GalleryGrid({ photos, onPhotoClick, className }: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  const markLoaded = useCallback((id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Ref callback: if the browser already has the image cached, `img.complete`
  // is true synchronously and `onLoad` will never fire — so we check here too.
  const imgRef = useCallback(
    (id: string) => (el: HTMLImageElement | null) => {
      if (el?.complete) markLoaded(id);
    },
    [markLoaded],
  );

  useGSAP(
    () => {
      registerGsapPlugins();
      const frames = gsap.utils.toArray<HTMLElement>("[data-gallery-frame]", gridRef.current);
      if (frames.length === 0) return;

      gsap.fromTo(
        frames,
        { autoAlpha: 0, y: 14, scale: 0.985, filter: "blur(6px)" },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.42,
          stagger: 0.035,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [photos], revertOnUpdate: true, scope: gridRef },
  );

  return (
    <div
      ref={gridRef}
      className={cn(
        "max-w-full columns-2 gap-2 sm:gap-4 xl:columns-3 2xl:columns-4 [column-fill:balance]",
        className,
      )}
    >
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          data-gallery-frame
          onClick={() => onPhotoClick(photo, index)}
          className="group mb-2 block min-h-11 w-full break-inside-avoid overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mb-4"
        >
          {/*
           * KEY FIX: No more fixed aspect-ratio wrapper.
           * `position: relative` + `w-full` on a non-aspect-locked container
           * lets the image render at its natural height, so the CSS columns
           * layout can reflow correctly regardless of orientation or load order.
           */}
          <div className="relative w-full overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]">
            {photo.image ? (
              // Use a plain <img> instead of Next/Image with fill so the image
              // participates in normal block flow and sets its own height.
              // `w-full h-auto` is all that's needed for a masonry column cell.
              <img
                ref={imgRef(photo.id)}
                src={photo.image}
                alt={photo.title}
                loading="lazy"
                onLoad={() => markLoaded(photo.id)}
                onError={() => markLoaded(photo.id)}
                className={cn(
                  "block h-auto w-full transition duration-700 group-hover:scale-[1.03]",
                  !loadedIds.has(photo.id) && "opacity-0",
                )}
              />
            ) : (
              // Placeholder for photos with no image yet — give it a reasonable
              // minimum height so the card isn't invisible in the grid.
              <div className="min-h-48 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]" />
            )}

            <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />

            <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">{photo.category}</p>
              <p className="mt-1 text-sm font-medium text-white">{photo.title}</p>
              {!photo.image ? (
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                  No image uploaded
                </p>
              ) : null}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}