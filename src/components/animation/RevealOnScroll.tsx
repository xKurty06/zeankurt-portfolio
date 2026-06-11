"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** Animation variant */
  variant?: "fade-up" | "clip-wipe" | "scale-in" | "slide-left";
}

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  y = 40,
  variant = "fade-up",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();
      const el = ref.current;
      if (!el) return;

      const trigger = {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none reverse",
      };

      if (variant === "clip-wipe") {
        gsap.fromTo(
          el,
          {
            clipPath: "inset(0 100% 0 0)",
            autoAlpha: 0,
          },
          {
            clipPath: "inset(0 0% 0 0)",
            autoAlpha: 1,
            duration: 0.9,
            delay,
            ease: "expo.out",
            scrollTrigger: trigger,
          },
        );
      } else if (variant === "scale-in") {
        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.88, y: 20 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.85,
            delay,
            ease: "back.out(1.4)",
            scrollTrigger: trigger,
          },
        );
      } else if (variant === "slide-left") {
        gsap.fromTo(
          el,
          { autoAlpha: 0, x: -50 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
            delay,
            ease: "power3.out",
            scrollTrigger: trigger,
          },
        );
      } else {
        // Default: cinematic fade-up with slight rotation
        gsap.fromTo(
          el,
          { autoAlpha: 0, y, rotateX: 6 },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            delay,
            ease: "power3.out",
            scrollTrigger: trigger,
          },
        );
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ perspective: 800 }}>
      {children}
    </div>
  );
}
