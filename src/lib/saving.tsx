"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type SavingMeta = {
  cancelAction?: (() => void) | null;
  completedCount?: number | null;
  estimatedRemainingMs?: number | null;
  progressPercent?: number | null;
  totalCount?: number | null;
};

type SavingTask = {
  cancelAction: (() => void) | null;
  completedCount: number | null;
  estimatedRemainingMs: number | null;
  id: string;
  progressPercent: number | null;
  savingLabel: string | null;
  totalCount: number | null;
};

type SavingContextValue = {
  setSaving: (v: boolean, label?: string | null, meta?: SavingMeta, id?: string) => void;
  tasks: SavingTask[];
};

type ScopedSavingValue = {
  cancelSaving: (() => void) | null;
  canCancel: boolean;
  completedCount: number | null;
  estimatedRemainingMs: number | null;
  isSaving: boolean;
  progressPercent: number | null;
  savingLabel: string | null;
  setSaving: (v: boolean, label?: string | null, meta?: SavingMeta, id?: string) => void;
  totalCount: number | null;
  tasks: SavingTask[];
};

const DEFAULT_SAVING_KEY = "global";

const SavingContext = createContext<SavingContextValue | null>(null);
const SavingScopeContext = createContext<string | null>(null);

export function SavingProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<SavingTask[]>([]);

  const setSaving = useCallback((v: boolean, label?: string | null, meta?: SavingMeta, id?: string) => {
    const taskId = id ?? DEFAULT_SAVING_KEY;

    setTasks((current) => {
      if (!v) {
        return current.filter((task) => task.id !== taskId);
      }

      const nextTask: SavingTask = {
        cancelAction: meta?.cancelAction ?? null,
        completedCount: meta?.completedCount ?? null,
        estimatedRemainingMs: meta?.estimatedRemainingMs ?? null,
        id: taskId,
        progressPercent: meta?.progressPercent ?? null,
        savingLabel: label ?? null,
        totalCount: meta?.totalCount ?? null,
      };

      const existingIndex = current.findIndex((task) => task.id === taskId);
      if (existingIndex === -1) {
        return [...current, nextTask];
      }

      return current.map((task, index) => (index === existingIndex ? nextTask : task));
    });
  }, []);

  return <SavingContext.Provider value={{ setSaving, tasks }}>{children}</SavingContext.Provider>;
}

export function SavingScopeProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  return <SavingScopeContext.Provider value={value}>{children}</SavingScopeContext.Provider>;
}

export function useSaving(scopeOverride?: string): ScopedSavingValue {
  const ctx = useContext(SavingContext);
  const scopedValue = useContext(SavingScopeContext);

  if (!ctx) throw new Error("useSaving must be used within SavingProvider");

  const { setSaving: setSavingTask, tasks } = ctx;

  const activeScope = scopeOverride ?? scopedValue ?? DEFAULT_SAVING_KEY;
  const activeTask = tasks.find((task) => task.id === activeScope) ?? null;

  const scopedSetSaving = useCallback(
    (v: boolean, label?: string | null, meta?: SavingMeta, id?: string) => {
      setSavingTask(v, label, meta, id ?? activeScope);
    },
    [activeScope, setSavingTask],
  );

  return useMemo(
    () => ({
      cancelSaving: activeTask?.cancelAction ?? null,
      canCancel: Boolean(activeTask?.cancelAction),
      completedCount: activeTask?.completedCount ?? null,
      estimatedRemainingMs: activeTask?.estimatedRemainingMs ?? null,
      isSaving: Boolean(activeTask),
      progressPercent: activeTask?.progressPercent ?? null,
      savingLabel: activeTask?.savingLabel ?? null,
      setSaving: scopedSetSaving,
      tasks,
      totalCount: activeTask?.totalCount ?? null,
    }),
    [activeTask, scopedSetSaving, tasks],
  );
}
