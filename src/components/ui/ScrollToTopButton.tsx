"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";

export function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const updateVisibility = () => {
            setVisible(window.scrollY > 520);
        };

        updateVisibility();

        window.addEventListener("scroll", updateVisibility, { passive: true });

        return () => {
            window.removeEventListener("scroll", updateVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            type="button"
            aria-label="Scroll to top"
            title="Scroll to top"
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+0.85rem)] right-[max(1rem,env(safe-area-inset-right))] z-40 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,14,28,0.72)] text-[var(--foreground-muted)] shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[rgba(20,31,50,0.95)] hover:text-white hover:shadow-[0_0_16px_var(--accent-glow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:h-12 sm:w-12",
                visible
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
            )}
        >
            <ArrowUp className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" />
        </button>
    );
}
