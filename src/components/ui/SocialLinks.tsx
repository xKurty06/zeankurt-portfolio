"use client";

import type { SocialLink } from "@/types";
import { cn } from "@/lib/cn";
import { SocialIcon } from "@/components/ui/SocialIcon";

interface SocialLinksProps {
  links: SocialLink[];
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}

export function SocialLinks({
  links,
  className,
  iconClassName,
  showLabels = false,
  size = "md",
}: SocialLinksProps) {
  const dimension = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5 sm:h-5 sm:w-5";
  const buttonSize =
    size === "sm" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-11 sm:w-11";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}>
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.description ?? link.label}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.02] text-[var(--foreground-muted)] transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:text-white",
              showLabels
                ? "min-h-10 px-3 py-2 text-sm sm:min-h-11 sm:px-4 sm:py-2.5"
                : buttonSize,
              !showLabels && "justify-center",
            )}
          >
            <SocialIcon platform={link.platform} className={cn(dimension, iconClassName)} />

            {showLabels ? (
              <span className="text-sm font-medium">{link.label}</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

interface SocialLinkGroupsProps {
  personal: SocialLink[];
  photography: SocialLink[];
  affiliation: SocialLink[];
}

export function SocialLinkGroups({
  personal,
  photography,
  affiliation,
}: SocialLinkGroupsProps) {
  return (
    <div className="grid gap-6 text-center md:grid-cols-3 md:gap-8 lg:text-left">
      <SocialGroup title="Personal" links={personal} />
      <SocialGroup title="Photography" links={photography} />
      <SocialGroup title="Studio Nomads" links={affiliation} />
    </div>
  );
}

function SocialGroup({
  title,
  links,
}: {
  title: string;
  links: SocialLink[];
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--blue-400)] sm:text-xs">
        {title}
      </h3>

      <SocialLinks
        links={links}
        showLabels
        size="sm"
        className="justify-center lg:justify-start"
      />
    </div>
  );
}