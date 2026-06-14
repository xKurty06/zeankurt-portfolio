"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { siteConfig } from "@/data/site";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import {
  buildPhotoCategories,
  buildPhotographyAlbums,
  buildPhotographyPhotos,
} from "@/lib/photography";
import { AlbumCard } from "@/components/photography/AlbumCard";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { BackgroundBoxes } from "@/components/ui/BackgroundBoxes";
import { SocialLinks } from "@/components/ui/SocialLinks";
import type { CreativeCategory } from "@/types";

interface PhotographyPageContentProps {
  creativeCategories: CreativeCategory[];
}

export function PhotographyPageContent({ creativeCategories }: PhotographyPageContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const photoAlbums = useMemo(
    () => buildPhotographyAlbums(creativeCategories),
    [creativeCategories],
  );
  const photoCategories = useMemo(
    () => buildPhotoCategories(creativeCategories),
    [creativeCategories],
  );
  const photos = useMemo(
    () => buildPhotographyPhotos(creativeCategories),
    [creativeCategories],
  );
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "All") return photos;
    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory]);

  useGSAP(
    () => {
      registerGsapPlugins();
      gsap.from("[data-photo-hero='line']", {
        autoAlpha: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
      });
    },
    { scope: heroRef },
  );

  return (
    <>
      <div
        ref={heroRef}
        className="relative isolate overflow-hidden border-b border-white/10 pb-16 pt-28 md:pb-20 md:pt-32"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-slate-950/80" />
          <div className="absolute inset-0 opacity-80 [mask-image:linear-gradient(180deg,transparent,white_7%,white_88%,transparent)]">
            <BackgroundBoxes
              variant="full"
              className="[filter:brightness(0.88)]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-slate-950/40 [mask-image:radial-gradient(transparent,white)]" />
        </div>

        <Container className="pointer-events-none relative z-10">
          <p
            data-photo-hero="line"
            className="font-mono text-xs uppercase tracking-[0.28em] text-white/50"
          >
            {siteConfig.photographyBrand}
          </p>
          <h1
            data-photo-hero="line"
            className="mt-4 max-w-3xl break-words font-[family-name:var(--font-syne)] text-[clamp(1.875rem,8vw,2.5rem)] font-semibold leading-tight text-white sm:text-5xl md:text-6xl"
          >
            Photography & visual stories from events, portraits, and the streets.
          </h1>
          <p
            data-photo-hero="line"
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
          >
            Work published under shot.by.zk and produced with Studio Nomads — covering Web3
            community events, campus activations, and editorial shoots.
          </p>
          <div data-photo-hero="line" className="pointer-events-auto mt-8">
            <SocialLinks links={socialGroups.photography} />
          </div>
        </Container>
      </div>

      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.72),rgba(3,7,18,0.42)_30%,rgba(3,7,18,0.58)_68%,rgba(3,7,18,0.82))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(72,202,228,0.22),transparent_28%),radial-gradient(circle_at_82%_30%,rgba(0,180,216,0.16),transparent_30%),radial-gradient(circle_at_46%_72%,rgba(2,62,138,0.24),transparent_40%)]" />
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(72,202,228,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(72,202,228,0.07)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:linear-gradient(180deg,transparent,white_10%,white_90%,transparent)]" />
          <div className="absolute left-[6%] top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.2),transparent_70%)] blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute bottom-10 right-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.26),transparent_72%)] blur-3xl sm:h-96 sm:w-96" />
        </div>

        <Container className="relative z-10 py-14 md:py-20">
          <section
            id="albums"
            className="scroll-mt-28 px-0 py-0"
          >
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  Albums
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold text-white">
                  Collections
                </h2>
              </div>
            </div>
            {photoAlbums.length > 0 ? (
              <div className="grid max-w-full grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {photoAlbums.map((album) => (
                  <AlbumCard key={album.slug} album={album} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/65">
                No photography categories are published yet.
              </div>
            )}
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                  Gallery
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold text-white">
                  All frames
                </h2>
              </div>
              {photos.length > 0 ? (
                <GalleryFilter
                  categories={photoCategories}
                  active={activeCategory}
                  onChange={setActiveCategory}
                />
              ) : null}
            </div>

            {filteredPhotos.length > 0 ? (
              <GalleryGrid
                photos={filteredPhotos}
                onPhotoClick={(_photo, index) => {
                  setLightboxIndex(index);
                }}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/65">
                No published photos available yet.
              </div>
            )}
          </section>
        </Container>
      </section>

      <Lightbox
        photos={filteredPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}

function GalleryFilter({
  categories,
  active,
  onChange,
}: {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="flex max-w-full flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={
            active === category
              ? "min-h-11 rounded-full border border-white bg-white px-4 py-2 text-sm text-black"
              : "min-h-11 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
          }
        >
          {category}
        </button>
      ))}
    </div>
  );
}
