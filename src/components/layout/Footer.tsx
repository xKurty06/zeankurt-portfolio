"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { footerNav } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins, ScrollTrigger } from "@/lib/gsap";
import { SocialLinks } from "@/components/ui/SocialLinks";

const ShaderBackground = dynamic(
  () => import("@/components/ui/ShaderBackground"),
  { ssr: false },
);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

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

      if (content) {
        gsap.fromTo(
          content,
          {
            autoAlpha: 0,
            y: 24,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            immediateRender: false,
            clearProps: "opacity,visibility,transform",
            scrollTrigger: {
              trigger: footer,
              start: "top 95%",
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
          delay: 2,
          repeatDelay: 4,
        });
      }

      const refreshTimeout = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);

      return () => {
        window.clearTimeout(refreshTimeout);
      };
    },
    { scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="relative isolate overflow-hidden border-t border-[var(--border)] bg-[var(--background-elevated)]"
    >
      <div aria-hidden className="absolute inset-0">
        <div className="hidden sm:block">
          <ShaderBackground />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.78),rgba(10,15,26,0.94)_42%,rgba(10,15,26,0.98))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(72,202,228,0.1),transparent_42%)] opacity-70" />
      </div>

      <div
        data-footer-sweep
        aria-hidden
        className="pointer-events-none absolute top-0 -left-1/2 z-10 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--blue-400)] to-transparent opacity-50"
      />

      <div data-footer-content className="container-shell relative z-10 py-7 sm:py-10 md:py-14">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 font-[family-name:var(--font-syne)] text-xl font-semibold text-white transition sm:text-2xl"
            >
              {siteConfig.name}
            </Link>

            <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--foreground-muted)] sm:mt-3 sm:text-sm">
              {siteConfig.description}
            </p>

            <div className="mt-4 sm:mt-5">
              <SocialLinks
                links={socialGroups.personal}
                size="sm"
                className="gap-2 sm:gap-3 [&_a]:h-9 [&_a]:w-9 sm:[&_a]:h-11 sm:[&_a]:w-11"
                iconClassName="h-4 w-4 sm:h-5 sm:w-5"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--blue-400)] sm:text-xs">
              Navigation
            </p>

            <ul className="grid grid-cols-2 gap-x-5 gap-y-1 sm:gap-x-6">
              {footerNav.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-8 items-center text-sm text-[var(--foreground-muted)] transition duration-200 hover:translate-x-1 hover:text-white sm:min-h-10"
                    >
                      {item.label}
                    </a>
                  ) : item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-8 items-center text-sm text-[var(--foreground-muted)] transition duration-200 hover:translate-x-1 hover:text-white sm:min-h-10"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="inline-flex min-h-8 items-center text-sm text-[var(--foreground-muted)] transition duration-200 hover:translate-x-1 hover:text-white sm:min-h-10"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--foreground-subtle)] sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
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