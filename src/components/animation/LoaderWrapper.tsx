"use client";

import { useEffect, useRef, useState } from "react";
import { PageLoader } from "@/components/animation/PageLoader";

/** Shows the PageLoader on every visit with no session storage. */
export function LoaderWrapper() {
  const [show, setShow] = useState(true);
  const restoreScrollRef = useRef<() => void>(() => {});

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    restoreScrollRef.current = () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      window.history.scrollRestoration = previousScrollRestoration;
    };

    return () => restoreScrollRef.current();
  }, []);

  if (!show) return null;

  return (
    <PageLoader
      onComplete={() => {
        restoreScrollRef.current();
        document.documentElement.dataset.loaderComplete = "true";
        window.dispatchEvent(new Event("portfolio-loader-complete"));
        setShow(false);
      }}
    />
  );
}
