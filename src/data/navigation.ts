import type { NavItem } from "@/types";

export const mainNav: NavItem[] = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Skills", href: "/#skills" },
  { label: "Photography", href: "/photography" },
  { label: "Contact", href: "/#contact" },
];

export const photographyNav: NavItem[] = [
  { label: "Dev Portfolio", href: "/" },
  { label: "Gallery", href: "/photography" },
  { label: "Albums", href: "/photography#albums" },
  { label: "Contact", href: "/#contact" },
];

export const footerNav: NavItem[] = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Photography", href: "/photography" },
  { label: "Contact", href: "/#contact" },
  { label: "GitHub", href: "https://github.com/xKurty06", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zeank/", external: true },
];
