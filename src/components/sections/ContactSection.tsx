"use client";

import { useRef } from "react";
import { Mail } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { socialGroups } from "@/data/social";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { MagneticButton } from "@/components/animation/MagneticButton";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
          y: 42,
          scale: 0.97,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      gsap.to(card, {
        boxShadow: "0 0 56px rgba(0,180,216,0.14), 0 0 88px rgba(2,62,138,0.1)",
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });

      const glow = card.querySelector<HTMLElement>("[data-contact-glow]");
      let onMouseMove: ((event: MouseEvent) => void) | null = null;
      let onMouseLeave: (() => void) | null = null;

      if (glow) {
        onMouseMove = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect();

          glow.style.left = `${event.clientX - rect.left}px`;
          glow.style.top = `${event.clientY - rect.top}px`;

          gsap.to(glow, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
          });
        };

        onMouseLeave = () => {
          gsap.to(glow, {
            opacity: 0,
            duration: 0.5,
          });
        };

        card.addEventListener("mousemove", onMouseMove);
        card.addEventListener("mouseleave", onMouseLeave);
      }

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
        if (onMouseMove) {
          card.removeEventListener("mousemove", onMouseMove);
        }

        if (onMouseLeave) {
          card.removeEventListener("mouseleave", onMouseLeave);
        }
      };
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: sectionRef },
  );

  return (
    <Section id="contact" ref={sectionRef}>
      <Container>
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[1.25rem] border border-[var(--border-strong)] p-4 text-center sm:rounded-[var(--radius-xl)] sm:p-6 md:p-10 lg:p-12 lg:text-left"
          style={{
            background: "linear-gradient(135deg, rgba(2,62,138,0.25), rgba(3,7,18,0.92))",
          }}
        >
          <div
            data-contact-glow
            aria-hidden
            className="pointer-events-none absolute z-0 hidden h-56 w-56 rounded-full opacity-0 lg:block"
            style={{
              marginLeft: -112,
              marginTop: -112,
              background: "radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,180,216,0.12),transparent_65%)] blur-3xl sm:-right-28 sm:-top-28 sm:h-72 sm:w-72"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(2,62,138,0.24),transparent_65%)] blur-3xl sm:-bottom-28 sm:-left-28 sm:h-72 sm:w-72"
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
              <SectionHeading
                eyebrow="Contact"
                title="Open to dev collaborations, software and web builds, and photo/video work."
                description="Reach out for software projects, hackathon teams, event coverage, or Studio Nomads inquiries."
                className="mx-auto text-center lg:mx-0 lg:text-left"
              />
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="mt-6 flex justify-center sm:mt-7 lg:justify-start">
                <MagneticButton>
                  <Button href={`mailto:${siteConfig.email}`}>
                    <Mail className="h-4 w-4" />
                    Email me
                  </Button>
                </MagneticButton>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.18}>
              <div className="mt-8 sm:mt-10">
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