"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

/**
 * Custom cursor: a small dot + a larger lagging ring.
 * GSAP controls x/y position; xPercent/yPercent handle the -50% centering
 * offset so the two never conflict.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!portalEl) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerGsapPlugins();

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;


    // Place both at center-screen initially and make them visible.
    // xPercent/yPercent tell GSAP to offset by -50% of the element's own size —
    // this replaces the inline transform: translate(-50%,-50%) so GSAP never
    // stomps on it when animating x/y.
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;

    gsap.set([dot, ring], {
      xPercent: -50,
      yPercent: -50,
      x: startX,
      y: startY,
      autoAlpha: 1,
    });

    const onMove = (e: MouseEvent) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.06, ease: "none",       overwrite: "auto" });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.2,  ease: "power2.out", overwrite: "auto" });
    };

    const onEnterInteractive = () => {
      gsap.to(ring, { scale: 1.8, borderColor: "rgba(72,202,228,0.9)", duration: 0.25, ease: "power2.out" });
      gsap.to(dot,  { scale: 0.4, duration: 0.25, ease: "power2.out" });
    };
    const onLeaveInteractive = () => {
      gsap.to(ring, { scale: 1, borderColor: "rgba(0,180,216,0.5)", duration: 0.35, ease: "elastic.out(1,0.6)" });
      gsap.to(dot,  { scale: 1, duration: 0.35, ease: "elastic.out(1,0.6)" });
    };

    const onClickDown = () => gsap.to(ring, { scale: 0.7, duration: 0.12, ease: "power3.out" });
    const onClickUp   = () => gsap.to(ring, { scale: 1,   duration: 0.4,  ease: "elastic.out(1.2,0.5)" });

    const interactiveSelectors = "a, button, [data-interactive], input, textarea, select, label";

    const attachInteractive = () => {
      document.querySelectorAll<HTMLElement>(interactiveSelectors).forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
    };

    attachInteractive();

    const observer = new MutationObserver(attachInteractive);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onClickDown);
    window.addEventListener("mouseup",   onClickUp);
    document.documentElement.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onClickDown);
      window.removeEventListener("mouseup",   onClickUp);
      observer.disconnect();
      document.documentElement.style.cursor = "";
      // portal cleanup handled by useLayoutEffect return
    };
  }, [portalEl]);

  const content = (
    <>
      {/* Dot — 8px solid circle */}
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full"
        style={{
          width: 8,
          height: 8,
          background: "rgba(0,180,216,1)",
          opacity: 0,
          willChange: "transform",
        }}
      />
      {/* Ring — 36px border circle, lags behind */}
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 z-[9998] pointer-events-none rounded-full"
        style={{
          width: 36,
          height: 36,
          border: "1.5px solid rgba(0,180,216,0.5)",
          opacity: 0,
          willChange: "transform",
        }}
      />
    </>
  );

  // Create portal container during layout so the portal and its children
  // are mounted before effects run — this ensures refs are populated.
  useLayoutEffect(() => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      try { document.body.removeChild(el); } catch {}
      setPortalEl(null);
    };
  }, []);

  // Only render portal once container exists
  return portalEl ? createPortal(content, portalEl) : null;
}
