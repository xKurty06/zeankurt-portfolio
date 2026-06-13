"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

/** Thin progress bar fixed at the very top of the viewport. */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    registerGsapPlugins();

    const bar = barRef.current;
    if (!bar) return;

    const setScaleX = gsap.quickSetter(bar, "scaleX");
    let frame = 0;

    const updateProgress = () => {
      frame = 0;

      const doc = document.documentElement;
      const body = document.body;
      const scrollTop = window.scrollY || doc.scrollTop || body.scrollTop || 0;
      const scrollHeight = Math.max(
        doc.scrollHeight,
        body.scrollHeight,
        doc.offsetHeight,
        body.offsetHeight,
        doc.clientHeight,
      );
      const maxScroll = Math.max(1, scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));

      setScaleX(progress);
    };

    const scheduleUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          scheduleUpdate();
        })
      : null;
    const mutationObserver = typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          scheduleUpdate();
        })
      : null;

    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);
    mutationObserver?.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
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
