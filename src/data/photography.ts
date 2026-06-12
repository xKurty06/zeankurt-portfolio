import type { PhotoAlbum, PhotoItem } from "@/types";

export const photoCategories = [
  "All",
  "Event",
  "Portrait",
  "Street",
  "Creative",
  "Astrophotography",
] as const;

export type PhotoCategory = (typeof photoCategories)[number];

export const photoAlbums: PhotoAlbum[] = [
  {
    slug: "events",
    title: "Campus & Community Events",
    description:
      "Web3 meetups, hackathons, and campus tours across the Philippines - capturing the energy of builder communities.",
    category: "Event",
    photoCount: 12,
  },
  {
    slug: "portraits",
    title: "Portraits",
    description:
      "Natural-light and editorial portraits - focused on expression, mood, and clean composition.",
    category: "Portrait",
    photoCount: 8,
  },
  {
    slug: "street-photography",
    title: "Street Photography",
    description:
      "Candid street frames from around Cavite and neighboring provinces - everyday rhythm and light.",
    category: "Street",
    photoCount: 10,
  },
  {
    slug: "creative-shots",
    title: "Creative Shots",
    description:
      "Personal explorations in color, motion blur, and experimental framing under shot.by.zk.",
    category: "Creative",
    photoCount: 6,
  },
  {
    slug: "astrophotography",
    title: "Astrophotography",
    description:
      "Night-sky frames, moon studies, and long-exposure experiments focused on stars, atmosphere, and low-light detail.",
    category: "Astrophotography",
    photoCount: 6,
  },
];

function buildPhotosForAlbum(album: PhotoAlbum, count: number): PhotoItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${album.slug}-${index + 1}`,
    title: `${album.title} - ${String(index + 1).padStart(2, "0")}`,
    category: album.category,
    albumSlug: album.slug,
    imageSeed: `${album.slug}-${index + 1}`,
    aspectRatio: (index % 3 === 0
      ? "portrait"
      : index % 3 === 1
        ? "landscape"
        : "square") as PhotoItem["aspectRatio"],
    featured: index < 2,
  }));
}

export const photos: PhotoItem[] = photoAlbums.flatMap((album) =>
  buildPhotosForAlbum(album, Math.min(album.photoCount, 8)),
);

export const featuredPhotos = photos.filter((photo) => photo.featured).slice(0, 4);

export function getAlbumBySlug(slug: string) {
  return photoAlbums.find((album) => album.slug === slug);
}

export function getPhotosByAlbum(slug: string) {
  return photos.filter((photo) => photo.albumSlug === slug);
}

export function getPhotosByCategory(category: string) {
  if (category === "All") return photos;
  return photos.filter((photo) => photo.category === category);
}
