"use client";

import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "mobile-viewing-tip-dismissed";
const APPEAR_DELAY_MS = 1800;
const AUTO_HIDE_DELAY_MS = 7000;
let hasShownThisPageLoad = false;

export function MobileViewingTip() {
  const pathname = usePathname() ?? "";
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsVisible(false);

    if (pathname.startsWith("/admin")) {
      return;
    }

    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "true") {
        return;
      }
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }

    if (hasShownThisPageLoad) {
      return;
    }

    let autoHideTimer: number | undefined;
    let appearTimer: number | undefined;

    const startTipTimers = () => {
      if (appearTimer !== undefined) return;

      appearTimer = window.setTimeout(() => {
        hasShownThisPageLoad = true;
        setIsVisible(true);

        autoHideTimer = window.setTimeout(() => {
          setIsVisible(false);
        }, AUTO_HIDE_DELAY_MS);
      }, APPEAR_DELAY_MS);
    };

    if (document.documentElement.dataset.loaderComplete === "true") {
      startTipTimers();
    } else {
      window.addEventListener("portfolio-loader-complete", startTipTimers, { once: true });
    }

    return () => {
      window.removeEventListener("portfolio-loader-complete", startTipTimers);

      if (appearTimer !== undefined) {
        window.clearTimeout(appearTimer);
      }

      if (autoHideTimer !== undefined) {
        window.clearTimeout(autoHideTimer);
      }
    };
  }, [pathname]);

  const dismissTip = () => {
    setIsVisible(false);

    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Non-persistent dismissal is acceptable when sessionStorage is blocked.
    }
  };

  if (!isMounted || pathname.startsWith("/admin")) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+0.75rem)] z-[45] flex justify-center px-3 pr-[4.75rem] md:hidden",
        "motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
      aria-hidden={!isVisible}
    >
      <div
        role="status"
        className={cn(
          "flex max-w-[22rem] items-start gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(8,14,28,0.78)] px-3.5 py-3 text-left text-[var(--foreground)] shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl",
          isVisible ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <span className="inline-flex h-8 w-8 shrink-0 self-center items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--blue-200)]">
          <Monitor className="h-4 w-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="emphasis-glow-gold text-[0.68rem] font-medium uppercase tracking-[0.14em]">
            Quick tip
          </p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--foreground-muted)]">
            Website is optimized for mobile. Best viewed on desktop for the full experience.
          </p>
        </div>

        <button
          type="button"
          aria-label="Dismiss mobile viewing tip"
          onClick={dismissTip}
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--foreground-muted)] transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
