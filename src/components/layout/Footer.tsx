"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { footerNav } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import { socialGroups } from "@/data/social";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { SocialLinks } from "@/components/ui/SocialLinks";
import ShaderBackground from "@/components/ui/ShaderBackground";

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();

      // Reveal footer on scroll
      gsap.fromTo(
        footerRef.current,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current, start: "top 95%",
            toggleActions: "play none none none",
          },
        },
      );

      // Animated gradient sweep on the top border — slow, once every 8s
      const sweep = footerRef.current?.querySelector<HTMLElement>("[data-footer-sweep]");
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
    },
    { scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="relative isolate overflow-hidden border-t border-[var(--border)] bg-[var(--background-elevated)]"
    >
      <div aria-hidden className="absolute inset-0">
        <ShaderBackground />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.72),rgba(10,15,26,0.9)_42%,rgba(10,15,26,0.96))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(72,202,228,0.12),transparent_42%)] opacity-70" />
      </div>

      {/* Top border traveling glow */}
      <div
        data-footer-sweep
        aria-hidden
        className="pointer-events-none absolute top-0 -left-1/2 z-10 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--blue-400)] to-transparent opacity-50"
      />

      <div className="container-shell relative z-10 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 font-[family-name:var(--font-syne)] text-2xl font-semibold text-white transition"
            >
              {siteConfig.name}
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--foreground-muted)]">
              {siteConfig.description}
            </p>
            <div className="mt-6">
              <SocialLinks links={socialGroups.personal} />
            </div>
          </div>

          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--blue-400)]">
              Navigation
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {footerNav.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--foreground-muted)] transition hover:text-white hover:translate-x-1 inline-block duration-200"
                    >
                      {item.label}
                    </a>
                  ) : item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--foreground-muted)] transition hover:text-white hover:translate-x-1 inline-block duration-200"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm text-[var(--foreground-muted)] transition hover:text-white hover:translate-x-1 inline-block duration-200"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--foreground-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>
            Photography via{" "}
            <a
              href="https://www.instagram.com/shot.by.zk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue-300)] hover:text-white transition"
            >
              {siteConfig.photographyBrand}
            </a>
            {" · "}
            <a
              href="https://www.instagram.com/officialstudio.nomads/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue-300)] hover:text-white transition"
            >
              Studio Nomads
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
