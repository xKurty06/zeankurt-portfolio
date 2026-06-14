"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface AdminCollapsibleSectionProps {
  id: string;
  title: string;
  count?: number;
  addDialog?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminCollapsibleSection({
  id,
  title,
  count,
  addDialog,
  children,
}: AdminCollapsibleSectionProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const syncWithHash = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true);
      }
    };

    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);
    return () => window.removeEventListener("hashchange", syncWithHash);
  }, [id]);

  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-3xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 sm:p-6"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={`${id}-content`}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="break-words font-[family-name:var(--font-syne)] text-lg font-semibold text-white sm:text-xl">
            {title}
          </span>
          {count !== undefined ? (
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground-muted)]">
              {count} {count === 1 ? "record" : "records"}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition duration-300 sm:h-9 sm:w-9",
            open && "border-[var(--border-strong)] text-white rotate-180",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-content`}
            key="content"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0, y: -6 }}
            animate={prefersReducedMotion ? { height: "auto", opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, y: -6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex flex-col gap-4 border-t border-[var(--border)] pt-5">
              {addDialog ? <div className="flex flex-wrap items-center justify-end gap-3">{addDialog}</div> : null}
              <div className="flex flex-col gap-3">{children}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
