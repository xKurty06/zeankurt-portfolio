import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  external?: boolean;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--blue-950)] hover:bg-[var(--blue-400)] shadow-[0_0_24px_var(--accent-glow)] hover:shadow-[0_0_36px_var(--accent-glow)]",
  secondary:
    "border border-[var(--border-strong)] bg-white/[0.03] text-white hover:border-[var(--blue-400)] hover:bg-white/[0.06] hover:shadow-[0_0_16px_rgba(0,180,216,0.15)]",
  ghost:
    "text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.05]",
};

export function Button({
  children,
  href,
  external,
  variant = "primary",
  className,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = cn(
    // Base — add shine pseudo-element via group
    "group relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    variants[variant],
    className,
  );

  const inner = (
    <>
      {/* Shine sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] -translate-x-full skew-x-[-20deg] bg-white/10 transition-transform duration-500 group-hover:translate-x-[150%]"
      />
      {children}
    </>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {inner}
        </a>
      );
    }
    return <Link href={href} className={classes}>{inner}</Link>;
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}
