"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function removeHashFromUrl() {
    const url = new URL(window.location.href);

    if (!url.hash) return;

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function GlobalScrollManager() {
    const pathname = usePathname();

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
                // Let the browser or custom nav finish scrolling to the section first,
                // then clean the URL so refresh does not reopen the same section.
                hashTimer = setTimeout(() => {
                    removeHashFromUrl();
                }, 700);

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

        window.addEventListener("hashchange", handleScrollBehavior);

        return () => {
            clearHashTimer();
            window.removeEventListener("hashchange", handleScrollBehavior);
            window.history.scrollRestoration = previousScrollRestoration;
        };
    }, [pathname]);

    return null;
}