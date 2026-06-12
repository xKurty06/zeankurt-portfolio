"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AdminDialogProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary";
  children: React.ReactNode;
};

export function AdminDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "secondary",
  children,
}: AdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hasForm, setHasForm] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const initialSnapshotRef = useRef<string>("");
  const portalNodeRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const snapshotFields = () => {
    const root = contentRef.current;
    if (!root) return "";

    const fields = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      ),
    );

    return JSON.stringify(
      fields.map((field) => {
        if (field instanceof HTMLInputElement) {
          if (field.type === "file") {
            return { name: field.name, type: field.type, value: field.files?.length ?? 0 };
          }

          if (field.type === "checkbox" || field.type === "radio") {
            return { name: field.name, type: field.type, checked: field.checked, value: field.value };
          }
        }

        return { name: field.name, value: field.value };
      }),
    );
  };

  useEffect(() => {
    const portalNode = document.createElement("div");
    portalNode.dataset.adminDialogPortal = "true";
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

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const siblings = Array.from(document.body.children).filter(
      (element) => element !== portalNodeRef.current,
    );

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    initialSnapshotRef.current = snapshotFields();
    setDirty(false);
    setHasForm(Boolean(contentRef.current?.querySelector("form")));

    siblings.forEach((element) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      siblings.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      });
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleFieldChange = () => {
    setDirty(snapshotFields() !== initialSnapshotRef.current);
  };

  const handleDiscard = () => {
    const root = contentRef.current;
    if (!root) return;

    const forms = Array.from(root.querySelectorAll("form"));
    forms.forEach((form) => form.reset());

    initialSnapshotRef.current = snapshotFields();
    setDirty(false);
  };

  const handleSave = () => {
    const form = contentRef.current?.querySelector("form");
    if (!form) return;
    form.requestSubmit();
  };

  const triggerClassName =
    triggerVariant === "primary"
      ? "rounded-full bg-[var(--blue-500)] px-4 py-2 text-sm font-medium text-[#03121a] transition hover:bg-[var(--blue-300)]"
      : "rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white";

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open && mounted && portalNodeRef.current
        ? createPortal(
        <div
          aria-hidden="false"
          className="animate-fade-in fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden bg-[rgba(3,7,18,0.76)] p-4 md:p-6"
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onDragStart={(event) => event.preventDefault()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className="animate-modal-in flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-[1.75rem] border border-[var(--border-strong)] bg-[var(--background-elevated)] shadow-[0_20px_80px_rgba(0,0,0,0.45)] md:max-h-[calc(100dvh-3rem)]"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onDragStart={(event) => event.stopPropagation()}
            onDragOver={(event) => event.stopPropagation()}
            onDrop={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
              <div className="min-w-0">
                <h3 id={titleId} className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
                  {title}
                </h3>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={`Close ${title}`}
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div
              ref={contentRef}
              className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5"
              onInput={handleFieldChange}
              onChange={handleFieldChange}
            >
              {children}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!dirty}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Discard
              </button>
              {hasForm ? (
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-[var(--blue-500)] px-4 py-2 text-sm font-medium text-[#03121a] transition hover:bg-[var(--blue-300)]"
                >
                  Save
                </button>
              ) : null}
            </div>
          </div>
        </div>
        , portalNodeRef.current)
        : null}
    </>
  );
}
