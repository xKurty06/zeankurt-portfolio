import type { PhotoAlbum, PhotoItem } from "@/types";

export const photoCategories = [
  "All",
  "Events",
  "Portraits",
  "Street",
  "Creative",
] as const;

export type PhotoCategory = (typeof photoCategories)[number];

export const photoAlbums: PhotoAlbum[] = [
  {
    slug: "campus-events",
    title: "Campus & Community Events",
    description:
      "Web3 meetups, hackathons, and campus tours across CALABARZON — capturing the energy of builder communities.",
    category: "Events",
    coverSeed: "album-campus",
    photoCount: 12,
  },
  {
    slug: "portraits",
    title: "Portraits",
    description:
      "Natural-light and editorial portraits — focused on expression, mood, and clean composition.",
    category: "Portraits",
    coverSeed: "album-portraits",
    photoCount: 8,
  },
  {
    slug: "street-calabarzon",
    title: "Street — Calabarzon",
    description:
      "Candid street frames from around Cavite and neighboring provinces — everyday rhythm and light.",
    category: "Street",
    coverSeed: "album-street",
    photoCount: 10,
  },
  {
    slug: "studio-nomads-work",
    title: "Studio Nomads Selects",
    description:
      "Selected work produced with Studio Nomads — events, brand coverage, and collaborative shoots.",
    category: "Events",
    coverSeed: "album-nomads",
    photoCount: 14,
  },
  {
    slug: "creative-experiments",
    title: "Creative Experiments",
    description:
      "Personal explorations in color, motion blur, and experimental framing under shot.by.zk.",
    category: "Creative",
    coverSeed: "album-creative",
    photoCount: 6,
  },
];

function buildPhotosForAlbum(
  album: PhotoAlbum,
  count: number,
): PhotoItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${album.slug}-${index + 1}`,
    title: `${album.title} — ${String(index + 1).padStart(2, "0")}`,
    category: album.category,
    albumSlug: album.slug,
    imageSeed: `${album.coverSeed}-${index + 1}`,
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

export function getPhotoImageUrl(seed: string, width = 1200, height = 800) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
