import type { CreativeCategory, PhotoAlbum, PhotoItem } from "@/types";

export function buildPhotographyAlbums(categories: CreativeCategory[]): PhotoAlbum[] {
  return categories.map((category) => ({
    slug: category.slug,
    title: category.name,
    description: category.description ?? "",
    category: category.name,
    coverImage: category.showcaseImage ?? category.photos[0]?.image,
    coverAspectRatio: category.photos[0]?.aspectRatio ?? "landscape",
    photoCount: category.photos.length,
  }));
}

export function buildPhotographyPhotos(categories: CreativeCategory[]): PhotoItem[] {
  return categories.flatMap((category) => category.photos);
}

export function buildPhotoCategories(categories: CreativeCategory[]) {
  return ["All", ...categories.map((category) => category.name)] as const;
}

export function getCreativePhotoCount(categories: CreativeCategory[]) {
  return categories.reduce((total, category) => total + category.photos.length, 0);
}

export function getCreativeCategoryBySlug(categories: CreativeCategory[], slug: string) {
  return categories.find((category) => category.slug === slug);
}
