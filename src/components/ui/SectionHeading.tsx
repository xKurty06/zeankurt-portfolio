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
        "max-w-xl min-w-0 sm:max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-2 break-words font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-400)] sm:mb-3 sm:text-xs sm:tracking-[0.24em]">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="break-words font-[family-name:var(--font-syne)] text-[clamp(1.65rem,7vw,2.25rem)] font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)] sm:mt-4 sm:text-base md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}