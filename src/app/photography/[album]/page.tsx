import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumPageContent } from "@/components/photography/AlbumPageContent";
import { getAlbumBySlug, photoAlbums } from "@/data/photography";
import { getPortfolioContent } from "@/lib/cms/queries";

interface AlbumPageProps {
  params: Promise<{ album: string }>;
}

export async function generateStaticParams() {
  const content = await getPortfolioContent();
  const creativeCategoryParams = content.creativeCategories.map((category) => ({
    album: category.slug,
  }));

  return [
    ...photoAlbums.map((album) => ({ album: album.slug })),
    ...creativeCategoryParams,
  ];
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { album: albumSlug } = await params;
  const album = getAlbumBySlug(albumSlug);
  const creativeCategory = album ? null : (await getPortfolioContent()).creativeCategories.find(
    (category) => category.slug === albumSlug,
  );

  if (!album && !creativeCategory) {
    return { title: "Album not found" };
  }

  return {
    title: album?.title ?? creativeCategory?.name ?? "Photography",
    description: album?.description ?? creativeCategory?.description ?? "Photography category",
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { album: albumSlug } = await params;
  const album = getAlbumBySlug(albumSlug);
  const creativeCategory = album ? null : (await getPortfolioContent()).creativeCategories.find(
    (category) => category.slug === albumSlug,
  );

  if (!album && !creativeCategory) {
    notFound();
  }

  if (album) {
    return <AlbumPageContent album={album} />;
  }

  return (
    <AlbumPageContent
      album={{
        slug: creativeCategory!.slug,
        title: creativeCategory!.name,
        description: creativeCategory!.description ?? "",
        category: creativeCategory!.name,
        coverSeed: creativeCategory!.slug,
        coverImage: creativeCategory!.showcaseImage,
      }}
      photos={creativeCategory!.photos}
    />
  );
}
