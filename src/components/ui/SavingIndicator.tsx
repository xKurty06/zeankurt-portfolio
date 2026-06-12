"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Upload, X } from "lucide-react";
import { useSaving } from "@/lib/saving";

export function SavingIndicator() {
  const { cancelSaving, canCancel, completedCount, isSaving, progressPercent, savingLabel, totalCount } = useSaving();
  const isUpload = (savingLabel ?? "").toLowerCase().includes("upload");
  const hasProgress = isUpload && typeof progressPercent === "number" && typeof totalCount === "number";

  return (
    <AnimatePresence>
      {isSaving ? (
        <motion.aside
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 right-5 z-[1200] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(10,16,30,0.96),rgba(7,11,22,0.96))] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--blue-400)]/20 bg-[var(--accent-soft)] text-[var(--blue-200)]">
              {isUpload ? <Upload className="h-4 w-4" /> : <LoaderCircle className="h-4 w-4 animate-spin" />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  {isUpload ? "Upload in progress" : "Saving in progress"}
                </p>
                {hasProgress ? (
                  <span className="rounded-full border border-[var(--blue-400)]/20 bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-200)]">
                    {progressPercent}%
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
                {savingLabel ?? "Please wait for the current action to finish."}
              </p>
              {hasProgress ? (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--blue-500),var(--blue-300))]"
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--foreground-muted)]">
                    {Math.min(completedCount ?? 0, totalCount)} of {totalCount} uploaded
                  </p>
                </>
              ) : null}
              {isUpload ? (
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--blue-300)]">
                  Safe to close the modal
                </p>
              ) : null}
              {isUpload && canCancel && cancelSaving ? (
                <button
                  type="button"
                  onClick={cancelSaving}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel upload
                </button>
              ) : null}
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
