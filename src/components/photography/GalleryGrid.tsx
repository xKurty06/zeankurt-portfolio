"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/cn";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { getPhotoImageUrl } from "@/data/photography";
import type { PhotoItem } from "@/types";

interface GalleryGridProps {
  photos: PhotoItem[];
  onPhotoClick: (photo: PhotoItem, index: number) => void;
}

export function GalleryGrid({ photos, onPhotoClick }: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();
      const frames = gsap.utils.toArray<HTMLElement>("[data-gallery-frame]");

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
    <div ref={gridRef} className="columns-1 gap-4 sm:columns-2 xl:columns-3">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          data-gallery-frame
          onClick={() => onPhotoClick(photo, index)}
          className="group mb-4 block w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <div
            className={cn(
              "relative w-full overflow-hidden",
              photo.aspectRatio === "portrait" && "aspect-[4/5]",
              photo.aspectRatio === "landscape" && "aspect-[16/10]",
              photo.aspectRatio === "square" && "aspect-square",
            )}
          >
            <Image
              src={getPhotoImageUrl(
                photo.imageSeed,
                photo.aspectRatio === "portrait" ? 800 : 1200,
                photo.aspectRatio === "portrait" ? 1000 : 800,
              )}
              alt={photo.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />
            <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">
                {photo.category}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{photo.title}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
