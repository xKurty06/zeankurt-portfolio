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
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";
import { useRouter } from "next/navigation";

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
  const lowMotion = useLowMotionDevice();
  const router = useRouter();

  const handleClick = () => {
    const el = ref.current;

    if (!el) return;

    if (lowMotion) {
      router.push("/#about");
      return;
    }

    registerGsapPlugins();

    const split = new SplitText(el, { type: "chars" });

    gsap.to(split.chars, {
      y: () => (Math.random() - 0.5) * 140,
      x: () => (Math.random() - 0.5) * 140,
      rotation: () => (Math.random() - 0.5) * 360,
      scale: () => Math.random() * 1.2 + 0.5,
      autoAlpha: 0,
      duration: 0.4,
      stagger: { amount: 0.1, from: "random" },
      ease: "power2.out",
      onComplete: () => {
        split.revert();

        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.9 },
          { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out" },
        );

        setKey((current) => current + 1);
        router.push("/#about");
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
      className="hero-name-glow text-gradient block max-w-full cursor-pointer select-none break-words [overflow-wrap:anywhere]"
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
  const lowMotion = useLowMotionDevice();
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

      if (lowMotion) {
        gsap.set(
          [
            "[data-hero='name']",
            "[data-hero='role']",
            "[data-hero='tagline']",
            "[data-hero='copy']",
            "[data-hero='actions'] > *",
            "[data-hero='meta']",
            "[data-hero='network']",
          ],
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            scale: 1,
            clearProps: "filter,transform,opacity,visibility",
          },
        );

        return;
      }

      const content = sectionRef.current?.querySelector<HTMLElement>("[data-hero-content]");
      const background = sectionRef.current?.querySelector<HTMLElement>("[data-hero-bg]");

      const setContentY = content ? gsap.quickSetter(content, "y", "px") : null;
      const setBackgroundY = background ? gsap.quickSetter(background, "y", "px") : null;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-hero='name']", {
        autoAlpha: 0,
        scale: 0.88,
        y: 28,
        duration: 0.65,
        ease: "back.out(1.4)",
      });

      tl.from("[data-hero='role']", { autoAlpha: 0, y: 12, duration: 0.45 }, "-=0.25");
      tl.from("[data-hero='tagline']", { autoAlpha: 0, y: 8, duration: 0.3 }, "-=0.2");
      tl.from("[data-hero='copy']", { autoAlpha: 0, y: 12, duration: 0.45 }, "-=0.25");
      tl.from(
        "[data-hero='actions'] > *",
        {
          autoAlpha: 0,
          y: 12,
          scale: 0.94,
          stagger: 0.05,
          duration: 0.4,
          ease: "back.out(1.3)",
        },
        "-=0.3",
      );

      tl.from("[data-hero='meta']", { autoAlpha: 0, y: 8, duration: 0.35 }, "-=0.2");
      tl.from("[data-hero='network']", { autoAlpha: 0, x: 18, scale: 0.96, duration: 0.55 }, "-=0.35");

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          setContentY?.(self.progress * 40);
        },
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 2,
        onUpdate: (self) => {
          setBackgroundY?.(self.progress * 24);
        },
      });
    },
    { dependencies: [loaderComplete, lowMotion], revertOnUpdate: true, scope: sectionRef },
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

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.82)_0%,rgba(3,7,18,0.38)_45%,rgba(3,7,18,0.74)_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(3,7,18,0.92),transparent)]" />

      <Container
        className="relative z-10 py-10 text-center sm:py-14 md:py-20 lg:text-left"
        data-hero-content=""
      >
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:mx-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.64fr)] lg:gap-14">
          <div className="relative min-w-0">

            <div className="mx-auto max-w-3xl lg:mx-0">
              <div
                data-hero="tagline"
                className="mx-auto mb-4 inline-flex max-w-full items-center py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--blue-100)] backdrop-blur-sm sm:text-xs lg:mx-0"
              >
                <span className="truncate">{siteConfig.headline}</span>
              </div>

              <h1 className="max-w-full font-[family-name:var(--font-syne)] text-[clamp(2.3rem,8vw,4.15rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:max-w-[13ch]">
                <span data-hero="name">
                  <ShatterName name={siteConfig.name} />
                </span>

                <span
                  data-hero="role"
                  className="mt-3 block max-w-full text-[clamp(1.25rem,5vw,2rem)] font-medium leading-tight tracking-[-0.035em] text-[var(--blue-200)] sm:text-3xl md:text-4xl"
                >
                  <TypewriterCycle
                    phrases={ROLES}
                    className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-syne)] align-bottom"
                  />
                </span>
              </h1>

              <p
                data-hero="copy"
                className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--foreground-muted)] sm:text-[1.05rem] sm:leading-8 lg:mx-0"
              >
                <span className="font-medium text-[var(--gold-300)]">Co-Founder at Studio Nomads</span>,{" "}
                <span className="font-medium text-[var(--blue-100)]">Co-Founder at WebX</span>, aspiring
                full-stack developer, Web3 community contributor, {" "}
                <span className="font-medium text-[var(--rose-300)]">photographer, videographer</span> and <span className="font-medium text-[var(--rose-300)]">editor</span>{" "}
                based in Cavite, Philippines.
              </p>

              <div
                data-hero="actions"
                className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              >
                <MagneticButton>
                  <RippleButton>
                    <Button href="/#projects" className="min-h-12 px-5">
                      View projects <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </RippleButton>
                </MagneticButton>

                <MagneticButton>
                  <RippleButton>
                    <Button href="/photography" variant="secondary" className="min-h-12 px-5">
                      Creatives
                    </Button>
                  </RippleButton>
                </MagneticButton>
              </div>

              <div data-hero="meta" className="mt-7">
                <SocialLinks
                  links={socialGroups.personal}
                  size="sm"
                  className="justify-center lg:justify-start"
                />
              </div>
            </div>
          </div>

          <div
            data-hero="network"
            aria-hidden
            className="hero-network-panel pointer-events-none relative hidden min-h-[20rem] lg:block"
          >
            <div className="hero-network-orbit">
              {HERO_STACK.map((item, index) => (
                <span key={item} className={`hero-network-node hero-network-node-${index}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
