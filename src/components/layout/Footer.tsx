"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { footerNav } from "@/data/navigation";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";
import type { SiteConfig } from "@/types/site";

const ShaderBackground = dynamic(
  () => import("@/components/ui/ShaderBackground"),
  { ssr: false },
);

interface FooterProps {
  siteConfig: SiteConfig;
}

export function Footer({ siteConfig }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const lowMotion = useLowMotionDevice();

  useGSAP(
    () => {
      registerGsapPlugins();

      const footer = footerRef.current;
      if (!footer) return;

      const content = footer.querySelector<HTMLElement>("[data-footer-content]");
      const sweep = footer.querySelector<HTMLElement>("[data-footer-sweep]");

      gsap.set(footer, {
        autoAlpha: 1,
      });

      if (lowMotion) {
        if (content) {
          gsap.set(content, {
            autoAlpha: 1,
            y: 0,
            clearProps: "opacity,visibility,transform",
          });
        }

        return;
      }

      if (content) {
        gsap.fromTo(
          content,
          {
            autoAlpha: 0,
            y: 14,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            immediateRender: false,
            clearProps: "opacity,visibility,transform",
            scrollTrigger: {
              trigger: footer,
              start: "top 98%",
              toggleActions: "play none none none",
              once: true,
            },
          },
        );
      }

      if (sweep) {
        gsap.to(sweep, {
          x: "200%",
          duration: 8,
          repeat: -1,
          ease: "sine.inOut",
          delay: 1,
          repeatDelay: 4,
        });
      }
    },
    { dependencies: [lowMotion], scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="relative isolate overflow-hidden border-t border-[var(--border)] bg-[var(--background-elevated)]"
      style={{ visibility: "visible" }}
    >
      <div aria-hidden className="absolute inset-0">
        {!lowMotion ? (
          <div className="hidden sm:block">
            <ShaderBackground />
          </div>
        ) : null}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.78),rgba(10,15,26,0.94)_42%,rgba(10,15,26,0.98))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(72,202,228,0.1),transparent_42%)] opacity-70" />
      </div>

      <div
        data-footer-sweep
        aria-hidden
        className="pointer-events-none absolute -left-1/2 top-0 z-10 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--blue-400)] to-transparent opacity-50"
      />

      <div
        data-footer-content
        className="container-shell relative z-10 py-8 text-center sm:py-10 md:py-14 lg:text-left"
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="mx-auto max-w-md lg:mx-0">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 font-[family-name:var(--font-syne)] text-xl font-semibold text-white transition hover:text-[var(--blue-200)] sm:text-2xl lg:justify-start"
            >
              {siteConfig.name}
            </Link>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--foreground-muted)] lg:mx-0">
              {siteConfig.description}
            </p>

            <div className="mt-5">
              <SocialLinks
                links={socialGroups.personal}
                size="sm"
                className="justify-center gap-2 sm:gap-3 lg:justify-start"
                iconClassName="h-4 w-4 sm:h-5 sm:w-5"
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--blue-400)] sm:text-xs">
              Navigation
            </p>

            <ul className="grid grid-cols-2 justify-items-center gap-x-5 gap-y-2 lg:justify-items-start">
              {footerNav.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center justify-center text-sm text-[var(--foreground-muted)] transition duration-200 hover:text-white lg:justify-start lg:hover:translate-x-1"
                    >
                      {item.label}
                    </a>
                  ) : item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-9 items-center justify-center text-sm text-[var(--foreground-muted)] transition duration-200 hover:text-white lg:justify-start lg:hover:translate-x-1"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="inline-flex min-h-9 items-center justify-center text-sm text-[var(--foreground-muted)] transition duration-200 hover:text-white lg:justify-start lg:hover:translate-x-1"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-7 flex max-w-md flex-col items-center gap-2 border-t border-[var(--border)] pt-5 text-xs leading-6 text-[var(--foreground-subtle)] sm:mt-8 sm:text-sm lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>

          <p>
            Photography via{" "}
            <a
              href="https://www.instagram.com/shot.by.zk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue-300)] transition hover:text-white"
            >
              {siteConfig.photographyBrand}
            </a>
            {" · "}
            <a
              href="https://www.instagram.com/officialstudio.nomads/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue-300)] transition hover:text-white"
            >
              Studio Nomads
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}