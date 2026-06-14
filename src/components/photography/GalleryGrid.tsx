"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/cn";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import type { PhotoItem } from "@/types";

interface GalleryGridProps {
  photos: PhotoItem[];
  onPhotoClick: (photo: PhotoItem, index: number) => void;
  className?: string;
}

const GRID_AUTO_ROW_HEIGHT = 4;
const FALLBACK_COLUMN_WIDTH = 280;

interface GridMetrics {
  columnWidth: number;
  rowGap: number;
}

function getFallbackRatio(aspectRatio: PhotoItem["aspectRatio"]) {
  if (aspectRatio === "portrait") return 3 / 4;
  if (aspectRatio === "square") return 1;

  return 4 / 3;
}

function readGridMetrics(element: HTMLElement): GridMetrics {
  const styles = window.getComputedStyle(element);
  const columns = styles.gridTemplateColumns
    .split(" ")
    .filter(Boolean).length;

  const columnCount = Math.max(1, columns);
  const columnGap = Number.parseFloat(styles.columnGap) || 0;
  const rowGap = Number.parseFloat(styles.rowGap) || 0;

  const columnWidth =
    (element.clientWidth - columnGap * (columnCount - 1)) / columnCount;

  return {
    columnWidth: Number.isFinite(columnWidth) && columnWidth > 0
      ? columnWidth
      : FALLBACK_COLUMN_WIDTH,
    rowGap,
  };
}

function getGridRowSpan(height: number, rowGap: number) {
  return Math.max(
    4,
    Math.ceil((height + rowGap) / (GRID_AUTO_ROW_HEIGHT + rowGap)),
  );
}

export function GalleryGrid({ photos, onPhotoClick, className }: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [gridMetrics, setGridMetrics] = useState<GridMetrics>({
    columnWidth: FALLBACK_COLUMN_WIDTH,
    rowGap: 16,
  });

  const markLoaded = useCallback((id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;

      const next = new Set(prev);
      next.add(id);

      return next;
    });
  }, []);

  const registerImageRatio = useCallback((id: string, width: number, height: number) => {
    if (width <= 0 || height <= 0) return;

    const ratio = width / height;

    setImageRatios((current) => {
      if (Math.abs((current[id] ?? 0) - ratio) < 0.001) {
        return current;
      }

      return {
        ...current,
        [id]: ratio,
      };
    });
  }, []);

  const imgRef = useCallback(
    (id: string) => (el: HTMLImageElement | null) => {
      if (!el) return;

      if (el.complete) {
        markLoaded(id);
        registerImageRatio(id, el.naturalWidth, el.naturalHeight);
      }
    },
    [markLoaded, registerImageRatio],
  );

  useEffect(() => {
    const element = gridRef.current;

    if (!element) return;

    const updateGridMetrics = () => {
      const nextMetrics = readGridMetrics(element);

      setGridMetrics((current) => {
        const sameColumnWidth =
          Math.abs(current.columnWidth - nextMetrics.columnWidth) < 0.5;
        const sameRowGap = Math.abs(current.rowGap - nextMetrics.rowGap) < 0.5;

        if (sameColumnWidth && sameRowGap) {
          return current;
        }

        return nextMetrics;
      });
    };

    updateGridMetrics();

    const observer = new ResizeObserver(updateGridMetrics);
    observer.observe(element);

    window.addEventListener("resize", updateGridMetrics);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateGridMetrics);
    };
  }, []);

  const getRowSpan = (photo: PhotoItem) => {
    const ratio = imageRatios[photo.id] ?? getFallbackRatio(photo.aspectRatio);
    const targetHeight = gridMetrics.columnWidth / ratio;

    return getGridRowSpan(targetHeight, gridMetrics.rowGap);
  };

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
        "grid max-w-full grid-cols-2 auto-rows-[4px] gap-2 [grid-auto-flow:dense] sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4",
        className,
      )}
    >
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          data-gallery-frame
          onClick={() => onPhotoClick(photo, index)}
          className="group relative min-h-11 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ gridRowEnd: `span ${getRowSpan(photo)}` }}
        >
          {photo.image ? (
            <img
              ref={imgRef(photo.id)}
              src={photo.image}
              alt={photo.title}
              loading="lazy"
              onLoad={(event) => {
                markLoaded(photo.id);

                const { naturalWidth, naturalHeight } = event.currentTarget;
                registerImageRatio(photo.id, naturalWidth, naturalHeight);
              }}
              onError={() => markLoaded(photo.id)}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]",
                !loadedIds.has(photo.id) && "opacity-0",
              )}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,28,0.92),rgba(4,8,18,0.98))]" />
          )}

          <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />

          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-xs uppercase tracking-[0.18em] text-white/80">
              {photo.category}
            </p>
            <p className="mt-1 text-sm font-medium text-white">{photo.title}</p>

            {!photo.image ? (
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                No image uploaded
              </p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );
}