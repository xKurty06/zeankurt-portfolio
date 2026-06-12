"use client";

import { useEffect, useId, useRef, useState } from "react";
import SaveButton from "@/components/ui/SaveButton";
import { useSaving } from "@/lib/saving";
import { createPortal } from "react-dom";

type UploadDialogState = "idle" | "uploading" | "complete";

type AdminDialogProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary";
  triggerContent?: React.ReactNode;
  triggerClassName?: string;
  children: React.ReactNode;
};

export function AdminDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "secondary",
  triggerContent,
  triggerClassName,
  children,
}: AdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hasForm, setHasForm] = useState(false);
  const [hasFileInput, setHasFileInput] = useState(false);
  const [uploadDialogState, setUploadDialogState] = useState<UploadDialogState>("idle");
  const titleId = useId();
  const descriptionId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const initialSnapshotRef = useRef<string>("");
  const portalNodeRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const syncFormState = () => {
    const form = contentRef.current?.querySelector("form") ?? null;
    setHasForm(Boolean(form));
    setHasFileInput(Boolean(form?.querySelector('input[type="file"]')));
  };

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
    setUploadDialogState("idle");
    syncFormState();

    siblings.forEach((element) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });

    const observer = new MutationObserver(() => {
      syncFormState();
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      siblings.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      });
      setHasForm(false);
      setHasFileInput(false);
      setUploadDialogState("idle");
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
    setUploadDialogState("idle");
  };

  const { cancelSaving, canCancel, setSaving } = useSaving();

  useEffect(() => {
    if (open) {
      setSaving(false);
    }
  }, [open, setSaving]);

  useEffect(() => {
    if (!open || !hasFileInput) return;

    const form = contentRef.current?.querySelector("form");
    if (!form) return;

    const handleUploadStateChange = (event: Event) => {
      const nextState = (event as CustomEvent<{ state?: UploadDialogState }>).detail?.state;
      if (nextState === "idle" || nextState === "uploading" || nextState === "complete") {
        setUploadDialogState(nextState);
      }
    };

    form.addEventListener("admin-upload-state-change", handleUploadStateChange as EventListener);
    return () => {
      form.removeEventListener("admin-upload-state-change", handleUploadStateChange as EventListener);
    };
  }, [hasFileInput, open]);

  const handleSave = () => {
    if (hasFileInput && uploadDialogState === "complete") {
      setOpen(false);
      return;
    }

    const form = contentRef.current?.querySelector("form");
    if (!form) return;
    if (hasFileInput) {
      setUploadDialogState("uploading");
    }
    setSaving(true, hasFileInput ? "Uploading selected files. You can close this modal and keep working." : "Saving changes...");
    form.requestSubmit();
  };

  const primaryActionLabel = hasFileInput
    ? uploadDialogState === "complete"
      ? "Close"
      : "Upload"
    : "Save";

  const defaultTriggerClassName =
    triggerVariant === "primary"
      ? "rounded-full bg-[var(--blue-500)] px-4 py-2 text-sm font-medium text-[#03121a] transition hover:bg-[var(--blue-300)]"
      : "rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white";

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        title={triggerLabel}
        className={triggerClassName ?? defaultTriggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerContent ?? triggerLabel}
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
              {hasFileInput && uploadDialogState === "uploading" && canCancel && cancelSaving ? (
                <button
                  type="button"
                  onClick={cancelSaving}
                  className="rounded-full border border-red-400/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
                >
                  Cancel upload
                </button>
              ) : null}
              {uploadDialogState !== "complete" ? (
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={!dirty || uploadDialogState === "uploading"}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Discard
                </button>
              ) : null}
              {hasForm ? (
                <SaveButton
                  type="button"
                  onClick={handleSave}
                  loadingLabel={hasFileInput ? "Uploading..." : "Saving..."}
                >
                  {primaryActionLabel}
                </SaveButton>
              ) : null}
            </div>
          </div>
        </div>
        , portalNodeRef.current)
        : null}
    </>
  );
}
