"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, FolderUp, Trash2, Upload, X } from "lucide-react";
import { useSaving } from "@/lib/saving";

type UploadProgress = {
  error?: string;
  loaded: number;
  total: number;
  status: "pending" | "uploading" | "processing" | "done" | "error" | "cancelled";
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<unknown>;
};

async function collectFilesFromDirectoryHandle(handle: any): Promise<File[]> {
  const files: File[] = [];

  // Traverse the selected folder recursively so nested albums still work.
  for await (const entry of handle.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      files.push(file);
      continue;
    }

    if (entry.kind === "directory") {
      const nestedFiles = await collectFilesFromDirectoryHandle(entry);
      files.push(...nestedFiles);
    }
  }

  return files;
}

export default function UploadWithValidation({
  label,
  name,
  accept,
  multiple = false,
  directory = false,
  maxFiles = 50,
}: {
  label: string;
  name: string;
  accept: string;
  multiple?: boolean;
  directory?: boolean;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentRequestRef = useRef<XMLHttpRequest | null>(null);
  const cancelRequestedRef = useRef(false);
  const submittingRef = useRef(false);
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectionApproved, setSelectionApproved] = useState(true);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const { setSaving } = useSaving();

  const fileCount = selectedFiles.length;
  const overLimit = fileCount > maxFiles;
  const TriggerIcon = directory ? FolderUp : Upload;
  const triggerLabel = directory ? "Choose Folder" : "Choose Files";
  const baseUploadIndicatorLabel =
    fileCount === 0
      ? "Uploading photos. You can close this modal and keep working."
      : `Uploading ${fileCount} photo${fileCount === 1 ? "" : "s"}. You can close this modal and keep working.`;
  const getFileKey = (file: File) => `${file.name}-${file.size}`;

  const cancelUpload = useCallback(() => {
    if (!submittingRef.current) return;
    cancelRequestedRef.current = true;
    currentRequestRef.current?.abort();
  }, []);

  const emitUploadState = (state: "idle" | "uploading" | "complete") => {
    const form = inputRef.current?.form;
    if (!form) return;

    form.dispatchEvent(
      new CustomEvent("admin-upload-state-change", {
        bubbles: true,
        detail: { state },
      }),
    );
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleChange = () => {
      const files = input.files ? Array.from(input.files) : [];
      setSelectedFiles(files);
      setSelectionApproved(files.length <= maxFiles);
      setProgress({});
      setUploadErrors([]);
      setUploadNotice(null);
      setSubmitting(false);
      setSaving(false);
      submittingRef.current = false;
      cancelRequestedRef.current = false;
      emitUploadState("idle");
      input.value = "";
      input.setCustomValidity("");
    };

    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, [maxFiles]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const form = input.form as HTMLFormElement | null;
    if (!form) return;

    const resetSelection = () => {
      submittingRef.current = false;
      setSelectedFiles([]);
      setSelectionApproved(true);
      setProgress({});
      setUploadErrors([]);
      setUploadNotice(null);
      setSubmitting(false);
      setSaving(false);
      currentRequestRef.current = null;
      cancelRequestedRef.current = false;
      emitUploadState("idle");
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.setCustomValidity("");
      }
    };

    const handleSubmit = (event: Event) => {
      const filesList = [...selectedFiles];
      if (filesList.length === 0) return;
      if (submittingRef.current) {
        event.preventDefault();
        return;
      }

      if (filesList.length > maxFiles && !selectionApproved) {
        event.preventDefault();
        input.setCustomValidity(`Review the ${filesList.length} selected files before uploading.`);
        input.reportValidity();
        setTimeout(() => input.setCustomValidity(""), 1000);
        return;
      }

      event.preventDefault();
      submittingRef.current = true;
      cancelRequestedRef.current = false;
      currentRequestRef.current = null;
      setSubmitting(true);
      setUploadErrors([]);
      setUploadNotice(null);
      emitUploadState("uploading");
      setSaving(
        true,
        `Uploading ${filesList.length} photo${filesList.length === 1 ? "" : "s"}. You can close this modal and keep working.`,
        {
          cancelAction: cancelUpload,
          completedCount: 0,
          progressPercent: 0,
          totalCount: filesList.length,
        },
      );

      const categoryIdInput = form.querySelector<HTMLInputElement>("input[name=category_id]");
      const categorySlugInput = form.querySelector<HTMLInputElement>("input[name=category_slug]");
      const categoryId = categoryIdInput?.value ?? "";
      const categorySlug = categorySlugInput?.value ?? "";

      const uploadOne = (file: File) =>
        new Promise<UploadProgress["status"]>((resolve) => {
          const formData = new FormData();
          formData.append("file", file, file.name);
          formData.append("category_id", categoryId);
          formData.append("category_slug", categorySlug);

          const xhr = new XMLHttpRequest();
          currentRequestRef.current = xhr;
          xhr.open("POST", "/api/admin/upload-file", true);
          xhr.withCredentials = true;
          xhr.responseType = "json";

          const key = getFileKey(file);
          setProgress((current) => ({
            ...current,
            [key]: { loaded: 0, total: file.size, status: "uploading" },
          }));

          xhr.upload.onprogress = (progressEvent) => {
            setProgress((current) => ({
              ...current,
              [key]: {
                loaded: progressEvent.loaded,
                total: progressEvent.total || file.size,
                status: "uploading",
              },
            }));
          };

          xhr.upload.onloadend = () => {
            setProgress((current) => {
              const existing = current[key];
              if (!existing || existing.status === "done" || existing.status === "error" || existing.status === "cancelled") {
                return current;
              }

              return {
                ...current,
                [key]: {
                  ...existing,
                  loaded: existing.total,
                  status: "processing",
                },
              };
            });
          };

          xhr.onload = () => {
            const isSuccess = xhr.status >= 200 && xhr.status < 300;
            const jsonResponse =
              typeof xhr.response === "object" && xhr.response !== null ? (xhr.response as { error?: unknown }) : null;
            const responseError =
              typeof jsonResponse?.error === "string" && jsonResponse.error
                ? jsonResponse.error
                : `Upload failed with status ${xhr.status}`;

            setProgress((current) => ({
              ...current,
              [key]: {
                ...(current[key] ?? { loaded: file.size, total: file.size }),
                error: isSuccess ? undefined : responseError,
                status: isSuccess ? "done" : "error",
              },
            }));

            if (!isSuccess) {
              setUploadErrors((current) => (current.includes(responseError) ? current : [...current, responseError]));
            }

            currentRequestRef.current = null;
            resolve(isSuccess ? "done" : "error");
          };

          xhr.onerror = () => {
            const errorMessage = "Network error while uploading file.";
            setProgress((current) => ({
              ...current,
              [key]: {
                ...(current[key] ?? { loaded: 0, total: file.size }),
                error: errorMessage,
                status: "error",
              },
            }));
            setUploadErrors((current) => (current.includes(errorMessage) ? current : [...current, errorMessage]));
            currentRequestRef.current = null;
            resolve("error");
          };

          xhr.onabort = () => {
            setProgress((current) => ({
              ...current,
              [key]: {
                ...(current[key] ?? { loaded: 0, total: file.size }),
                status: "cancelled",
              },
            }));
            currentRequestRef.current = null;
            resolve("cancelled");
          };

          xhr.send(formData);
        });

      (async () => {
        let allSucceeded = true;
        let cancelled = false;
        const remainingFiles: File[] = [];

        for (const [index, file] of filesList.entries()) {
          // eslint-disable-next-line no-await-in-loop
          const status = await uploadOne(file);

          if (status !== "done") {
            remainingFiles.push(file);
          }

          if (status === "cancelled") {
            cancelled = true;
            remainingFiles.push(...filesList.slice(index + 1));
            break;
          }

          if (status !== "done") allSucceeded = false;
          if (cancelRequestedRef.current) {
            cancelled = true;
            remainingFiles.push(...filesList.slice(index + 1));
            break;
          }
        }

        currentRequestRef.current = null;
        submittingRef.current = false;
        cancelRequestedRef.current = false;
        setSubmitting(false);
        setSaving(false);
        if (cancelled) {
          setSelectedFiles(remainingFiles);
          setProgress({});
          setUploadErrors([]);
          setUploadNotice(`Upload cancelled. ${remainingFiles.length} photo${remainingFiles.length === 1 ? "" : "s"} remaining.`);
          emitUploadState("idle");
        } else if (allSucceeded) {
          setUploadNotice(null);
          emitUploadState("complete");
        } else {
          setSelectedFiles(remainingFiles);
          setProgress({});
          setUploadNotice("Some uploads failed. Fix the issue and upload the remaining files again.");
          emitUploadState("idle");
        }
        router.refresh();
      })();
    };

    form.addEventListener("reset", resetSelection);
    form.addEventListener("submit", handleSubmit);
    return () => {
      form.removeEventListener("reset", resetSelection);
      form.removeEventListener("submit", handleSubmit);
    };
  }, [maxFiles, selectedFiles, selectionApproved, setSaving]);

  useEffect(() => {
    if (!submitting || selectedFiles.length === 0) return;

    const trackedEntries = selectedFiles.map((file) => {
      const key = getFileKey(file);
      return progress[key] ?? { loaded: 0, status: "pending", total: file.size };
    });

    const totalBytes = trackedEntries.reduce((sum, item) => sum + Math.max(1, item.total), 0);
    const loadedBytes = trackedEntries.reduce((sum, item) => {
      if (item.status === "done" || item.status === "processing") return sum + Math.max(1, item.total);
      return sum + Math.min(item.loaded, Math.max(1, item.total));
    }, 0);
    const completedCount = trackedEntries.filter((item) => item.status === "done").length;
    const processingCount = trackedEntries.filter((item) => item.status === "processing").length;
    const progressPercent = Math.min(100, Math.max(0, Math.round((loadedBytes / Math.max(1, totalBytes)) * 100)));
    const uploadIndicatorLabel =
      processingCount > 0
        ? `${baseUploadIndicatorLabel.replace(/\.\s*$/, "")} ${processingCount} photo${processingCount === 1 ? " is" : "s are"} processing on the server.`
        : baseUploadIndicatorLabel;

    setSaving(true, uploadIndicatorLabel, {
      cancelAction: cancelUpload,
      completedCount,
      progressPercent,
      totalCount: selectedFiles.length,
    });
  }, [baseUploadIndicatorLabel, cancelUpload, progress, selectedFiles, setSaving, submitting]);

  const applySelectedFiles = (files: File[]) => {
    setSelectedFiles(files);
    setSelectionApproved(files.length <= maxFiles);
    setProgress({});
    setUploadErrors([]);
    setUploadNotice(null);
    setSubmitting(false);
    setSaving(false);
    submittingRef.current = false;
    cancelRequestedRef.current = false;
    emitUploadState("idle");
  };

  const handleDirectoryPick = async () => {
    const pickerWindow = window as DirectoryPickerWindow;
    if (!pickerWindow.showDirectoryPicker) {
      inputRef.current?.click();
      return;
    }

    try {
      const handle = await pickerWindow.showDirectoryPicker();
      const files = await collectFilesFromDirectoryHandle(handle);
      applySelectedFiles(files);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      throw error;
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4 text-xs font-medium text-[var(--foreground-muted)]">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {fileCount > 0 ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            {fileCount} selected
          </span>
        ) : null}
      </div>

      <input
        type="hidden"
        name={`${name}__selection_count`}
        value={String(fileCount)}
        readOnly
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {directory ? (
          <>
            <button
              type="button"
              onClick={handleDirectoryPick}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--blue-100)] transition hover:border-[var(--border-strong)] hover:text-white"
            >
              <TriggerIcon className="h-4 w-4" />
              {triggerLabel}
            </button>
            <input
              ref={inputRef}
              name={name}
              type="file"
              accept={accept}
              multiple={multiple}
              {...({ webkitdirectory: "" } as Record<string, string>)}
              className="sr-only"
            />
          </>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--blue-100)] transition hover:border-[var(--border-strong)] hover:text-white">
            <TriggerIcon className="h-4 w-4" />
            {triggerLabel}
            <input
              ref={inputRef}
              name={name}
              type="file"
              accept={accept}
              multiple={multiple}
              className="sr-only"
            />
          </label>
        )}
        <p className="text-sm text-[var(--foreground-muted)]">
          {fileCount === 0 ? "No files chosen" : `${fileCount} file${fileCount === 1 ? "" : "s"} ready`}
        </p>
        {fileCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              setSelectedFiles([]);
              setSelectionApproved(true);
              setProgress({});
              setUploadErrors([]);
              setUploadNotice(null);
              setSubmitting(false);
              setSaving(false);
              submittingRef.current = false;
              cancelRequestedRef.current = false;
              emitUploadState("idle");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}
      </div>

      {overLimit ? (
        <div className="mt-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-500/10 text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-yellow-100">
                Review this large upload before uploading
              </p>
              <p className="mt-1 text-xs leading-relaxed text-yellow-100/80">
                {fileCount} images are queued. That is above the recommended batch size of {maxFiles}. Keep this selection only if you want to upload the full batch now.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectionApproved(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/15"
                >
                  <Check className="h-3.5 w-3.5" />
                  Keep selection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles([]);
                    setSelectionApproved(true);
                    setProgress({});
                    setUploadErrors([]);
                    setUploadNotice(null);
                    setSubmitting(false);
                    setSaving(false);
                    submittingRef.current = false;
                    cancelRequestedRef.current = false;
                    emitUploadState("idle");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove selection
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {uploadNotice ? (
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3 text-xs text-[var(--foreground-muted)]">
          {uploadNotice}
        </div>
      ) : null}

      {uploadErrors.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/8 p-3 text-xs text-red-100">
          <p className="font-semibold text-red-100">Some files failed to upload.</p>
          <div className="mt-2 space-y-1">
            {uploadErrors.slice(0, 3).map((error) => (
              <p key={error} className="leading-relaxed text-red-100/85">
                {error}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {fileCount > 0 ? (
        <div className="mt-3 space-y-2 text-xs text-[var(--foreground-muted)]">
          {selectedFiles.map((file) => {
            const key = `${file.name}-${file.size}`;
            const currentProgress = progress[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="min-w-[160px] truncate">{file.name}</div>
                <div className="flex-1">
                  <div className="relative h-2 w-full rounded bg-white/[0.03]">
                    <div
                      className="absolute left-0 top-0 h-2 rounded bg-[var(--blue-400)] transition-all"
                      style={{
                        width: currentProgress
                          ? `${(currentProgress.loaded / Math.max(1, currentProgress.total)) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  {currentProgress
                    ? currentProgress.status === "uploading"
                      ? `${Math.round((currentProgress.loaded / Math.max(1, currentProgress.total)) * 100)}%`
                      : currentProgress.status === "processing"
                        ? "Processing"
                      : currentProgress.status === "done"
                        ? "Done"
                        : "Error"
                    : "Pending"}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {submitting ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-3 py-3 text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            Uploading. Large folders may take a while.
          </div>
          <button
            type="button"
            onClick={cancelUpload}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-400/20 px-3 py-2 font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
          >
            <X className="h-3.5 w-3.5" />
            Cancel upload
          </button>
        </div>
      ) : null}
    </div>
  );
}
