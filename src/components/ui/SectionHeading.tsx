import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  centered?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "section-heading-block relative w-full min-w-0 max-w-3xl",
        centered
          ? "mx-auto text-center"
          : "mx-auto text-center lg:mx-0 lg:text-left",
        className,
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            "flex items-center gap-3 text-[var(--blue-200)]",
            centered ? "justify-center" : "justify-center lg:justify-start",
          )}
        >
          <span className="hidden h-px w-10 bg-[linear-gradient(90deg,rgba(72,202,228,0.9),rgba(72,202,228,0.16),transparent)] sm:block" />

          <p className="font-[family-name:var(--font-syne)] text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[var(--blue-200)] sm:text-[0.79rem]">
            {eyebrow}
          </p>
        </div>
      ) : null}

      <h2
        className={cn(
          "mt-4 max-w-[16ch] font-[family-name:var(--font-syne)] text-[clamp(2.1rem,7vw,3.45rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:mt-5 sm:max-w-[20ch] lg:max-w-none lg:text-[clamp(2.75rem,4.8vw,3.7rem)]",
          centered ? "mx-auto" : "mx-auto lg:mx-0",
          titleClassName,
        )}
      >
        {title}
      </h2>

      {description ? (
        <p
          className={cn(
            "mt-4 max-w-[60ch] text-base leading-7 text-[var(--foreground-muted)] sm:mt-5 sm:text-[1.02rem] sm:leading-8",
            centered ? "mx-auto" : "mx-auto lg:mx-0",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
