"use client";

import { useEffect, useState } from "react";

const LOW_MOTION_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(pointer: coarse)",
  "(max-width: 767px)",
] as const;

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

function getConnection() {
  const nav = navigator as NavigatorWithConnection;

  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

function hasLowPowerHints() {
  const connection = getConnection();
  const cores = navigator.hardwareConcurrency ?? 8;

  const saveData = Boolean(connection?.saveData);
  const slowNetwork =
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "3g";

  return cores <= 4 || saveData || slowNetwork;
}

export function useLowMotionDevice() {
  const [isLowMotionDevice, setIsLowMotionDevice] = useState(false);

  useEffect(() => {
    const mediaQueries = LOW_MOTION_QUERIES.map((query) => window.matchMedia(query));

    const updatePreference = () => {
      const matchesMediaQuery = mediaQueries.some((mediaQuery) => mediaQuery.matches);

      setIsLowMotionDevice(matchesMediaQuery || hasLowPowerHints());
    };

    updatePreference();

    mediaQueries.forEach((mediaQuery) => {
      mediaQuery.addEventListener("change", updatePreference);
    });

    return () => {
      mediaQueries.forEach((mediaQuery) => {
        mediaQuery.removeEventListener("change", updatePreference);
      });
    };
  }, []);

  return isLowMotionDevice;
}