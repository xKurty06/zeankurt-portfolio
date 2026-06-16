"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const [present, setPresent] = useState(activeIndex !== null);
  const photo = activeIndex !== null ? photos[activeIndex] : null;

  useEffect(() => {
    if (activeIndex !== null) {
      setPresent(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setPresent(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [activeIndex]);

  useEffect(() => {
    if (!present || activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && activeIndex < photos.length - 1) {
        onNavigate(activeIndex + 1);
      }
      if (event.key === "ArrowLeft" && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, onClose, onNavigate, photos.length, present]);

  if (!photo || activeIndex === null || !present) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={photo.id}
        data-preview-overlay="true"
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={photo.title}
      >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white transition hover:bg-white/10 sm:right-4 sm:top-4"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {activeIndex > 0 ? (
        <button
          type="button"
          onClick={() => onNavigate(activeIndex - 1)}
          className="absolute bottom-4 left-4 z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white transition hover:bg-white/10 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      {activeIndex < photos.length - 1 ? (
        <button
          type="button"
          onClick={() => onNavigate(activeIndex + 1)}
          className="absolute bottom-4 right-4 z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white transition hover:bg-white/10 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 md:right-16"
          aria-label="Next photo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <motion.div
        initial={{ opacity: 0, scale: 0.975, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.975, y: 20 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[85dvh] w-full max-w-5xl px-0 sm:px-14 md:px-16"
      >
        <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl">
          {photo.image ? (
            <img
              key={photo.id}
              src={photo.image}
              alt={photo.title}
              className="block max-h-[68dvh] w-auto max-w-full rounded-2xl object-contain sm:max-h-[72vh]"
              loading="eager"
            />
          ) : (
            <div className="flex min-h-[24rem] w-full items-center justify-center bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]">
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
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}
