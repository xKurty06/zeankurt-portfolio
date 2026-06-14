import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "main";
  id?: string;
  [key: string]: unknown;
}

export function Container({
  children,
  className,
  as: Tag = "div",
  id,
  ...rest
}: ContainerProps) {
  return (
    <Tag id={id} className={cn("container-shell", className)} {...rest}>
      {children}
    </Tag>
  );
}

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  surface?: "default" | "elevated" | "subtle";
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  function Section({ children, className, id, surface = "default" }, ref) {
    const surfaceClass =
      surface === "elevated"
        ? "bg-[var(--background-elevated)]"
        : surface === "subtle"
          ? "bg-[var(--background-subtle)]"
          : "";

    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          "relative overflow-hidden py-10 sm:py-14 md:py-20 lg:py-24",
          surfaceClass,
          className,
        )}
      >
        {children}
      </section>
    );
  },
);