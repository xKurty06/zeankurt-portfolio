"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  photoAlbums,
  photoCategories,
  photos,
  type PhotoCategory,
} from "@/data/photography";
import { siteConfig } from "@/data/site";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { AlbumCard } from "@/components/photography/AlbumCard";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { Lightbox } from "@/components/photography/Lightbox";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";

export function PhotographyPageContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>("All");
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
      <div ref={heroRef} className="border-b border-white/10 pb-16 pt-28 md:pb-20 md:pt-32">
        <Container>
          <p
            data-photo-hero="line"
            className="font-mono text-xs uppercase tracking-[0.28em] text-white/50"
          >
            {siteConfig.photographyBrand}
          </p>
          <h1
            data-photo-hero="line"
            className="mt-4 max-w-3xl font-[family-name:var(--font-syne)] text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl"
          >
            Photography & visual stories from events, portraits, and the streets of CALABARZON.
          </h1>
          <p
            data-photo-hero="line"
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
          >
            Work published under shot.by.zk and produced with Studio Nomads — covering Web3
            community events, campus activations, and editorial shoots.
          </p>
          <div data-photo-hero="line" className="mt-8">
            <SocialLinks links={socialGroups.photography} />
          </div>
        </Container>
      </div>

      <Container className="py-14 md:py-20">
        <section id="albums" className="scroll-mt-28">
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {photoAlbums.map((album) => (
              <AlbumCard key={album.slug} album={album} />
            ))}
          </div>
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
            <GalleryFilter
              categories={photoCategories}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          </div>

          <GalleryGrid
            photos={filteredPhotos}
            onPhotoClick={(photo) => {
              const index = filteredPhotos.findIndex((item) => item.id === photo.id);
              setLightboxIndex(index);
            }}
          />
        </section>
      </Container>

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
  categories: readonly PhotoCategory[];
  active: PhotoCategory;
  onChange: (category: PhotoCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={
            active === category
              ? "rounded-full border border-white bg-white px-4 py-2 text-sm text-black"
              : "rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
          }
        >
          {category}
        </button>
      ))}
    </div>
  );
}
