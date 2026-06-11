"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

export function registerGsapPlugins() {
  if (registered || typeof window === "undefined") return;
  // Register only real GSAP plugins. `useGSAP` is a React hook, not a GSAP plugin,
  // and registering it causes runtime errors when GSAP expects plugin internals.
  try {
    gsap.registerPlugin(ScrollTrigger, SplitText);
  } catch (err) {
    // In some dev environments registration may fail; avoid crashing the app.
    // eslint-disable-next-line no-console
    console.warn("GSAP plugin registration failed:", err);
  }
  registered = true;
}

export function GsapInit() {
  useEffect(() => {
    registerGsapPlugins();
  }, []);

  return null;
}

export { gsap, ScrollTrigger, SplitText };
