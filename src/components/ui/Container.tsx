import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "container-shell relative mx-auto w-full px-2 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  surface?: "default" | "subtle" | "elevated";
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, surface = "default", ...props }, ref) => {
    const surfaceLayerClassName =
      surface === "subtle"
        ? "bg-[linear-gradient(180deg,rgba(15,23,41,0)_0%,rgba(15,23,41,0.46)_10%,rgba(15,23,41,0.82)_26%,rgba(10,15,26,0.76)_56%,rgba(15,23,41,0.5)_86%,rgba(15,23,41,0)_100%)]"
        : surface === "elevated"
          ? "bg-[linear-gradient(180deg,rgba(10,15,26,0)_0%,rgba(10,15,26,0.44)_10%,rgba(10,15,26,0.8)_24%,rgba(3,7,18,0.72)_56%,rgba(10,15,26,0.52)_86%,rgba(10,15,26,0)_100%)]"
          : "";

    return (
      <section
        ref={ref}
        className={cn(
          "relative isolate scroll-mt-[var(--header-height)] overflow-hidden bg-[var(--background)] py-12 sm:py-16 md:py-20 lg:py-24",
          className,
        )}
        {...props}
      >
        {surface !== "default" ? (
          <div aria-hidden className={cn("pointer-events-none absolute inset-0", surfaceLayerClassName)}>
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(202,240,248,0.035)] via-[rgba(72,202,228,0.02)] to-transparent sm:h-40" />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[rgba(3,7,18,0.48)] via-[rgba(3,7,18,0.16)] to-transparent sm:h-44" />
          </div>
        ) : null}
        {children}
      </section>
    );
  },
);

Section.displayName = "Section";
