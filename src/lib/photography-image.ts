"use server";

import sharp from "sharp";
import { resolvePhotoAspectRatio } from "@/lib/photo-aspect";

export async function optimizePhotographyImage(buffer: Buffer, mime = "image/jpeg") {
  try {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const resizeOptions = {
      width: 1800,
      height: 1800,
      fit: "inside" as const,
      withoutEnlargement: true,
    };

    switch (metadata.format) {
      case "jpeg":
      case "jpg": {
        const { data, info } = await image
          .resize(resizeOptions)
          .jpeg({ quality: 76, mozjpeg: true })
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
          .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 9, palette: true, quality: 80 })
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
          .webp({ quality: 74 })
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
          .avif({ quality: 50 })
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
      aspectRatio: "landscape",
      bytes: buffer,
      contentType: mime,
    };
  }
}
