"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Code2,
  FolderKanban,
  Home,
  Images,
  Mail,
  Menu,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import { mainNav, photographyNav } from "@/data/navigation";
import type { SiteConfig } from "@/types/site";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { NavItem } from "@/types";

interface HeaderProps {
  variant?: "default" | "photography";
  siteConfig: SiteConfig;
}

function getHeaderOffset() {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const headerHeight = header?.getBoundingClientRect().height ?? 64;

  // Use only the actual fixed header height.
  // No extra gap, so the selected section starts directly below the nav.
  return Math.ceil(headerHeight) - 1;
}

function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  if (!hash) return;

  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = document.getElementById(id);

  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

  window.scrollTo({
    top: Math.max(0, Math.round(top)),
    behavior,
  });
}

function getUrlFromHref(href: string) {
  if (typeof window === "undefined") return null;

  try {
    return new URL(href, window.location.origin);
  } catch {
    return null;
  }
}

function handleInternalAnchorClick(
  event: MouseEvent<HTMLElement>,
  href: string,
  onNavigate?: () => void,
) {
  const url = getUrlFromHref(href);

  if (!url) {
    onNavigate?.();
    return;
  }

  const isSameOrigin = url.origin === window.location.origin;
  const isSamePath = url.pathname === window.location.pathname;
  const hasHash = Boolean(url.hash);

  if (isSameOrigin && isSamePath && hasHash) {
    event.preventDefault();

    window.history.pushState(null, "", `${url.pathname}${url.hash}`);
    window.dispatchEvent(new Event("hashchange"));

    onNavigate?.();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToHash(url.hash);
      });
    });

    return;
  }

  onNavigate?.();
}

export function Header({ variant = "default", siteConfig }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const headerRef = useRef<HTMLElement>(null);

  const resolvedVariant =
    variant ?? (pathname.startsWith("/photography") ? "photography" : "default");

  const navItems =
    resolvedVariant === "photography" ? photographyNav : mainNav;

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
    const updateHash = () => setCurrentHash(window.location.hash);

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!window.location.hash) return;

    const timeout = window.setTimeout(() => {
      scrollToHash(window.location.hash, "auto");
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      data-site-header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || open
          ? "border-b border-[var(--border)] bg-[rgba(3,7,18,0.86)] backdrop-blur-xl shadow-[0_1px_40px_rgba(0,180,216,0.06)]"
          : "bg-transparent",
      )}
    >
      <div className="container-shell flex h-16 items-center justify-between md:h-[var(--header-height)]">
        <Link
          href="/"
          className="pointer-events-auto group flex min-w-0 items-center gap-2 truncate font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-white sm:text-lg"
        >
          {siteConfig.name}
        </Link>

        <nav className="pointer-events-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map((item, index) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              currentHash={currentHash}
              index={index}
            />
          ))}
        </nav>

        <div className="pointer-events-auto hidden lg:block">
          <Button href="/#contact" variant="secondary">
            Get in touch
          </Button>
        </div>

        <MobileFluidNav
          open={open}
          setOpen={setOpen}
          navItems={navItems}
          pathname={pathname}
          currentHash={currentHash}
        />
      </div>
    </header>
  );
}

function MobileFluidNav({
  open,
  setOpen,
  navItems,
  pathname,
  currentHash,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  navItems: NavItem[];
  pathname: string;
  currentHash: string;
}) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (navRef.current?.contains(target)) return;

      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div
      ref={navRef}
      className="pointer-events-auto relative z-[60] flex h-12 w-12 justify-end lg:hidden"
      data-expanded={open}
    >
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative z-[90] flex h-12 w-12 items-center justify-center rounded-full border text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition duration-300",
          open
            ? "border-[rgba(72,202,228,0.3)] bg-[rgba(20,31,50,0.98)]"
            : "border-[var(--border)] bg-[rgba(8,14,28,0.72)] backdrop-blur-xl hover:border-[var(--border-strong)] hover:shadow-[0_0_16px_var(--accent-glow)]",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <nav aria-label="Mobile fluid navigation" className="absolute right-0 top-0 h-12 w-12">
        {navItems.map((item, index) => (
          <MobileFluidNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            currentHash={currentHash}
            index={index}
            open={open}
            onNavigate={() => setOpen(false)}
          />
        ))}
      </nav>
    </div>
  );
}

function MobileFluidNavItem({
  item,
  pathname,
  currentHash,
  index,
  open,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  currentHash: string;
  index: number;
  open: boolean;
  onNavigate: () => void;
}) {
  const isExternal = item.external || item.href.startsWith("http");
  const isActive = isNavItemActive(item, pathname, currentHash);
  const Icon = getMobileNavIcon(item);
  const translateY = open ? (index + 1) * 46 : 0;

  const wrapperClassName = cn(
    "group absolute right-0 top-0 h-12 w-12 transition-[transform,opacity] duration-300 ease-out",
    open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
  );

  const circleClassName = cn(
    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border text-[var(--foreground-muted)] shadow-[0_12px_34px_rgba(0,0,0,0.28)] outline-none transition-[border-color,background-color,color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-[var(--blue-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    isActive
      ? "border-[var(--blue-400)] bg-[rgba(72,202,228,0.14)] text-white shadow-[0_0_18px_rgba(0,180,216,0.22)]"
      : "border-[var(--border)] bg-[rgba(20,31,50,0.98)] hover:border-[var(--border-strong)] hover:bg-[rgba(30,44,68,0.98)] hover:text-white",
  );

  const labelClassName = cn(
    "absolute right-[3.65rem] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300",
    open ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
    isActive
      ? "border-[rgba(72,202,228,0.34)] bg-[rgba(72,202,228,0.18)] text-white"
      : "border-[var(--border)] bg-[rgba(8,14,28,0.96)] text-[var(--foreground-muted)] group-hover:border-[var(--border-strong)] group-hover:text-white",
  );

  const wrapperStyle: CSSProperties = {
    transform: `translateY(${translateY}px)`,
    zIndex: 80 - index,
    transitionDelay: open ? `${index * 28}ms` : `${Math.max(0, 120 - index * 18)}ms`,
    backfaceVisibility: "hidden",
    WebkitFontSmoothing: "antialiased",
  };

  const circleContent = (
    <>
      <Icon className="h-5 w-5" />
      <span className="sr-only">{item.label}</span>
    </>
  );

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <span className={labelClassName} aria-hidden>
        {item.label}
      </span>

      {isExternal ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          title={item.label}
          aria-label={item.label}
          className={circleClassName}
          onClick={onNavigate}
        >
          {circleContent}
        </a>
      ) : item.href.startsWith("/") ? (
        <Link
          href={item.href}
          title={item.label}
          aria-label={item.label}
          className={circleClassName}
          onClick={(event) => handleInternalAnchorClick(event, item.href, onNavigate)}
        >
          {circleContent}
        </Link>
      ) : (
        <a
          href={item.href}
          title={item.label}
          aria-label={item.label}
          className={circleClassName}
          onClick={(event) => handleInternalAnchorClick(event, item.href, onNavigate)}
        >
          {circleContent}
        </a>
      )}
    </div>
  );
}

function getMobileNavIcon(item: NavItem): LucideIcon {
  const label = item.label.toLowerCase();
  const href = item.href.toLowerCase();

  if (label.includes("dev portfolio") || href === "/") return ArrowLeft;
  if (label.includes("about")) return UserRound;
  if (label.includes("project")) return FolderKanban;
  if (label.includes("experience")) return BriefcaseBusiness;
  if (label.includes("skill")) return Code2;
  if (label.includes("creative") || label.includes("photography")) return Camera;
  if (label.includes("contact")) return Mail;
  if (label.includes("gallery")) return Images;
  if (label.includes("album")) return Camera;

  return Home;
}

function getStableHrefParts(href: string) {
  if (href.startsWith("http")) return null;

  const [rawPathname, rawHash] = href.split("#");

  return {
    pathname: rawPathname || "/",
    hash: rawHash ? `#${rawHash}` : "",
  };
}

function isNavItemActive(item: NavItem, pathname: string, currentHash: string) {
  const isExternal = item.external || item.href.startsWith("http");

  if (isExternal) return false;

  const hrefParts = getStableHrefParts(item.href);

  if (!hrefParts) return false;

  if (hrefParts.hash) {
    return pathname === hrefParts.pathname && currentHash === hrefParts.hash;
  }

  if (hrefParts.pathname === "/") {
    return pathname === "/" && currentHash === "";
  }

  return pathname === hrefParts.pathname && currentHash === "";
}

function NavLink({
  item,
  pathname,
  currentHash,
  mobile = false,
  index = 0,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  currentHash: string;
  mobile?: boolean;
  index?: number;
  onNavigate?: () => void;
}) {
  const isExternal = item.external || item.href.startsWith("http");
  const isActive = isNavItemActive(item, pathname, currentHash);

  const className = cn(
    "rounded-full px-4 py-2 text-sm transition-all duration-200",
    mobile && "flex min-h-10 w-full items-center px-3 text-left",
    isActive
      ? "text-[var(--foreground-muted)] hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_8px_rgba(0,180,216,0.15)]"
      : "text-[var(--foreground-muted)] hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_8px_rgba(0,180,216,0.15)]",
  );

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (isExternal) {
      onNavigate?.();
      return;
    }

    handleInternalAnchorClick(event, item.href, onNavigate);
  };

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleClick}
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
        onClick={handleClick}
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
      onClick={handleClick}
      style={mobile ? { animationDelay: `${index * 0.05}s` } : undefined}
    >
      {item.label}
    </a>
  );
}