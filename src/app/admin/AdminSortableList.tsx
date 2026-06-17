"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownAZ,
  ArrowDownZA,
  Check,
  ChevronDown,
  GripVertical,
  Save,
  Star,
} from "lucide-react";
import { updateSortOrder } from "@/app/admin/actions";
import { cn } from "@/lib/cn";

type SortableTable =
  | "projects"
  | "experience_items"
  | "certifications"
  | "events"
  | "skill_categories"
  | "creative_categories"
  | "creative_photos";

type SortDirection = "asc" | "desc";
type SortField =
  | "custom"
  | "name"
  | "date"
  | "year"
  | "issuer"
  | "venue"
  | "featured";
type DropPosition = "before" | "after";

interface SortOption {
  label: string;
  value: SortField;
}

interface SortableItem {
  id: string;
  anchorId?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  actions: React.ReactNode;
  featured?: boolean;
  sortOrder: number;
  sortValues: Partial<Record<SortField, string | number | boolean | null>>;
}

interface AdminSortableListProps {
  items: SortableItem[];
  table: SortableTable;
  sortOptions: SortOption[];
}

function hasSameOrder(a: SortableItem[], b: SortableItem[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index]?.id);
}

function toSortableNumber(value: string | number | boolean | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "boolean") {
    return Number(value);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareValues(
  a: SortableItem,
  b: SortableItem,
  field: SortField,
  direction: SortDirection,
) {
  const modifier = direction === "asc" ? 1 : -1;

  if (field === "custom") {
    return (a.sortOrder - b.sortOrder) * modifier;
  }

  const aValue = a.sortValues[field];
  const bValue = b.sortValues[field];

  if (typeof aValue === "boolean" || typeof bValue === "boolean") {
    return (Number(Boolean(aValue)) - Number(Boolean(bValue))) * modifier;
  }

  if (field === "date" || field === "year") {
    const aTime = toSortableNumber(aValue);
    const bTime = toSortableNumber(bValue);
    return (aTime - bTime) * modifier;
  }

  return String(aValue ?? "").localeCompare(String(bValue ?? "")) * modifier;
}

function getSortedItems(
  sourceItems: SortableItem[],
  field: SortField,
  direction: SortDirection,
) {
  return [...sourceItems].sort((a, b) => compareValues(a, b, field, direction));
}

function getProjectStatusMeta(status?: string) {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "live") {
    return {
      label: "Live",
      className:
        "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (normalized === "wip") {
    return {
      label: "WIP",
      className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    };
  }

  if (normalized === "archived") {
    return {
      label: "Archived",
      className:
        "border-white/10 bg-white/[0.05] text-[var(--foreground-muted)]",
    };
  }

  if (normalized) {
    return {
      label: normalized,
      className:
        "border-[var(--blue-400)]/30 bg-[var(--accent-soft)] text-[var(--blue-200)]",
    };
  }

  return null;
}

export function AdminSortableList({
  items,
  table,
  sortOptions,
}: AdminSortableListProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState(items);
  const [sortField, setSortField] = useState<SortField>("custom");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: DropPosition;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const activeSortLabel =
    sortOptions.find((option) => option.value === sortField)?.label ?? "Custom";

  useEffect(() => {
    setOrderedItems(items);
    setDraggedId(null);
    setDropTarget(null);
    setDirty(false);
    setMenuOpen(false);
    setSaveError(null);
    setSortField("custom");
    setDirection("asc");
  }, [items]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const applySort = (field: SortField, nextDirection = direction) => {
    const nextItems = getSortedItems(items, field, nextDirection);

    setSortField(field);
    setDirection(nextDirection);
    setOrderedItems(nextItems);
    setDirty(!hasSameOrder(nextItems, items));
    setSaveError(null);
  };

  const updateDropTarget = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: string,
  ) => {
    event.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDropTarget(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";

    setDropTarget({
      id: targetId,
      position,
    });
  };

  const moveItem = () => {
    if (!draggedId || !dropTarget || draggedId === dropTarget.id) return;

    setOrderedItems((current) => {
      const next = [...current];
      const from = next.findIndex((item) => item.id === draggedId);

      if (from < 0) return current;

      const [moved] = next.splice(from, 1);
      const targetIndexAfterRemoval = next.findIndex(
        (item) => item.id === dropTarget.id,
      );
      const insertIndex =
        dropTarget.position === "after"
          ? targetIndexAfterRemoval + 1
          : targetIndexAfterRemoval;

      next.splice(insertIndex, 0, moved);
      setDirty(!hasSameOrder(next, items));

      return next;
    });

    setDropTarget(null);
    setSortField("custom");
    setSaveError(null);
  };

  const saveOrder = () => {
    const ids = orderedItems.map((item) => item.id);

    setSaveError(null);

    startTransition(async () => {
      try {
        await updateSortOrder({
          table,
          ids,
        });

        setOrderedItems((current) =>
          current.map((item, index) => ({
            ...item,
            sortOrder: index,
          })),
        );

        setSortField("custom");
        setDirection("asc");
        setDirty(false);
        router.refresh();
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Failed to save the custom order. Please try again.",
        );
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex min-h-11 min-w-32 items-center justify-between gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-medium text-white outline-none transition hover:border-[var(--border-strong)] focus:border-[var(--border-strong)] sm:min-h-9"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              aria-label="Sort field"
            >
              <span>{activeSortLabel}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--blue-300)] transition",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen ? (
              <div
                role="listbox"
                className="absolute left-0 top-11 z-30 w-40 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--background-elevated)] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
              >
                {sortOptions.map((option) => {
                  const selected = option.value === sortField;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        applySort(option.value);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                        selected
                          ? "bg-[var(--accent-soft)] text-white"
                          : "text-[var(--foreground-muted)] hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      {option.label}
                      {selected ? (
                        <Check className="h-3.5 w-3.5 text-[var(--blue-300)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              const nextDirection = direction === "asc" ? "desc" : "asc";
              applySort(sortField, nextDirection);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:h-9 sm:w-9"
            aria-label={`Sort ${direction === "asc" ? "descending" : "ascending"}`}
            title={direction === "asc" ? "Ascending" : "Descending"}
          >
            {direction === "asc" ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowDownZA className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={saveOrder}
          disabled={!dirty || isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Save className="h-3.5 w-3.5" />
          {isPending ? "Saving" : dirty ? "Save custom order" : "Order saved"}
        </button>
      </div>

      {saveError ? (
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {orderedItems.map((item) => {
          const isDropBefore =
            dropTarget?.id === item.id && dropTarget.position === "before";
          const isDropAfter =
            dropTarget?.id === item.id && dropTarget.position === "after";
          const projectStatus = getProjectStatusMeta(item.status);

          return (
            <div
              key={item.id}
              id={item.anchorId}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTarget(null);
              }}
              onDragOver={(event) => updateDropTarget(event, item.id)}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setDropTarget((current) =>
                    current?.id === item.id ? null : current,
                  );
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                moveItem();
              }}
              className={cn(
                "relative flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-4 transition md:flex-row md:items-center md:justify-between",
                draggedId === item.id &&
                  "border-[var(--border-strong)] bg-white/[0.04] opacity-70",
              )}
            >
              {isDropBefore ? (
                <span className="pointer-events-none absolute inset-x-3 -top-2 h-0.5 rounded-full bg-[var(--blue-300)] shadow-[0_0_16px_rgba(72,202,228,0.75)]" />
              ) : null}

              {isDropAfter ? (
                <span className="pointer-events-none absolute inset-x-3 -bottom-2 h-0.5 rounded-full bg-[var(--blue-300)] shadow-[0_0_16px_rgba(72,202,228,0.75)]" />
              ) : null}

              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 inline-flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] active:cursor-grabbing sm:h-8 sm:w-8"
                  aria-label={`Drag ${item.title}`}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.title}
                    </p>

                    {projectStatus ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          projectStatus.className,
                        )}
                      >
                        {projectStatus.label}
                      </span>
                    ) : null}

                    {item.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--blue-400)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--blue-200)]">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--foreground-muted)]">
                    {item.subtitle ? <span>{item.subtitle}</span> : null}
                    {item.meta ? <span>{item.meta}</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {item.actions}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
