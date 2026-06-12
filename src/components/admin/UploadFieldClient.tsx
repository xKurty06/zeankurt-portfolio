"use client";

import React from "react";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export default function UploadField({
  label,
  name,
  accept,
  multiple = false,
  directory = false,
}: {
  label: string;
  name: string;
  accept: string;
  multiple?: boolean;
  directory?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handler = () => {
      const files = input.files ? Array.from(input.files) : [];
      const tooLarge = files.find((f) => f.size > MAX_UPLOAD_BYTES);
      if (tooLarge) {
        input.setCustomValidity(`File "${tooLarge.name}" is too large. Limit is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`);
        input.reportValidity();
        setTimeout(() => {
          input.setCustomValidity("");
        }, 3000);
      } else {
        input.setCustomValidity("");
      }
    };

    input.addEventListener("change", handler);
    return () => input.removeEventListener("change", handler);
  }, []);

  return (
    <label className="rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.015] px-4 py-3 text-xs font-medium text-[var(--foreground-muted)]">
      {label}
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        {...(directory ? { webkitdirectory: "" } : {})}
        className="mt-2 text-sm text-[var(--foreground-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:font-semibold file:text-[var(--blue-200)]"
      />
    </label>
  );
}
