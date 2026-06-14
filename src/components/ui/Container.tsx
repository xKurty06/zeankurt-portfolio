import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "container-shell relative mx-auto w-full px-5 sm:px-6 lg:px-8",
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
    return (
      <section
        ref={ref}
        className={cn(
          "relative scroll-mt-[var(--header-height)] overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24",
          surface === "subtle" && "bg-[var(--background-subtle)]",
          surface === "elevated" && "bg-[var(--background-elevated)]",
          className,
        )}
        {...props}
      >
        {children}
      </section>
    );
  },
);

Section.displayName = "Section";