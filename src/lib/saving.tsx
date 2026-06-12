"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type SavingMeta = {
  completedCount?: number | null;
  progressPercent?: number | null;
  totalCount?: number | null;
};

type SavingContextValue = {
  completedCount: number | null;
  isSaving: boolean;
  progressPercent: number | null;
  savingLabel: string | null;
  setSaving: (v: boolean, label?: string | null, meta?: SavingMeta) => void;
  totalCount: number | null;
};

const SavingContext = createContext<SavingContextValue | null>(null);

export function SavingProvider({ children }: { children: React.ReactNode }) {
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [savingLabel, setSavingLabel] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const setSaving = useCallback((v: boolean, label?: string | null, meta?: SavingMeta) => {
    setIsSaving(v);
    setSavingLabel(v ? (label ?? null) : null);
    setProgressPercent(v ? (meta?.progressPercent ?? null) : null);
    setCompletedCount(v ? (meta?.completedCount ?? null) : null);
    setTotalCount(v ? (meta?.totalCount ?? null) : null);
  }, []);

  return (
    <SavingContext.Provider
      value={{ completedCount, isSaving, progressPercent, savingLabel, setSaving, totalCount }}
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
