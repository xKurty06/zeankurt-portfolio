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
  return (
    <ul className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}>
      {links.map((link) => (
        <li key={link.id}>
          <SocialLinkButton
            link={link}
            showLabels={showLabels}
            size={size}
            iconClassName={iconClassName}
          />
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
      <SocialGroup title="Personal" links={personal} layout="grid" />
      <SocialGroup title="Photography" links={photography} layout="row" />
      <SocialGroup title="Studio Nomads" links={affiliation} layout="row" />
    </div>
  );
}

function SocialGroup({
  title,
  links,
  layout,
}: {
  title: string;
  links: SocialLink[];
  layout: "grid" | "row";
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--blue-400)] sm:text-xs">
        {title}
      </h3>

      {layout === "grid" ? (
        <ul className="mx-auto grid max-w-[18rem] grid-cols-2 gap-2 lg:mx-0">
          {links.map((link) => (
            <li key={link.id} className="min-w-0">
              <SocialLinkButton
                link={link}
                showLabels
                size="sm"
                className="w-full justify-center px-2.5"
                iconClassName="h-4 w-4"
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mx-auto flex max-w-[20rem] flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
          {links.map((link) => (
            <li key={link.id} className="min-w-0">
              <SocialLinkButton
                link={link}
                showLabels
                size="sm"
                className="justify-center px-3"
                iconClassName="h-4 w-4"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SocialLinkButton({
  link,
  showLabels,
  size,
  className,
  iconClassName,
}: {
  link: SocialLink;
  showLabels: boolean;
  size: "sm" | "md";
  className?: string;
  iconClassName?: string;
}) {
  const iconSize =
    size === "sm"
      ? "h-4 w-4"
      : "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5";

  const buttonSize =
    size === "sm"
      ? "h-9 w-9 sm:h-10 sm:w-10"
      : "h-10 w-10 sm:h-11 sm:w-11";

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.label}
      title={link.description ?? link.label}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.02] text-[var(--foreground-muted)] transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:text-white",
        showLabels
          ? "min-h-10 px-3 py-2 text-sm sm:min-h-11 sm:px-4 sm:py-2.5"
          : buttonSize,
        !showLabels && "justify-center",
        className,
      )}
    >
      <SocialIcon
        platform={link.platform}
        className={cn(iconSize, "shrink-0", iconClassName)}
      />

      {showLabels ? (
        <span className="min-w-0 truncate text-sm font-medium">
          {link.label}
        </span>
      ) : null}
    </a>
  );
}
