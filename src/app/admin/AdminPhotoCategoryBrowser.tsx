"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Images,
  Search,
  SquarePen,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { deleteCreativePhotosByIds } from "@/app/admin/actions";
import { Lightbox } from "@/components/photography/Lightbox";
import { cn } from "@/lib/cn";
import type { PhotoItem } from "@/types";

type SortField = "custom" | "name" | "featured" | "status";
type SortDirection = "asc" | "desc";
type BrowserMode = "edit" | "select";

interface PhotoBrowserItem {
  aspectRatio: "portrait" | "landscape" | "square";
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  featured?: boolean;
  published?: boolean;
  sortOrder: number;
  imagePath?: string;
  editAction: React.ReactNode;
}

interface PhotoBrowserCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  photoCount: number;
  photos: PhotoBrowserItem[];
}

interface AdminPhotoCategoryBrowserProps {
  categories: PhotoBrowserCategory[];
}

const PAGE_SIZE_OPTIONS = [24, 48, 96];

const SORT_OPTIONS: Array<{ label: string; value: SortField }> = [
  { label: "Custom order", value: "custom" },
  { label: "Name", value: "name" },
  { label: "Featured", value: "featured" },
  { label: "Status", value: "status" },
];

const PAGE_SIZE_DROPDOWN_OPTIONS = PAGE_SIZE_OPTIONS.map((option) => ({
  label: `${option} / page`,
  value: String(option),
}));

function PickerButton<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: {
  ariaLabel: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "group inline-flex min-h-11 items-center gap-3 rounded-full border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.06] sm:min-h-10",
          open &&
          "border-[var(--blue-400)] bg-[var(--accent-soft)]/50 text-[var(--blue-100)] shadow-[0_0_0_1px_rgba(72,202,228,0.25)]",
          className,
        )}
      >
        <span className="whitespace-nowrap">{selected?.label ?? ariaLabel}</span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[var(--blue-300)] transition group-hover:border-white/20">
          <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-30 min-w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(10,16,30,0.98),rgba(7,11,22,0.98))] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition first:mt-0",
                  active
                    ? "bg-[linear-gradient(135deg,rgba(72,202,228,0.2),rgba(0,119,182,0.12))] text-[var(--blue-100)]"
                    : "text-[var(--foreground-muted)] hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <span>{option.label}</span>
                {active ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--blue-400)]/30 bg-[var(--accent-soft)] text-[var(--blue-200)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const PHOTO_GRID_AUTO_ROW_HEIGHT = 4;
const ADMIN_FALLBACK_COLUMN_WIDTH = 220;

interface PhotoGridMetrics {
  columnWidth: number;
  rowGap: number;
}

function getFallbackPhotoBrowserRatio(aspectRatio: PhotoBrowserItem["aspectRatio"]) {
  if (aspectRatio === "portrait") return 3 / 4;
  if (aspectRatio === "square") return 1;

  return 4 / 3;
}

function readPhotoGridMetrics(element: HTMLElement): PhotoGridMetrics {
  const styles = window.getComputedStyle(element);
  const columns = styles.gridTemplateColumns
    .split(" ")
    .filter(Boolean).length;

  const columnCount = Math.max(1, columns);
  const columnGap = Number.parseFloat(styles.columnGap) || 0;
  const rowGap = Number.parseFloat(styles.rowGap) || 0;

  const columnWidth =
    (element.clientWidth - columnGap * (columnCount - 1)) / columnCount;

  return {
    columnWidth: Number.isFinite(columnWidth) && columnWidth > 0
      ? columnWidth
      : ADMIN_FALLBACK_COLUMN_WIDTH,
    rowGap,
  };
}

function getPhotoBrowserRowSpan(
  photo: PhotoBrowserItem,
  imageRatios: Record<string, number>,
  gridMetrics: PhotoGridMetrics,
) {
  const ratio =
    imageRatios[photo.id] ?? getFallbackPhotoBrowserRatio(photo.aspectRatio);

  const targetHeight = gridMetrics.columnWidth / ratio;

  return Math.max(
    4,
    Math.ceil(
      (targetHeight + gridMetrics.rowGap) /
      (PHOTO_GRID_AUTO_ROW_HEIGHT + gridMetrics.rowGap),
    ),
  );
}
function comparePhotoItems(
  a: PhotoBrowserItem,
  b: PhotoBrowserItem,
  field: SortField,
  direction: SortDirection,
) {
  const modifier = direction === "asc" ? 1 : -1;

  if (field === "custom") {
    return (a.sortOrder - b.sortOrder) * modifier;
  }

  if (field === "featured") {
    const result = Number(Boolean(a.featured)) - Number(Boolean(b.featured));
    if (result !== 0) return result * modifier;
  }

  if (field === "status") {
    const result = Number(Boolean(a.published)) - Number(Boolean(b.published));
    if (result !== 0) return result * modifier;
  }

  return a.title.localeCompare(b.title) * modifier;
}

const GRID_AUTO_ROW_HEIGHT = 4;

function PhotoManagerModal({
  category,
  open,
  onClose,
  onCategoryChange,
}: {
  category: PhotoBrowserCategory;
  open: boolean;
  onClose: () => void;
  onCategoryChange: (category: PhotoBrowserCategory) => void;
}) {
  const [mode, setMode] = useState<BrowserMode>("edit");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("custom");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState<number>(24);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);
  const titleId = useId();
  const descriptionId = useId();
  const portalNodeRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const photoGridRef = useRef<HTMLDivElement>(null);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [photoGridMetrics, setPhotoGridMetrics] = useState<PhotoGridMetrics>({
    columnWidth: ADMIN_FALLBACK_COLUMN_WIDTH,
    rowGap: 12,
  });
  const registerImageRatio = useCallback((id: string, width: number, height: number) => {
    if (width <= 0 || height <= 0) return;

    const ratio = width / height;

    setImageRatios((current) => {
      if (Math.abs((current[id] ?? 0) - ratio) < 0.001) {
        return current;
      }

      return {
        ...current,
        [id]: ratio,
      };
    });
  }, []);

  const scrollModalToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      scrollAreaRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior,
      });
    });
  }, []);

  useEffect(() => {
    const portalNode = document.createElement("div");
    portalNode.dataset.adminPhotoManagerPortal = "true";
    portalNodeRef.current = portalNode;
    document.body.appendChild(portalNode);
    setMounted(true);

    return () => {
      portalNode.remove();
      portalNodeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const siblings = Array.from(document.body.children).filter(
      (element) => element !== portalNodeRef.current,
    );

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.querySelector('[data-preview-overlay="true"]')) {
        return;
      }

      if (event.key === "Escape") onClose();
    };

    siblings.forEach((element) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";

      siblings.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      });

      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    setMode("edit");
    setQuery("");
    setSortField("custom");
    setSortDirection("asc");
    setPageSize(24);
    setPage(1);
    setSelectedIds([]);
    setLightboxIndex(null);
    setDeleteError(null);
    setIsDeleting(false);
    setRemovingIds([]);
  }, [category.id, open]);

  const featuredCount = useMemo(
    () => category.photos.filter((photo) => photo.featured).length,
    [category.photos],
  );

  const filteredPhotos = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    const filtered = normalizedQuery
      ? category.photos.filter((photo) => {
        const haystack = `${photo.title} ${photo.subtitle ?? ""} ${photo.meta ?? ""}`.toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      : category.photos;

    return [...filtered].sort((a, b) => comparePhotoItems(a, b, sortField, sortDirection));
  }, [category.photos, deferredQuery, sortDirection, sortField]);

  const lightboxPhotos = useMemo<PhotoItem[]>(
    () =>
      filteredPhotos.map((photo) => ({
        id: photo.id,
        title: photo.title,
        category: category.name,
        albumSlug: category.slug,
        imageSeed: photo.id,
        image: photo.imagePath,
        aspectRatio: photo.aspectRatio,
        featured: photo.featured,
      })),
    [category.name, category.slug, filteredPhotos],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePhotos = filteredPhotos.slice(startIndex, startIndex + pageSize);
  const rangeStart = filteredPhotos.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, filteredPhotos.length);
  useEffect(() => {
    if (!open) return;

    scrollModalToTop("auto");
  }, [currentPage, pageSize, sortField, sortDirection, deferredQuery, open, scrollModalToTop]);

  const allFilteredSelected =
    filteredPhotos.length > 0 && filteredPhotos.every((photo) => selectedIds.includes(photo.id));

  const allVisibleSelected =
    visiblePhotos.length > 0 && visiblePhotos.every((photo) => selectedIds.includes(photo.id));

  useEffect(() => {
    const element = photoGridRef.current;

    if (!open || !element) return;

    const updateGridMetrics = () => {
      const nextMetrics = readPhotoGridMetrics(element);

      setPhotoGridMetrics((current) => {
        const sameColumnWidth =
          Math.abs(current.columnWidth - nextMetrics.columnWidth) < 0.5;
        const sameRowGap = Math.abs(current.rowGap - nextMetrics.rowGap) < 0.5;

        if (sameColumnWidth && sameRowGap) {
          return current;
        }

        return nextMetrics;
      });
    };

    updateGridMetrics();

    const observer = new ResizeObserver(updateGridMetrics);
    observer.observe(element);

    window.addEventListener("resize", updateGridMetrics);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateGridMetrics);
    };
  }, [open, visiblePhotos.length]);
  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleSelectVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visiblePhotos.some((photo) => photo.id === id));
      }

      const next = new Set(current);
      visiblePhotos.forEach((photo) => next.add(photo.id));

      return Array.from(next);
    });
  };

  const handleDeleteSelected = async () => {
    const idsToRemove = selectedIds.filter(Boolean);

    if (idsToRemove.length === 0 || isDeleting) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteCreativePhotosByIds(idsToRemove);

      for (const [index, id] of idsToRemove.entries()) {
        window.setTimeout(() => {
          setRemovingIds((current) => (current.includes(id) ? current : [...current, id]));
        }, index * 55);
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, Math.max(260, idsToRemove.length * 55 + 220)),
      );

      const remainingPhotos = category.photos.filter((photo) => !idsToRemove.includes(photo.id));

      onCategoryChange({
        ...category,
        photoCount: remainingPhotos.length,
        photos: remainingPhotos,
      });

      setSelectedIds((current) => current.filter((id) => !idsToRemove.includes(id)));
      setRemovingIds([]);
    } catch (error) {
      setRemovingIds([]);
      setDeleteError(error instanceof Error ? error.message : "Failed to remove the selected photos.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open || !mounted || !portalNodeRef.current) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(3,7,18,0.82)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[1.25rem] border border-[var(--border-strong)] bg-[var(--background-elevated)] shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={titleId}
                className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white"
              >
                {category.name}
              </h3>

              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                <Images className="h-3 w-3" />
                {category.photoCount} photos
              </span>

              {featuredCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--blue-400)]/30 bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--blue-200)]">
                  <Star className="h-3 w-3 fill-current" />
                  {featuredCount} featured
                </span>
              ) : null}
            </div>

            <p id={descriptionId} className="mt-1 text-sm text-[var(--foreground-muted)]">
              {category.description || `${category.slug} category`} Manage photos in grid view.
            </p>
          </div>

          <button
            type="button"
            aria-label={`Close ${category.name}`}
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)]/70 p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder={`Search ${category.name.toLowerCase()} photos`}
                    className="min-h-11 w-full rounded-full border border-[var(--border)] bg-white/[0.03] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[var(--foreground-muted)] focus:border-[var(--border-strong)] sm:min-h-10"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition sm:min-h-10",
                      mode === "edit"
                        ? "border-[var(--blue-400)] bg-[var(--accent-soft)] text-[var(--blue-200)]"
                        : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
                    )}
                  >
                    <SquarePen className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("select")}
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition sm:min-h-10",
                      mode === "select"
                        ? "border-[var(--blue-400)] bg-[var(--accent-soft)] text-[var(--blue-200)]"
                        : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-white",
                    )}
                  >
                    <Check className="h-4 w-4" />
                    Select
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PickerButton
                  ariaLabel={`Sort ${category.name} photos`}
                  value={sortField}
                  options={SORT_OPTIONS}
                  onChange={(nextValue) => {
                    setSortField(nextValue);
                    setPage(1);

                    if (nextValue === "featured" || nextValue === "status") {
                      setSortDirection("desc");
                    } else if (nextValue === "name") {
                      setSortDirection("asc");
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
                    setPage(1);
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-10"
                >
                  {sortDirection === "asc" ? "Asc" : "Desc"}
                </button>

                <PickerButton
                  ariaLabel={`Items per page for ${category.name}`}
                  value={String(pageSize)}
                  options={PAGE_SIZE_DROPDOWN_OPTIONS}
                  onChange={(nextValue) => {
                    setPageSize(Number(nextValue));
                    setPage(1);
                  }}
                  className="min-w-[8.5rem] justify-between"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">
                Showing {rangeStart}-{rangeEnd} of {filteredPhotos.length}
                {query.trim() ? ` matching ${category.photoCount}` : ""}
              </p>

              {mode === "select" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(filteredPhotos.map((photo) => photo.id))}
                    disabled={filteredPhotos.length === 0 || allFilteredSelected || isDeleting}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
                  >
                    Select all
                  </button>

                  <button
                    type="button"
                    onClick={toggleSelectVisible}
                    disabled={visiblePhotos.length === 0 || isDeleting}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
                  >
                    {allVisibleSelected ? "Clear visible" : "Select visible"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    disabled={selectedIds.length === 0 || isDeleting}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
                  >
                    Clear all
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.length === 0 || isDeleting}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-red-400/20 px-4 text-xs font-medium text-red-200 transition enabled:hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Removing..." : `Remove selected (${selectedIds.length})`}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--foreground-muted)]">
                  Click a photo card&apos;s edit button to update or remove it.
                </p>
              )}
            </div>
          </div>

          {deleteError ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-100">
              {deleteError}
            </div>
          ) : null}

          {visiblePhotos.length > 0 ? (
            <div
              ref={photoGridRef}
              className="mt-4 grid grid-cols-2 auto-rows-[4px] gap-2 [grid-auto-flow:dense] min-[430px]:gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              <AnimatePresence initial={false}>
                {visiblePhotos.map((photo) => {
                  const selected = selectedIds.includes(photo.id);
                  const removing = removingIds.includes(photo.id);

                  return (
                    <motion.article
                      key={photo.id}
                      layout
                      initial={{ opacity: 1, scale: 1, y: 0 }}
                      animate={
                        removing
                          ? { opacity: 0, scale: 0.92, y: 24, filter: "blur(6px)" }
                          : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
                      }
                      exit={{ opacity: 0, scale: 0.92, y: 24, filter: "blur(6px)" }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        gridRowEnd: `span ${getPhotoBrowserRowSpan(
                          photo,
                          imageRatios,
                          photoGridMetrics,
                        )}`,
                      }}
                      className={cn(
                        "relative h-full overflow-hidden bg-black/20 group rounded-2xl",
                        mode === "select" ? "cursor-pointer" : photo.imagePath ? "cursor-zoom-in" : undefined,
                      )}
                    >
                      <div
                        className={cn(
                          "relative h-full overflow-hidden bg-black/20",
                          mode === "select"
                            ? "cursor-pointer"
                            : photo.imagePath
                              ? "cursor-zoom-in"
                              : undefined,
                        )}
                        onClick={() => {
                          if (mode === "select") {
                            toggleSelected(photo.id);
                            return;
                          }

                          if (mode === "edit" && photo.imagePath) {
                            const index = filteredPhotos.findIndex((item) => item.id === photo.id);
                            setLightboxIndex(index);
                          }
                        }}
                      >
                        {photo.imagePath ? (
                          <img
                            src={photo.imagePath}
                            alt={photo.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                            ref={(element) => {
                              if (element?.complete) {
                                registerImageRatio(photo.id, element.naturalWidth, element.naturalHeight);
                              }
                            }}
                            onLoad={(event) => {
                              const { naturalWidth, naturalHeight } = event.currentTarget;
                              registerImageRatio(photo.id, naturalWidth, naturalHeight);
                            }}
                          />
                        ) : null}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {mode === "edit" ? (
                          <div
                            className="absolute right-3 top-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {photo.editAction}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              if (isDeleting) return;

                              toggleSelected(photo.id);
                            }}
                            className={cn(
                              "absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full border transition sm:right-3 sm:top-3",
                              selected
                                ? "border-[var(--blue-400)] bg-[var(--blue-500)] text-[#03121a]"
                                : "border-white/20 bg-black/45 text-white",
                            )}
                            aria-label={selected ? `Deselect ${photo.title}` : `Select ${photo.title}`}
                            disabled={isDeleting}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {photo.featured ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--blue-400)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--blue-200)]">
                                <Star className="h-3 w-3 fill-current" />
                                Featured
                              </span>
                            ) : null}

                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                                photo.published
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                                  : "border-white/10 bg-black/35 text-white/70",
                              )}
                            >
                              {photo.published ? "Published" : "Draft"}
                            </span>
                          </div>

                          <p className="mt-2 truncate text-sm font-semibold text-white">
                            {photo.title}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/65">
                            {photo.subtitle ? <span>{photo.subtitle}</span> : null}
                            {photo.meta ? <span>{photo.meta}</span> : null}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.02] px-4 py-10 text-center">
              <p className="text-sm font-medium text-white">No photos match this view.</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Adjust the search or sort settings for {category.name.toLowerCase()}.
              </p>
            </div>
          )}

          {filteredPhotos.length > pageSize ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <Lightbox
          photos={lightboxPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      </div>
    </div>,
    portalNodeRef.current,
  );
}

function PhotoCategoryCard({ category }: { category: PhotoBrowserCategory }) {
  const [open, setOpen] = useState(false);
  const [localCategory, setLocalCategory] = useState(category);

  useEffect(() => {
    setLocalCategory(category);
  }, [category]);

  const featuredCount = useMemo(
    () => localCategory.photos.filter((photo) => photo.featured).length,
    [localCategory.photos],
  );

  return (
    <>
      <section className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">{localCategory.name}</p>

              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                <Images className="h-3 w-3" />
                {localCategory.photoCount}
              </span>

              {featuredCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--blue-400)]/30 bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--blue-200)]">
                  <Star className="h-3 w-3 fill-current" />
                  {featuredCount} featured
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              {localCategory.description || `${localCategory.slug} category`}
            </p>
          </div>

          {localCategory.photoCount > 0 ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
            >
              Manage photos
            </button>
          ) : null}
        </div>
      </section>

      <PhotoManagerModal
        category={localCategory}
        open={open}
        onClose={() => setOpen(false)}
        onCategoryChange={setLocalCategory}
      />
    </>
  );
}

export function AdminPhotoCategoryBrowser({ categories }: AdminPhotoCategoryBrowserProps) {
  if (categories.length === 0) return null;

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <PhotoCategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}