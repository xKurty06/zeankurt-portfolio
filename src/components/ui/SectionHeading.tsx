import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        centered ? "mx-auto text-center" : "mx-auto text-center lg:mx-0 lg:text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--blue-400)] sm:text-xs sm:tracking-[0.32em]">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-3 font-[family-name:var(--font-syne)] text-[clamp(2rem,8vw,3.1rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:mt-4 sm:text-5xl lg:text-6xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-base leading-8 text-[var(--foreground-muted)] sm:mt-5 sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}