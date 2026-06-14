"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhotoItem } from "@/types";
import { cn } from "@/lib/cn";

const GRID_AUTO_ROW_HEIGHT = 4;
const FALLBACK_COLUMN_WIDTH = 280;

type GridMetrics = {
  columnWidth: number;
  rowGap: number;
};

interface GalleryGridProps {
  photos: PhotoItem[];
  onPhotoClick?: (photo: PhotoItem, index: number) => void;
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
    .map((value) => Number.parseFloat(value))
    .filter(Number.isFinite);

  const columnGap = Number.parseFloat(styles.columnGap) || 0;
  const rowGap = Number.parseFloat(styles.rowGap) || 16;

  if (columns.length > 0) {
    return {
      columnWidth: columns[0],
      rowGap,
    };
  }

  const fallbackColumnCount = Math.max(
    1,
    Math.round(element.clientWidth / FALLBACK_COLUMN_WIDTH),
  );

  const totalGap = columnGap * Math.max(0, fallbackColumnCount - 1);
  const columnWidth = (element.clientWidth - totalGap) / fallbackColumnCount;

  return {
    columnWidth: Number.isFinite(columnWidth)
      ? columnWidth
      : FALLBACK_COLUMN_WIDTH,
    rowGap,
  };
}

function getGridRowSpan(height: number, rowGap: number) {
  return Math.max(
    8,
    Math.ceil((height + rowGap) / (GRID_AUTO_ROW_HEIGHT + rowGap)),
  );
}

export function GalleryGrid({ photos, onPhotoClick }: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [gridMetrics, setGridMetrics] = useState<GridMetrics>({
    columnWidth: FALLBACK_COLUMN_WIDTH,
    rowGap: 16,
  });

  const registerImageRatio = useCallback(
    (id: string, width: number, height: number) => {
      if (!width || !height) return;

      setImageRatios((current) => {
        const ratio = width / height;

        if (current[id] === ratio) return current;

        return {
          ...current,
          [id]: ratio,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateMetrics = () => {
      setGridMetrics(readGridMetrics(grid));
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(grid);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getRowSpan = (photo: PhotoItem) => {
    const ratio = imageRatios[photo.id] ?? getFallbackRatio(photo.aspectRatio);
    let targetHeight = gridMetrics.columnWidth / ratio;

    const isMobile = gridMetrics.columnWidth < 220;

    if (isMobile) {
      if (ratio < 0.85) {
        targetHeight *= 1.12;
      } else if (ratio > 1.15) {
        targetHeight *= 0.78;
      } else {
        targetHeight *= 0.95;
      }
    }

    return getGridRowSpan(targetHeight, gridMetrics.rowGap);
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <div
      ref={gridRef}
      className="grid max-w-full grid-cols-2 auto-rows-[4px] gap-2 [grid-auto-flow:dense] sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {photos.map((photo, index) => {
        const isLoaded = loadedIds.has(photo.id);

        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPhotoClick?.(photo, index)}
            className="group relative block min-w-0 overflow-hidden rounded-2xl bg-white/[0.03] text-left shadow-[0_16px_44px_rgba(0,0,0,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-300)]"
            style={{
              gridRowEnd: `span ${getRowSpan(photo)}`,
            }}
          >
            <img
              src={photo.image}
              alt={photo.title}
              loading="lazy"
              ref={(element) => {
                if (element?.complete) {
                  registerImageRatio(
                    photo.id,
                    element.naturalWidth,
                    element.naturalHeight,
                  );
                }
              }}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;

                registerImageRatio(photo.id, naturalWidth, naturalHeight);

                setLoadedIds((current) => {
                  const next = new Set(current);
                  next.add(photo.id);
                  return next;
                });
              }}
              className={cn(
                "absolute inset-0 h-full w-full rounded-2xl object-cover transition duration-700 group-hover:scale-[1.03]",
                isLoaded ? "opacity-100" : "opacity-0",
              )}
            />

            <div
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(8,14,28,0.18),rgba(3,7,18,0.54))] transition duration-300",
                "opacity-0 group-hover:opacity-100",
              )}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 rounded-b-2xl p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                {photo.category}
              </p>

              <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white">
                {photo.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}