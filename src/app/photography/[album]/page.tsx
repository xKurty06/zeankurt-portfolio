import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumPageContent } from "@/components/photography/AlbumPageContent";
import { getPortfolioContent } from "@/lib/cms/queries";
import {
  buildPhotographyAlbums,
  getCreativeCategoryBySlug,
} from "@/lib/photography";

export const revalidate = 60;
export const dynamic = "force-static";

interface AlbumPageProps {
  params: Promise<{ album: string }>;
}

export async function generateStaticParams() {
  const content = await getPortfolioContent();

  return content.creativeCategories.map((category) => ({
    album: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { album: albumSlug } = await params;
  const content = await getPortfolioContent();
  const creativeCategory = getCreativeCategoryBySlug(
    content.creativeCategories,
    albumSlug,
  );

  if (!creativeCategory) {
    return {
      title: "Album not found",
    };
  }

  return {
    title: creativeCategory.name,
    description: creativeCategory.description ?? "Photography category",
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { album: albumSlug } = await params;
  const content = await getPortfolioContent();

  const creativeCategory = getCreativeCategoryBySlug(
    content.creativeCategories,
    albumSlug,
  );

  const album = creativeCategory
    ? buildPhotographyAlbums([creativeCategory])[0]
    : null;

  if (!album || !creativeCategory) {
    notFound();
  }

  return <AlbumPageContent album={album} photos={creativeCategory.photos} />;
}