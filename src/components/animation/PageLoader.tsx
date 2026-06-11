"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

export function PageLoader({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    registerGsapPlugins();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = { value: 0 };
    const tl = gsap.timeline();

    gsap.set(contentRef.current, { autoAlpha: 0, y: 18 });
    gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(glowRef.current, { scale: 0.92, autoAlpha: 0.45 });

    tl.to(contentRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.55,
      ease: "power3.out",
    });

    tl.to(glowRef.current, {
      scale: 1,
      autoAlpha: 0.9,
      duration: reduceMotion ? 0.01 : 1.2,
      ease: "sine.inOut",
    }, "<");

    tl.to(progress, {
      value: 100,
      duration: reduceMotion ? 0.01 : 2.1,
      ease: "power2.inOut",
      onUpdate() {
        setPct(Math.round(progress.value));
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: progress.value / 100 });
        }
      },
    }, reduceMotion ? ">" : "-=0.25");

    tl.to(contentRef.current, {
      autoAlpha: 0,
      y: reduceMotion ? 0 : -14,
      duration: reduceMotion ? 0.01 : 0.34,
      ease: "power2.in",
    });

    tl.to(overlayRef.current, {
      autoAlpha: 0,
      duration: reduceMotion ? 0.01 : 0.46,
      ease: "power3.inOut",
      onComplete,
    }, "<0.08");

    return () => {
      tl.kill();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9990] grid place-items-center overflow-hidden bg-[var(--background)] px-6 text-[var(--foreground)]"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${pct}%`}
    >
      <div
        ref={glowRef}
        aria-hidden
        className="absolute h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,180,216,0.24) 0%, rgba(2,62,138,0.12) 42%, transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-200/15 to-transparent"
      />

      <div ref={contentRef} className="relative w-full max-w-[620px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            
          </div>
          <span className="font-mono text-sm text-[var(--foreground-muted)] text-right">
            {pct.toString().padStart(2, "0")}%
          </span>
        </div>

        <div className="overflow-hidden">
          <h2 className="font-display text-[clamp(3.35rem,12vw,8rem)] font-semibold leading-[0.9] text-white">
            Zean
            <span className="block text-gradient">Kurt</span>
          </h2>
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between font-mono text-xs text-[var(--foreground-subtle)]">
            <span>MY PERSONAL PORTFOLIO</span>
            <span>LOADING</span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-cyan-100/10">
            <div
              ref={progressRef}
              className="h-full w-full rounded-full bg-gradient-to-r from-[var(--blue-700)] via-[var(--blue-400)] to-[var(--blue-100)] shadow-[0_0_18px_rgba(72,202,228,0.65)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
