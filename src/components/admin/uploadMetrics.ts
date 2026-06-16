"use client";

export type UploadMetric = {
  optimizedBytes: number | null;
  originalBytes: number;
};

const MAX_IMAGE_DIMENSION = 1800;

function roundDimension(value: number) {
  return Math.max(1, Math.round(value));
}

async function readImageDimensions(file: File) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Failed to read image dimensions."));
      image.src = objectUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function estimateOptimizedImageBytes(file: File) {
  if (!file.type.startsWith("image/")) {
    return null;
  }

  const mime = file.type.toLowerCase();
  if (mime === "image/svg+xml" || mime === "image/gif") {
    return file.size;
  }

  try {
    const { width, height } = await readImageDimensions(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, 1), MAX_IMAGE_DIMENSION / Math.max(height, 1));
    const resizedWidth = roundDimension(width * scale);
    const resizedHeight = roundDimension(height * scale);
    const pixels = resizedWidth * resizedHeight;

    const bytesPerPixel =
      mime === "image/avif"
        ? 0.07
        : mime === "image/webp"
          ? 0.1
          : mime === "image/png"
            ? 0.48
            : 0.16;

    const estimated = Math.round(pixels * bytesPerPixel);
    return Math.min(file.size, Math.max(16 * 1024, estimated));
  } catch {
    return file.size;
  }
}

export async function buildUploadMetricMap(files: File[]) {
  const entries = await Promise.all(
    files.map(async (file) => [
      `${file.name}-${file.size}`,
      {
        optimizedBytes: await estimateOptimizedImageBytes(file),
        originalBytes: file.size,
      } satisfies UploadMetric,
    ] as const),
  );

  return Object.fromEntries(entries) as Record<string, UploadMetric>;
}

export function formatBytes(bytes: number | null | undefined) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }

  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
