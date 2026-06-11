import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--blue-200)]",
        "transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:text-white hover:shadow-[0_0_10px_rgba(0,180,216,0.2)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
