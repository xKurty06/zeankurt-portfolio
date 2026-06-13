"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PhotoItem } from "@/types";

interface LightboxProps {
  photos: PhotoItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({
  photos,
  activeIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const photo = activeIndex !== null ? photos[activeIndex] : null;

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && activeIndex < photos.length - 1) {
        onNavigate(activeIndex + 1);
      }
      if (event.key === "ArrowLeft" && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, onClose, onNavigate, photos.length]);

  if (!photo || activeIndex === null) return null;

  return (
    <div
      data-preview-overlay="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {activeIndex > 0 ? (
        <button
          type="button"
          onClick={() => onNavigate(activeIndex - 1)}
          className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      {activeIndex < photos.length - 1 ? (
        <button
          type="button"
          onClick={() => onNavigate(activeIndex + 1)}
          className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 md:right-16"
          aria-label="Next photo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <div className="max-h-[85vh] w-full max-w-5xl">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
          {photo.image ? (
            <Image
              src={photo.image}
              alt={photo.title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]">
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                No image uploaded
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
            {photo.category}
          </p>
          <p className="mt-2 text-lg font-medium text-white">{photo.title}</p>
          <p className="mt-1 text-sm text-white/50">
            {activeIndex + 1} / {photos.length}
          </p>
        </div>
      </div>
    </div>
  );
}
