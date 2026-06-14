"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PageLoader } from "@/components/animation/PageLoader";

/** Shows the PageLoader on every visit with no session storage. */
export function LoaderWrapper() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);
  const restoreScrollRef = useRef<() => void>(() => {});
  const completedRef = useRef(false);
  const isAdminRoute = pathname?.startsWith("/admin");

  const shouldSkipLoader = () => false;

  const completeLoader = useCallback(() => {
    if (completedRef.current) return;

    completedRef.current = true;
    restoreScrollRef.current();
    document.documentElement.dataset.loaderComplete = "true";
    window.dispatchEvent(new Event("portfolio-loader-complete"));
    setShow(false);
  }, []);

  useEffect(() => {
    if (isAdminRoute) {
      setShow(false);
      return;
    }

    if (shouldSkipLoader()) {
      completeLoader();
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    restoreScrollRef.current = () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      window.history.scrollRestoration = previousScrollRestoration;
    };

    const fallback = window.setTimeout(() => {
      completeLoader();
    }, 4500);

    return () => {
      window.clearTimeout(fallback);
      restoreScrollRef.current();
    };
  }, [completeLoader, isAdminRoute]);

  if (!show) return null;

  return (
    <PageLoader
      onComplete={completeLoader}
    />
  );
}
