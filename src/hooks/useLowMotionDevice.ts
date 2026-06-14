"use client";

import { useEffect, useState } from "react";

const LOW_MOTION_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(pointer: coarse)",
  "(max-width: 767px)",
] as const;

export function useLowMotionDevice() {
  // Keep the initial render SSR-stable and resolve media-query state after mount.
  const [isLowMotionDevice, setIsLowMotionDevice] = useState(false);

  useEffect(() => {
    const mediaQueries = LOW_MOTION_QUERIES.map((query) => window.matchMedia(query));
    const updatePreference = () => {
      setIsLowMotionDevice(mediaQueries.some((mediaQuery) => mediaQuery.matches));
    };

    updatePreference();
    mediaQueries.forEach((mediaQuery) => mediaQuery.addEventListener("change", updatePreference));

    return () => {
      mediaQueries.forEach((mediaQuery) => mediaQuery.removeEventListener("change", updatePreference));
    };
  }, []);

  return isLowMotionDevice;
}
