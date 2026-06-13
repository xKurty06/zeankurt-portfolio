import type { PhotoItem } from "@/types";

export type PhotoAspectRatio = PhotoItem["aspectRatio"];

const SQUARE_RATIO_TOLERANCE = 0.08;

export function resolvePhotoAspectRatio(
  width?: number | null,
  height?: number | null,
): PhotoAspectRatio {
  if (!width || !height) return "landscape";

  const ratio = width / Math.max(height, 1);
  if (Math.abs(1 - ratio) <= SQUARE_RATIO_TOLERANCE) {
    return "square";
  }

  return ratio > 1 ? "landscape" : "portrait";
}
