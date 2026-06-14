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
    "bg-[var(--accent)] text-[var(--blue-950)] hover:bg-[var(--blue-400)] shadow-[0_0_18px_var(--accent-glow)] hover:shadow-[0_0_28px_var(--accent-glow)] sm:shadow-[0_0_24px_var(--accent-glow)] sm:hover:shadow-[0_0_36px_var(--accent-glow)]",
  secondary:
    "border border-[var(--border-strong)] bg-white/[0.03] text-white hover:border-[var(--blue-400)] hover:bg-white/[0.06] hover:shadow-[0_0_16px_rgba(0,180,216,0.15)]",
  ghost:
    "text-[var(--foreground-muted)] hover:bg-white/[0.05] hover:text-white",
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
    "group relative inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:min-h-11 sm:px-5 sm:py-2.5",
    variants[variant],
    className,
  );

  const inner = (
    <>
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
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} onClick={onClick}>
          {inner}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}