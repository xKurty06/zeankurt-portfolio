"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins, SplitText, ScrollTrigger } from "@/lib/gsap";
import { AnimatedBackground } from "@/components/animation/AnimatedBackground";
import { MagneticButton } from "@/components/animation/MagneticButton";
import { TypewriterCycle } from "@/components/animation/TypewriterCycle";
import { RippleButton } from "@/components/animation/RippleButton";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { redirect } from "next/navigation";

const ROLES = [
  "Full-Stack Developer",
  "Web3 Builder",
  "Co-Founder",
  "Photographer & Videographer",
  "Creative Technologist",
  "Photo Editor",
  "Colorist",
];

const HERO_STACK = ["Build", "Ship", "Capture", "Connect"];

function ShatterName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [key, setKey] = useState(0);

  const handleClick = () => {
    const el = ref.current;
    if (!el) return;

    registerGsapPlugins();

    const split = new SplitText(el, { type: "chars" });

    gsap.to(split.chars, {
      y: () => (Math.random() - 0.5) * 200,
      x: () => (Math.random() - 0.5) * 200,
      rotation: () => (Math.random() - 0.5) * 720,
      scale: () => Math.random() * 1.5 + 0.5,
      autoAlpha: 0,
      duration: 0.5,
      stagger: { amount: 0.15, from: "random" },
      ease: "power2.out",
      onComplete: () => {
        split.revert();

        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.8 },
          { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.8)" },
        );

        setKey((current) => current + 1);
        redirect("/#about");
      },
    });
  };

  return (
    <span
      ref={ref}
      key={key}
      onClick={handleClick}
      data-interactive
      title="Click me"
      className="text-gradient block max-w-full cursor-pointer select-none break-words [overflow-wrap:anywhere]"
      style={{ perspective: 600 }}
    >
      {name}
    </span>
  );
}

interface HeroSectionProps {
  siteConfig: {
    name: string;
    headline: string;
    description: string;
  };
}

export function HeroSection({ siteConfig }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [loaderComplete, setLoaderComplete] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.loaderComplete === "true") {
      setLoaderComplete(true);
      return;
    }

    const handleLoaderComplete = () => setLoaderComplete(true);
    const fallback = window.setTimeout(() => setLoaderComplete(true), 5200);

    window.addEventListener("portfolio-loader-complete", handleLoaderComplete);

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("portfolio-loader-complete", handleLoaderComplete);
    };
  }, []);

  useGSAP(
    () => {
      if (!loaderComplete) return;

      registerGsapPlugins();

      gsap.set(sectionRef.current, { autoAlpha: 1 });

      const content = sectionRef.current?.querySelector<HTMLElement>("[data-hero-content]");
      const background = sectionRef.current?.querySelector<HTMLElement>("[data-hero-bg]");
      const setContentY = content ? gsap.quickSetter(content, "y", "px") : null;
      const setBackgroundY = background ? gsap.quickSetter(background, "y", "px") : null;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-hero='name']", {
        autoAlpha: 0,
        scale: 0.85,
        y: 32,
        duration: 0.75,
        ease: "back.out(1.6)",
      });
      tl.from("[data-hero='role']", { autoAlpha: 0, y: 14, duration: 0.5 }, "-=0.3");
      tl.from("[data-hero='tagline']", { autoAlpha: 0, y: 10, duration: 0.35 }, "-=0.25");
      tl.from("[data-hero='copy']", { autoAlpha: 0, y: 14, duration: 0.5 }, "-=0.3");
      tl.from(
        "[data-hero='actions'] > *",
        {
          autoAlpha: 0,
          y: 14,
          scale: 0.94,
          stagger: 0.06,
          duration: 0.5,
          ease: "back.out(1.5)",
        },
        "-=0.35",
      );
      tl.from("[data-hero='meta']", { autoAlpha: 0, y: 10, duration: 0.45 }, "-=0.25");
      tl.from("[data-hero='network']", { autoAlpha: 0, x: 24, scale: 0.96, duration: 0.75 }, "-=0.55");

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          setContentY?.(self.progress * 60);
        },
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 2,
        onUpdate: (self) => {
          setBackgroundY?.(self.progress * 32);
        },
      });
    },
    { dependencies: [loaderComplete], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden pt-16 md:min-h-svh md:pt-[var(--header-height)]"
      style={{ visibility: "hidden" }}
    >
      <div data-hero-bg className="absolute inset-0">
        <AnimatedBackground />
      </div>

      <Container
        className="relative z-10 py-10 text-center sm:py-14 md:py-20 lg:py-24 lg:text-left"
        data-hero-content=""
      >
        <div className="mx-auto max-w-3xl lg:mx-0">
          <h1 className="max-w-full font-[family-name:var(--font-syne)] text-[clamp(2rem,10vw,3rem)] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl md:text-7xl">
            <span data-hero="name">
              <ShatterName name={siteConfig.name} />
            </span>

            <span
              data-hero="role"
              className="mt-1.5 block max-w-full text-[clamp(1.1rem,5.5vw,1.5rem)] font-normal text-[var(--blue-300)] sm:text-3xl md:text-4xl"
            >
              <TypewriterCycle
                phrases={ROLES}
                className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-syne)] align-bottom"
              />
            </span>

            <span
              data-hero="tagline"
              className="mt-2 block text-xs font-light tracking-wide text-white/50 sm:text-sm"
            >
              {siteConfig.headline}
            </span>
          </h1>

          <p
            data-hero="copy"
            className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)] sm:mt-4 sm:text-base lg:mx-0"
          >
            {siteConfig.description}
          </p>

          <div
            data-hero="actions"
            className="mt-5 flex flex-col items-stretch justify-center gap-2 min-[420px]:flex-row min-[420px]:items-center sm:gap-3 lg:justify-start"
          >
            <MagneticButton>
              <RippleButton>
                <Button href="/#projects" className="w-full min-[420px]:w-auto">
                  View projects <ArrowUpRight className="h-4 w-4" />
                </Button>
              </RippleButton>
            </MagneticButton>

            <MagneticButton>
              <RippleButton>
                <Button href="/photography" variant="secondary" className="w-full min-[420px]:w-auto">
                  Photography
                </Button>
              </RippleButton>
            </MagneticButton>
          </div>

          <div data-hero="meta" className="mt-5 sm:mt-6">
            <SocialLinks
              links={socialGroups.personal}
              size="sm"
              className="justify-center lg:justify-start"
            />
          </div>
        </div>

        <div
          data-hero="network"
          aria-hidden
          className="hero-network-panel pointer-events-none absolute right-0 top-1/2 hidden w-[18rem] -translate-y-1/2 lg:block"
        >
          <div className="hero-network-orbit">
            {HERO_STACK.map((item, index) => (
              <span key={item} className={`hero-network-node hero-network-node-${index}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}