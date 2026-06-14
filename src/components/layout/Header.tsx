"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { mainNav, photographyNav } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  variant?: "default" | "photography";
}

export function Header({ variant }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const resolvedVariant =
    variant ?? (pathname.startsWith("/photography") ? "photography" : "default");
  const navItems =
    resolvedVariant === "photography" ? photographyNav : mainNav;

  // Entrance animation
  useGSAP(
    () => {
      registerGsapPlugins();
      gsap.fromTo(
        headerRef.current,
        { autoAlpha: 0, y: -20 },
        { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.1, ease: "power3.out" },
      );
    },
    { scope: headerRef },
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-[var(--border)] bg-[rgba(3,7,18,0.82)] backdrop-blur-xl shadow-[0_1px_40px_rgba(0,180,216,0.06)]"
          : "bg-transparent",
      )}
    >
      <div className="container-shell flex h-[var(--header-height)] items-center justify-between">
        {/* Logo — hover glow */}
        <Link
          href="/"
          className="pointer-events-auto group flex items-center gap-2 font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-white"
        >
          {siteConfig.name}
        </Link>

        <nav className="pointer-events-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map((item, i) => (
            <NavLink key={item.href} item={item} pathname={pathname} index={i} />
          ))}
        </nav>

        <div className="pointer-events-auto hidden lg:block">
          <Button href="/#contact" variant="secondary">
            Get in touch
          </Button>
        </div>

        <button
          type="button"
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-white transition hover:border-[var(--border-strong)] hover:shadow-[0_0_16px_var(--accent-glow)] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="pointer-events-auto border-t border-[var(--border)] bg-[rgba(3,7,18,0.96)] px-4 py-4 backdrop-blur-xl lg:hidden animate-slide-down">
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {navItems.map((item, i) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                mobile
                index={i}
                onNavigate={() => setOpen(false)}
              />
            ))}
            <Button href="/#contact" variant="secondary" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Get in touch
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  item,
  pathname,
  mobile = false,
  index = 0,
  onNavigate,
}: {
  item: (typeof mainNav)[number];
  pathname: string;
  mobile?: boolean;
  index?: number;
  onNavigate?: () => void;
}) {
  const isExternal = item.external || item.href.startsWith("http");
  const isActive =
    !isExternal &&
    (item.href === "/"
      ? pathname === "/"
      : item.href.startsWith("/")
        ? pathname.startsWith(item.href)
        : false);

  const className = cn(
    "rounded-full px-4 py-2 text-sm transition-all duration-200",
    mobile && "flex min-h-11 w-full items-center text-left",
    isActive
      ? "bg-[var(--accent-soft)] text-white shadow-[0_0_12px_var(--accent-glow)]"
      : "text-[var(--foreground-muted)] hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_8px_rgba(0,180,216,0.15)]",
  );

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
        style={mobile ? { animationDelay: `${index * 0.05}s` } : undefined}
      >
        {item.label}
      </a>
    );
  }

  if (item.href.startsWith("/")) {
    return (
      <Link
        href={item.href}
        className={className}
        onClick={onNavigate}
        style={mobile ? { animationDelay: `${index * 0.05}s` } : undefined}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={item.href}
      className={className}
      onClick={onNavigate}
      style={mobile ? { animationDelay: `${index * 0.05}s` } : undefined}
    >
      {item.label}
    </a>
  );
}
