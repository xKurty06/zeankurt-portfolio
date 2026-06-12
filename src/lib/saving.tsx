"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type SavingContextValue = {
  isSaving: boolean;
  setSaving: (v: boolean) => void;
};

const SavingContext = createContext<SavingContextValue | null>(null);

export function SavingProvider({ children }: { children: React.ReactNode }) {
  const [isSaving, setIsSaving] = useState(false);

  const setSaving = useCallback((v: boolean) => setIsSaving(v), []);

  useEffect(() => {
    const onSubmit = (e: Event) => {
      // Any form submit in the admin area will set global saving state
      setIsSaving(true);
    };

    const onReset = () => setIsSaving(false);

    const onVisibility = () => {
      if (document.visibilityState === "visible") setIsSaving(false);
    };

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("reset", onReset, true);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("reset", onReset, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <SavingContext.Provider value={{ isSaving, setSaving }}>{children}</SavingContext.Provider>;
}

export function useSaving() {
  const ctx = useContext(SavingContext);
  if (!ctx) throw new Error("useSaving must be used within SavingProvider");
  return ctx;
}
