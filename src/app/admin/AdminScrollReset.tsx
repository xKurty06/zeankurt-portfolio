"use client";

import { useEffect } from "react";

export function AdminScrollReset() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const previousScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";

        const url = new URL(window.location.href);

        if (url.hash) {
            window.history.replaceState(null, "", `${url.pathname}${url.search}`);
        }

        requestAnimationFrame(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "auto",
            });
        });

        return () => {
            window.history.scrollRestoration = previousScrollRestoration;
        };
    }, []);

    return null;
}