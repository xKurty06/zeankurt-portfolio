"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type SavingMeta = {
  cancelAction?: (() => void) | null;
  completedCount?: number | null;
  progressPercent?: number | null;
  totalCount?: number | null;
};

type SavingContextValue = {
  cancelSaving: (() => void) | null;
  canCancel: boolean;
  completedCount: number | null;
  isSaving: boolean;
  progressPercent: number | null;
  savingLabel: string | null;
  setSaving: (v: boolean, label?: string | null, meta?: SavingMeta) => void;
  totalCount: number | null;
};

const SavingContext = createContext<SavingContextValue | null>(null);

export function SavingProvider({ children }: { children: React.ReactNode }) {
  const [cancelAction, setCancelAction] = useState<(() => void) | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [savingLabel, setSavingLabel] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const setSaving = useCallback((v: boolean, label?: string | null, meta?: SavingMeta) => {
    setIsSaving(v);
    setCancelAction(v ? (meta?.cancelAction ?? null) : null);
    setSavingLabel(v ? (label ?? null) : null);
    setProgressPercent(v ? (meta?.progressPercent ?? null) : null);
    setCompletedCount(v ? (meta?.completedCount ?? null) : null);
    setTotalCount(v ? (meta?.totalCount ?? null) : null);
  }, []);

  const cancelSaving = cancelAction
    ? () => {
        cancelAction();
      }
    : null;

  return (
    <SavingContext.Provider
      value={{
        cancelSaving,
        canCancel: Boolean(cancelAction),
        completedCount,
        isSaving,
        progressPercent,
        savingLabel,
        setSaving,
        totalCount,
      }}
    >
      {children}
    </SavingContext.Provider>
  );
}

export function useSaving() {
  const ctx = useContext(SavingContext);
  if (!ctx) throw new Error("useSaving must be used within SavingProvider");
  return ctx;
}
