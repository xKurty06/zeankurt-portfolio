import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl min-w-0",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 break-words font-mono text-xs uppercase tracking-[0.2em] text-[var(--blue-400)] sm:tracking-[0.24em]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="break-words font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-[var(--foreground-muted)] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
