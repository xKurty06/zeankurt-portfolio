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
        ? "bg-[linear-gradient(180deg,rgba(15,23,41,0.88),rgba(15,23,41,0.74)_24%,rgba(10,15,26,0.68)_52%,rgba(15,23,41,0.8)_100%)]"
        : surface === "elevated"
          ? "bg-[linear-gradient(180deg,rgba(10,15,26,0.9),rgba(10,15,26,0.78)_24%,rgba(3,7,18,0.7)_52%,rgba(10,15,26,0.82)_100%)]"
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
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(202,240,248,0.04)] to-transparent sm:h-32" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(3,7,18,0.62)] to-transparent sm:h-36" />
          </div>
        ) : null}
        {children}
      </section>
    );
  },
);

Section.displayName = "Section";
