"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import type { SiteConfig } from "@/types/site";

interface ConditionalHeaderProps {
  siteConfig: SiteConfig;
}

export default function ConditionalHeader({ siteConfig }: ConditionalHeaderProps) {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/admin")) return null;

  return <Header siteConfig={siteConfig} />;
}