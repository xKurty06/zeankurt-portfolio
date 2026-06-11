"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { siteConfig } from "@/data/site";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins, SplitText, ScrollTrigger } from "@/lib/gsap";
import { AnimatedBackground } from "@/components/animation/AnimatedBackground";
import { MagneticButton } from "@/components/animation/MagneticButton";
import { TypewriterCycle } from "@/components/animation/TypewriterCycle";
import { RippleButton } from "@/components/animation/RippleButton";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";

const ROLES = [
  "Full-Stack Developer",
  "Web3 Builder",
  "Co-Founder",
  "Photographer & Videographer",
  "UI/UX Tinkerer",
  "Hackathon Competitor",
  "Open-Source Author",
  "Community Volunteer",
];

// ─── Click-to-shatter name ────────────────────────────────────────────────────
function ShatterName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [key, setKey] = useState(0); // remount to reset

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
        // Reassemble
        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.8 },
          { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.8)" },
        );
        setKey((k) => k + 1);
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
      className="text-gradient block cursor-pointer select-none"
      style={{ perspective: 600 }}
    >
      {name}
    </span>
  );
}

// ─── Status ticker (live online indicator) ───────────────────────────────────
// function LiveStatus() {
//   return (
//     <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
//       <span className="relative flex h-1.5 w-1.5">
//         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
//         <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
//       </span>
//       Student
//     </span>
//   );
// }

// ─── Section ──────────────────────────────────────────────────────────────────
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [loaderComplete, setLoaderComplete] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.loaderComplete === "true") {
      setLoaderComplete(true);
      return;
    }

    const handleLoaderComplete = () => setLoaderComplete(true);
    window.addEventListener("portfolio-loader-complete", handleLoaderComplete);

    return () => {
      window.removeEventListener("portfolio-loader-complete", handleLoaderComplete);
    };
  }, []);

  useGSAP(
    () => {
      if (!loaderComplete) return;

      registerGsapPlugins();
      gsap.set(sectionRef.current, { autoAlpha: 1 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-hero='name']",    { autoAlpha: 0, scale: 0.85, y: 40, duration: 0.8, ease: "back.out(1.6)" });
      tl.from("[data-hero='role']",    { autoAlpha: 0, y: 16, duration: 0.55 }, "-=0.3");
      tl.from("[data-hero='tagline']", { autoAlpha: 0, y: 12, duration: 0.4 }, "-=0.25");
      tl.from("[data-hero='copy']",    { autoAlpha: 0, y: 18, duration: 0.6 }, "-=0.35");
      tl.from("[data-hero='actions'] > *", {
        autoAlpha: 0, y: 16, scale: 0.9,
        stagger: 0.08, duration: 0.55, ease: "back.out(1.5)",
      }, "-=0.4");
      tl.from("[data-hero='meta']",    { autoAlpha: 0, y: 12, duration: 0.5 }, "-=0.3");

      // Scroll parallax
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top", end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          gsap.to("[data-hero-content]", { y: self.progress * 90, ease: "none", duration: 0 });
        },
      });
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top", end: "bottom top",
        scrub: 2,
        onUpdate: (self) => {
          gsap.to("[data-hero-bg]", { y: self.progress * 40, ease: "none", duration: 0 });
        },
      });
    },
    { dependencies: [loaderComplete], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh items-center overflow-hidden pt-(--header-height)"
      style={{ visibility: "hidden" }}
    >
      <div data-hero-bg className="absolute inset-0">
        <AnimatedBackground />
      </div>

      <Container className="relative z-10 py-20 md:py-28" data-hero-content="">
        <div className="max-w-3xl">
            {/* Name — click to shatter */}
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              <span data-hero="name">
                <ShatterName name={siteConfig.name} />
              </span>

              {/* Typewriter role line */}
              <span
                data-hero="role"
                className="mt-1 block text-2xl font-normal text-[var(--blue-300)] sm:text-3xl md:text-4xl"
              >
                <TypewriterCycle phrases={ROLES} className="font-[family-name:var(--font-syne)]" />
              </span>

              {/* Tagline */}
              <span data-hero="tagline" className="mt-2 block text-sm text-white/50 font-light tracking-wide">
                {siteConfig.headline}
              </span>

            </h1>

            <p
              data-hero="copy"
              className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base"
            >
              {siteConfig.description}
            </p>

            <div data-hero="actions" className="mt-4 flex flex-wrap items-center gap-3">
              <MagneticButton>
                <RippleButton>
                  <Button href="/#projects">
                    View projects <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </RippleButton>
              </MagneticButton>
              <MagneticButton>
                <RippleButton>
                  <Button href="/photography" variant="secondary">Photography</Button>
                </RippleButton>
              </MagneticButton>
            </div>

            <div data-hero="meta" className="mt-6">
              <SocialLinks links={socialGroups.personal} />
            </div>
          </div>
      </Container>
    </section>
  );
}
