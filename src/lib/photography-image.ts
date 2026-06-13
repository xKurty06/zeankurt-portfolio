"use server";

import sharp from "sharp";

export type PhotoAspectRatio = "portrait" | "landscape" | "square";

const SQUARE_RATIO_TOLERANCE = 0.08;

function resolvePhotoAspectRatio(width?: number | null, height?: number | null): PhotoAspectRatio {
  if (!width || !height) return "landscape";

  const ratio = width / Math.max(height, 1);
  if (Math.abs(1 - ratio) <= SQUARE_RATIO_TOLERANCE) {
    return "square";
  }

  return ratio > 1 ? "landscape" : "portrait";
}

export async function optimizePhotographyImage(buffer: Buffer, mime = "image/jpeg") {
  try {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const resizeOptions = {
      width: 2048,
      height: 2048,
      fit: "inside" as const,
      withoutEnlargement: true,
    };

    switch (metadata.format) {
      case "jpeg":
      case "jpg": {
        const { data, info } = await image
          .resize(resizeOptions)
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer({ resolveWithObject: true });
        return {
          aspectRatio: resolvePhotoAspectRatio(info.width, info.height),
          bytes: data,
          contentType: "image/jpeg",
        };
      }
      case "png": {
        const { data, info } = await image
          .resize(resizeOptions)
          .png({ compressionLevel: 8, adaptiveFiltering: true, effort: 6 })
          .toBuffer({ resolveWithObject: true });
        return {
          aspectRatio: resolvePhotoAspectRatio(info.width, info.height),
          bytes: data,
          contentType: "image/png",
        };
      }
      case "webp": {
        const { data, info } = await image
          .resize(resizeOptions)
          .webp({ quality: 80 })
          .toBuffer({ resolveWithObject: true });
        return {
          aspectRatio: resolvePhotoAspectRatio(info.width, info.height),
          bytes: data,
          contentType: "image/webp",
        };
      }
      case "avif": {
        const { data, info } = await image
          .resize(resizeOptions)
          .avif({ quality: 60 })
          .toBuffer({ resolveWithObject: true });
        return {
          aspectRatio: resolvePhotoAspectRatio(info.width, info.height),
          bytes: data,
          contentType: "image/avif",
        };
      }
      default:
        return {
          aspectRatio: resolvePhotoAspectRatio(metadata.width, metadata.height),
          bytes: buffer,
          contentType: mime,
        };
    }
  } catch {
    return {
      aspectRatio: "landscape" as PhotoAspectRatio,
      bytes: buffer,
      contentType: mime,
    };
  }
}
