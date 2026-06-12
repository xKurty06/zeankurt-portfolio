"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  label: string;
  value: string;
};

type AdminSelectProps = {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  options: Option[];
};

export function AdminSelect({
  name,
  label,
  defaultValue = "",
  required = false,
  options,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

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

  const updateValue = (nextValue: string) => {
    setValue(nextValue);
    setOpen(false);

    if (inputRef.current) {
      inputRef.current.value = nextValue;
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <input ref={inputRef} type="hidden" name={name} value={value} required={required} readOnly />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm outline-none transition ${
          open
            ? "border-[var(--border-strong)] bg-white/[0.05]"
            : "border-[var(--border)] bg-white/[0.03] hover:border-[rgba(72,202,228,0.24)]"
        }`}
      >
        <span className={selected ? "text-white" : "text-[var(--foreground-muted)]"}>
          {selected?.label ?? `Select ${label.toLowerCase()}`}
        </span>
        <span className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--blue-300)]">
          <svg
            viewBox="0 0 16 16"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--background-elevated)] shadow-[0_18px_42px_rgba(0,0,0,0.38)]">
          <div className="max-h-64 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => updateValue("")}
              className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                value === ""
                  ? "bg-[rgba(72,202,228,0.18)] text-[var(--blue-200)]"
                  : "text-[var(--foreground-muted)] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {`Select ${label.toLowerCase()}`}
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateValue(option.value)}
                className={`mt-1 flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  value === option.value
                    ? "bg-[rgba(72,202,228,0.18)] text-[var(--blue-200)]"
                    : "text-white hover:bg-white/[0.04]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
