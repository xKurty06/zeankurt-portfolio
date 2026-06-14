"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SaveButton from "@/components/ui/SaveButton";
import { SavingScopeProvider, useSaving } from "@/lib/saving";

type UploadDialogState = "idle" | "uploading" | "complete";

type AdminDialogProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary";
  triggerContent?: React.ReactNode;
  triggerClassName?: string;
  submitBehavior?: "auto" | "save" | "upload";
  children: React.ReactNode;
};

export function AdminDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "secondary",
  triggerContent,
  triggerClassName,
  submitBehavior = "auto",
  children,
}: AdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hasForm, setHasForm] = useState(false);
  const [hasFileInput, setHasFileInput] = useState(false);
  const [uploadDialogState, setUploadDialogState] = useState<UploadDialogState>("idle");

  const titleId = useId();
  const descriptionId = useId();
  const savingKey = useId();

  const contentRef = useRef<HTMLDivElement>(null);
  const initialSnapshotRef = useRef<string>("");
  const portalNodeRef = useRef<HTMLDivElement | null>(null);
  const submitIntentRef = useRef<"save" | "upload" | null>(null);

  const [mounted, setMounted] = useState(false);

  const uploadIntent =
    submitBehavior === "upload" ||
    (submitBehavior === "auto" && /\b(upload|import)\b/i.test(`${triggerLabel} ${title}`));

  const { cancelSaving, canCancel, setSaving } = useSaving(savingKey);

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
            return {
              name: field.name,
              type: field.type,
              value: field.files?.length ?? 0,
            };
          }

          if (field.type === "checkbox" || field.type === "radio") {
            return {
              name: field.name,
              type: field.type,
              checked: field.checked,
              value: field.value,
            };
          }
        }

        return {
          name: field.name,
          value: field.value,
        };
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
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
      });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.querySelector('[data-preview-overlay="true"]')) {
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      setSaving(false);
      observer.disconnect();

      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";

      siblings.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      });

      setHasForm(false);
      setHasFileInput(false);
      setUploadDialogState("idle");

      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setSaving]);

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

  useEffect(() => {
    if (open) {
      setSaving(false);
    }
  }, [open, setSaving]);

  useEffect(() => {
    if (!open || !hasFileInput || !uploadIntent) return;

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
  }, [hasFileInput, open, uploadIntent]);

  useEffect(() => {
    if (!open) return;

    const form = contentRef.current?.querySelector("form");
    if (!form) return;

    const handleSubmit = () => {
      const submitIntent = submitIntentRef.current;

      if (submitIntent === "upload" || (uploadIntent && hasFileInput)) {
        return;
      }

      setSaving(true, "Saving changes...");
    };

    const clearSavingState = () => {
      submitIntentRef.current = null;
      setSaving(false);

      if (uploadIntent) {
        setUploadDialogState("idle");
      }
    };

    const handleActionPendingChange = (event: Event) => {
      const pending = (event as CustomEvent<{ pending?: boolean }>).detail?.pending;

      if (pending) {
        setSaving(true, uploadIntent && hasFileInput ? "Uploading..." : "Saving changes...");
        return;
      }

      setSaving(false);
    };

    const handleActionStateChange = (event: Event) => {
      const status = (event as CustomEvent<{ status?: string }>).detail?.status;

      submitIntentRef.current = null;
      setSaving(false);

      if (uploadIntent) {
        setUploadDialogState("idle");
      }

      if (status === "success") {
        initialSnapshotRef.current = snapshotFields();
        setDirty(false);
      }
    };

    form.addEventListener("submit", handleSubmit);
    form.addEventListener("admin-action-pending-change", handleActionPendingChange as EventListener);
    form.addEventListener("admin-action-state-change", handleActionStateChange as EventListener);
    window.addEventListener("error", clearSavingState);
    window.addEventListener("unhandledrejection", clearSavingState);

    return () => {
      form.removeEventListener("submit", handleSubmit);
      form.removeEventListener("admin-action-pending-change", handleActionPendingChange as EventListener);
      form.removeEventListener("admin-action-state-change", handleActionStateChange as EventListener);
      window.removeEventListener("error", clearSavingState);
      window.removeEventListener("unhandledrejection", clearSavingState);
    };
  }, [hasFileInput, open, setSaving, uploadIntent]);

  const handleSave = () => {
    if (uploadIntent && hasFileInput && uploadDialogState === "complete") {
      setOpen(false);
      return;
    }

    const form = contentRef.current?.querySelector("form");
    if (!form) return;

    if (!form.reportValidity()) {
      submitIntentRef.current = null;
      setSaving(false);
      return;
    }

    submitIntentRef.current = hasFileInput && uploadIntent ? "upload" : "save";

    if (hasFileInput && uploadIntent) {
      setUploadDialogState("uploading");
    }

    form.requestSubmit();
  };

  const primaryActionLabel =
    uploadIntent && hasFileInput
      ? uploadDialogState === "complete"
        ? "Close"
        : "Upload"
      : "Save";

  const defaultTriggerClassName =
    triggerVariant === "primary"
      ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--blue-500)] px-4 py-2 text-sm font-medium text-[#03121a] transition hover:bg-[var(--blue-300)]"
      : "inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5";

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
            <SavingScopeProvider value={savingKey}>
              <div
                aria-hidden="false"
                className="animate-fade-in fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden bg-[rgba(3,7,18,0.76)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:p-6"
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
                  className="animate-modal-in flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col rounded-[1.25rem] border border-[var(--border-strong)] bg-[var(--background-elevated)] shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:rounded-[1.75rem] md:max-h-[calc(100dvh-3rem)]"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onDragStart={(event) => event.stopPropagation()}
                  onDragOver={(event) => event.stopPropagation()}
                  onDrop={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                      <h3
                        id={titleId}
                        className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white"
                      >
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
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div
                    ref={contentRef}
                    className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5"
                    onInput={handleFieldChange}
                    onChange={handleFieldChange}
                  >
                    {children}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-4 sm:px-5">
                    {uploadIntent && hasFileInput && uploadDialogState === "uploading" && canCancel && cancelSaving ? (
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
                        disabled={!dirty || (uploadIntent && uploadDialogState === "uploading")}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] transition enabled:hover:border-[var(--border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Discard
                      </button>
                    ) : null}

                    {hasForm ? (
                      <SaveButton
                        type="button"
                        onClick={handleSave}
                        loadingLabel={uploadIntent && hasFileInput ? "Uploading..." : "Saving..."}
                        savingKey={savingKey}
                      >
                        {primaryActionLabel}
                      </SaveButton>
                    ) : null}
                  </div>
                </div>
              </div>
            </SavingScopeProvider>,
            portalNodeRef.current,
          )
        : null}
    </>
  );
}