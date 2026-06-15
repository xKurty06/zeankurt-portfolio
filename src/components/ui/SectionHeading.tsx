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
        <div className="inline-flex items-center gap-3 text-[var(--blue-200)]">
          <span className="hidden h-px w-10 bg-gradient-to-r from-[rgba(72,202,228,0.8)] to-transparent sm:block" />
          <p className="font-[family-name:var(--font-syne)] text-[0.78rem] font-medium tracking-[0.18em] sm:text-[0.82rem]">
            {eyebrow}
          </p>
        </div>
      ) : null}

      <h2 className="mt-4 font-[family-name:var(--font-syne)] text-[clamp(2rem,8vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">
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
