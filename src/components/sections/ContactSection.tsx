"use client";

import { useRef } from "react";
import { Mail } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { socialGroups } from "@/data/social";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { MagneticButton } from "@/components/animation/MagneticButton";
import { Button } from "@/components/ui/Button";
import { SocialLinkGroups } from "@/components/ui/SocialLinks";
import { Section, Container } from "@/components/ui/Container";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";

interface ContactSectionProps {
  siteConfig: {
    email: string;
  };
}

export function ContactSection({ siteConfig }: ContactSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lowMotion = useLowMotionDevice();

  useGSAP(
    () => {
      registerGsapPlugins();

      const card = cardRef.current;
      if (!card) return;

      if (lowMotion) {
        gsap.set(card, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          clearProps: "filter,transform,opacity,visibility,boxShadow",
        });

        return;
      }

      gsap.fromTo(
        card,
        {
          autoAlpha: 0,
          y: 28,
          scale: 0.98,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );

      gsap.to(card, {
        boxShadow: "0 0 48px rgba(0,180,216,0.12), 0 0 80px rgba(236,111,168,0.07)",
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });

      const signalItems = gsap.utils.toArray<HTMLElement>("[data-contact-signal]");

      gsap.to(signalItems, {
        y: -8,
        opacity: 0.9,
        duration: 2.4,
        stagger: 0.35,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      return () => {
        gsap.killTweensOf(signalItems);
      };
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section id="contact" ref={sectionRef} className="py-10 sm:py-16 lg:py-24">
      <Container>
        <div
          ref={cardRef}
          className="relative mx-auto max-w-[42rem] overflow-hidden rounded-[1.35rem] border border-[var(--border-strong)] px-4 py-7 text-center sm:rounded-[var(--radius-xl)] sm:px-6 sm:py-8 md:px-8 md:py-10 lg:max-w-none lg:px-12 lg:py-12 lg:text-left"
          style={{
            background:
              "linear-gradient(135deg, rgba(2,62,138,0.2), rgba(3,7,18,0.94) 48%, rgba(236,111,168,0.08))",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(143,124,255,0.16),transparent_65%)] blur-3xl sm:-right-28 sm:-top-28 sm:h-72 sm:w-72"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,180,216,0.18),transparent_65%)] blur-3xl sm:-bottom-28 sm:-left-28 sm:h-72 sm:w-72"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute right-[12%] top-[18%] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(230,199,106,0.12),transparent_68%)] blur-2xl sm:h-36 sm:w-36"
          />

          {!lowMotion ? (
            <div aria-hidden className="contact-signal-field pointer-events-none absolute inset-0 hidden lg:block">
              <span data-contact-signal className="contact-signal contact-signal-a" />
              <span data-contact-signal className="contact-signal contact-signal-b" />
              <span data-contact-signal className="contact-signal contact-signal-c" />
            </div>
          ) : null}

          <div aria-hidden className="polygon-stack pointer-events-none absolute right-6 top-6 hidden md:block">
            <span />
            <span />
            <span />
          </div>

          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px scan-line-card" />

          <div className="relative z-10">
            <RevealOnScroll>
              <div className="mx-auto max-w-[22rem] text-center sm:max-w-2xl lg:mx-0 lg:max-w-4xl lg:text-left">
                <div className="inline-flex items-center gap-3 text-[var(--blue-200)]">
                  <span className="h-px w-10 bg-gradient-to-r from-[rgba(72,202,228,0.8)] to-transparent" />
                  <p className="font-[family-name:var(--font-syne)] text-[0.78rem] font-medium tracking-[0.18em] sm:text-[0.82rem]">
                    Contact
                  </p>
                </div>

                <h2 className="mt-3 text-balance font-[family-name:var(--font-syne)] text-[clamp(2rem,8vw,3.45rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                  Open to{" "}
                  <span className="text-[var(--gold-300)] drop-shadow-[0_0_18px_rgba(230,199,106,0.18)]">
                    collaborations
                  </span>
                  ,{" "}
                  <span className="bg-gradient-to-r from-[var(--blue-100)] via-[var(--blue-300)] to-[var(--violet-300)] bg-clip-text text-transparent">
                    web builds
                  </span>
                  , and{" "}
                  <span className="text-[var(--rose-300)] drop-shadow-[0_0_18px_rgba(236,111,168,0.16)]">
                    photo/video
                  </span>{" "}
                  work.
                </h2>

                <p className="mx-auto mt-5 max-w-[20rem] text-sm leading-7 text-[var(--foreground-muted)] sm:max-w-xl sm:text-base sm:leading-8 lg:mx-0">
                  Reach out for <span className="font-medium text-[var(--blue-100)]">software projects</span>,
                  <span className="font-medium text-[var(--gold-300)]"> hackathon teams</span>,
                  <span className="font-medium text-[var(--rose-300)]"> event coverage</span>, or{" "}
                  <span className="font-medium text-white">Studio Nomads</span> inquiries.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="mt-6 flex justify-center lg:justify-start">
                <MagneticButton>
                  <Button href={`mailto:${siteConfig.email}`} className="min-h-10 px-4 text-sm">
                    <Mail className="h-4 w-4" />
                    Email me
                  </Button>
                </MagneticButton>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.18}>
              <div className="mx-auto mt-8 max-w-[22rem] sm:max-w-2xl lg:mx-0 lg:max-w-none">
                <SocialLinkGroups
                  personal={socialGroups.personal}
                  photography={socialGroups.photography}
                  affiliation={socialGroups.affiliation}
                />
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </Container>
    </Section>
  );
}
