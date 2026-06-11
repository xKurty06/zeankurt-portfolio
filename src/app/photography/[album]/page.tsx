import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumPageContent } from "@/components/photography/AlbumPageContent";
import { getAlbumBySlug, photoAlbums } from "@/data/photography";

interface AlbumPageProps {
  params: Promise<{ album: string }>;
}

export async function generateStaticParams() {
  return photoAlbums.map((album) => ({ album: album.slug }));
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { album: albumSlug } = await params;
  const album = getAlbumBySlug(albumSlug);

  if (!album) {
    return { title: "Album not found" };
  }

  return {
    title: album.title,
    description: album.description,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { album: albumSlug } = await params;
  const album = getAlbumBySlug(albumSlug);

  if (!album) {
    notFound();
  }

  return <AlbumPageContent album={album} />;
}
