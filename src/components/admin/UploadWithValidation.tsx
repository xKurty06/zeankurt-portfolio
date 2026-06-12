"use client";

import { useEffect, useRef, useState } from "react";
import { useSaving } from "@/lib/saving";

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
  const [fileCount, setFileCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<Record<string, { loaded: number; total: number; status: "pending" | "uploading" | "done" | "error" }>>({});
  const { setSaving } = useSaving();

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleChange = () => {
      const files = input.files;
      const count = files ? files.length : 0;
      setFileCount(count);

      if (count > maxFiles) {
        // Ask the user to confirm large uploads
        const ok = window.confirm(
          `You selected ${count} files. Uploading more than ${maxFiles} images may take a long time. Continue?`,
        );
        if (!ok) {
          input.value = "";
          setFileCount(0);
          input.setCustomValidity("Please select fewer files.");
          // Clearing validity after a short delay so future selections can be validated
          setTimeout(() => input.setCustomValidity(""), 500);
        } else {
          input.setCustomValidity("");
        }
      } else {
        input.setCustomValidity("");
      }
    };

    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, [maxFiles]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const form = input.form as HTMLFormElement | null;
    if (!form) return;

    const handleSubmit = (e: Event) => {
      const filesList = input.files ? Array.from(input.files) : [];
      if (filesList.length === 0) return;
      e.preventDefault();
      setSubmitting(true);
      setSaving(true);

      const categoryIdInput = form.querySelector<HTMLInputElement>("input[name=category_id]");
      const categorySlugInput = form.querySelector<HTMLInputElement>("input[name=category_slug]");
      const categoryId = categoryIdInput?.value ?? "";
      const categorySlug = categorySlugInput?.value ?? "";

      const uploadOne = (file: File) =>
        new Promise<void>((resolve) => {
          const fd = new FormData();
          fd.append("file", file, file.name);
          fd.append("category_id", categoryId);
          fd.append("category_slug", categorySlug);

          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/admin/upload-file", true);
          xhr.withCredentials = true;

          const key = file.name + "-" + file.size;
          setProgress((p) => ({ ...p, [key]: { loaded: 0, total: file.size, status: "uploading" } }));

          xhr.upload.onprogress = (ev) => {
            setProgress((p) => ({ ...p, [key]: { loaded: ev.loaded, total: ev.total || file.size, status: "uploading" } }));
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress((p) => ({ ...p, [key]: { ...(p[key] ?? { loaded: file.size, total: file.size }), status: "done" } }));
            } else {
              setProgress((p) => ({ ...p, [key]: { ...(p[key] ?? { loaded: 0, total: file.size }), status: "error" } }));
            }
            resolve();
          };

          xhr.onerror = () => {
            setProgress((p) => ({ ...p, [key]: { ...(p[key] ?? { loaded: 0, total: file.size }), status: "error" } }));
            resolve();
          };

          xhr.send(fd);
        });

      (async () => {
        for (const file of filesList) {
          // eslint-disable-next-line no-await-in-loop
          await uploadOne(file);
        }
        setSubmitting(false);
        setSaving(false);
        // refresh to show new records
        window.location.reload();
      })();
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <label className="rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.015] px-4 py-3 text-xs font-medium text-[var(--foreground-muted)]">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {fileCount > 0 ? <span className="text-[10px] text-[var(--foreground-muted)]">{fileCount} selected</span> : null}
      </div>

      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        {...(directory ? { webkitdirectory: "" as any } : {})}
        className="mt-2 text-sm text-[var(--foreground-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:font-semibold file:text-[var(--blue-200)]"
      />

      {fileCount > maxFiles ? (
        <p className="mt-2 text-xs text-yellow-300">Large upload selected — confirm to proceed.</p>
      ) : null}

      {fileCount > 0 ? (
        <div className="mt-3 space-y-2 text-xs text-[var(--foreground-muted)]">
          {Array.from(inputRef.current?.files ?? []).map((file) => {
            const key = file.name + "-" + file.size;
            const p = progress[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="min-w-[160px] truncate">{file.name}</div>
                <div className="flex-1">
                  <div className="relative h-2 w-full rounded bg-white/[0.03]">
                    <div
                      className="absolute left-0 top-0 h-2 rounded bg-[var(--blue-400)] transition-all"
                      style={{ width: p ? `${(p.loaded / Math.max(1, p.total)) * 100}%` : `0%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  {p ? (p.status === "uploading" ? `${Math.round((p.loaded / Math.max(1, p.total)) * 100)}%` : p.status === "done" ? "Done" : "Error") : "Pending"}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {submitting ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Uploading — the request may take a while for large folders.
        </div>
      ) : null}
    </label>
  );
}
