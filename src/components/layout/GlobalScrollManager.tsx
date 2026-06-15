"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function removeHashFromUrl() {
    const url = new URL(window.location.href);

    if (!url.hash) return;

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function GlobalScrollManager() {
    const pathname = usePathname();
    const hasHandledInitialLoadRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const previousScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";

        let hashTimer: ReturnType<typeof setTimeout> | null = null;

        const clearHashTimer = () => {
            if (hashTimer) {
                clearTimeout(hashTimer);
                hashTimer = null;
            }
        };

        const handleScrollBehavior = () => {
            clearHashTimer();

            const url = new URL(window.location.href);
            const isAdminPage = pathname?.startsWith("/admin");
            const isInitialLoad = !hasHandledInitialLoadRef.current;

            if (isAdminPage) {
                if (url.hash) {
                    removeHashFromUrl();
                }

                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "auto",
                    });
                });

                return;
            }

            if (url.hash) {
                // Only clear hash on the initial document load/refresh.
                // During in-app navigation we keep the hash so section state stays stable.
                if (isInitialLoad) {
                    hashTimer = setTimeout(() => {
                        removeHashFromUrl();
                    }, 700);
                }

                return;
            }

            requestAnimationFrame(() => {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "auto",
                });
            });
        };

        handleScrollBehavior();
        hasHandledInitialLoadRef.current = true;

        return () => {
            clearHashTimer();
            window.history.scrollRestoration = previousScrollRestoration;
        };
    }, [pathname]);

    return null;
}
