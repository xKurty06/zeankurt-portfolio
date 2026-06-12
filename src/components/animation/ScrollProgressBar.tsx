"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsapPlugins, ScrollTrigger } from "@/lib/gsap";

/** Thin progress bar fixed at the very top of the viewport. */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    registerGsapPlugins();

    const bar = barRef.current;
    if (!bar) return;

    // Use a quickSetter for scaleX to avoid repeated style object allocation.
    const setScaleX = gsap.quickSetter(bar, "scaleX");
    const trigger = ScrollTrigger.create({
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setScaleX(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed inset-x-0 top-0 z-[9997] h-[2px] origin-left scroll-progress-bar"
      style={{
        transform: "scaleX(0)",
        transformOrigin: "left center",
      }}
    />
  );
}
