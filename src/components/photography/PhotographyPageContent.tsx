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
import { BackgroundBoxes } from "@/components/ui/BackgroundBoxes";
import { Container } from "@/components/ui/Container";
import FlowFieldBackground from "@/components/ui/FlowFieldBackground";
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
      <div
        ref={heroRef}
        className="relative isolate overflow-hidden border-b border-white/10 pb-16 pt-28 md:pb-20 md:pt-32"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 [mask-image:linear-gradient(180deg,transparent,white_18%,white_82%,transparent)]">
            <BackgroundBoxes className="opacity-100" rows={24} cols={16} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.7),rgba(3,7,18,0.46)_34%,rgba(3,7,18,0.78))]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(72,202,228,0.12),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(144,224,239,0.08),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(0,119,182,0.12),transparent_34%)]" />
        </div>

        <Container className="relative z-10">
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
            Photography & visual stories from events, portraits, and the streets.
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
        <section id="albums" className="relative isolate scroll-mt-28 overflow-hidden rounded-[2rem] border border-white/8 bg-[rgba(255,255,255,0.015)] px-6 py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-0">
            <FlowFieldBackground
              className="opacity-90"
              color="#48cae4"
              trailOpacity={0.09}
              particleCount={360}
              speed={0.62}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.86),rgba(3,7,18,0.68)_36%,rgba(3,7,18,0.86))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(72,202,228,0.12),transparent_22%),radial-gradient(circle_at_82%_30%,rgba(0,180,216,0.08),transparent_26%)]" />
          </div>

          <div className="relative z-10">
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
