"use client";

import { useRef } from "react";
import { Mail } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { siteConfig } from "@/data/site";
import { socialGroups } from "@/data/social";
import { RevealOnScroll } from "@/components/animation/RevealOnScroll";
import { MagneticButton } from "@/components/animation/MagneticButton";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SocialLinkGroups } from "@/components/ui/SocialLinks";
import { Section, Container } from "@/components/ui/Container";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();
      const card = cardRef.current;
      if (!card) return;

      // Entrance
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 60, scale: 0.96 },
        {
          autoAlpha: 1, y: 0, scale: 1,
          duration: 1.1, ease: "power3.out",
          scrollTrigger: {
            trigger: card, start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      // Continuous glow pulse on the border
      gsap.to(card, {
        boxShadow: "0 0 80px rgba(0,180,216,0.2), 0 0 120px rgba(2,62,138,0.15)",
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });

      // Mouse-tracked glow inside the card
      const glow = card.querySelector<HTMLElement>("[data-contact-glow]");
      if (glow) {
        card.addEventListener("mousemove", (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          // Position via left/top; margin offsets (128px = half of h-64/w-64) centre it
          glow.style.left = `${e.clientX - rect.left}px`;
          glow.style.top  = `${e.clientY - rect.top}px`;
          gsap.to(glow, { opacity: 1, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(glow, { opacity: 0, duration: 0.5 });
        });
      }

      const signalItems = gsap.utils.toArray<HTMLElement>("[data-contact-signal]");
      gsap.to(signalItems, {
        y: -10,
        opacity: 0.95,
        duration: 2.4,
        stagger: 0.35,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: sectionRef },
  );

  return (
    <Section id="contact" ref={sectionRef}>
      <Container>
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] p-8 md:p-12"
          style={{
            background: "linear-gradient(135deg, rgba(2,62,138,0.25), rgba(3,7,18,0.92))",
          }}
        >
          {/* Mouse-tracked glow spot — centred with negative margin, no transform */}
          <div
            data-contact-glow
            aria-hidden
            className="pointer-events-none absolute z-0 h-64 w-64 rounded-full opacity-0"
            style={{
              marginLeft: -128,
              marginTop:  -128,
              background: "radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* Corner glows */}
          <div aria-hidden className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,180,216,0.15),transparent_65%)] blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(2,62,138,0.3),transparent_65%)] blur-3xl" />
          <div aria-hidden className="contact-signal-field pointer-events-none absolute inset-0">
            <span data-contact-signal className="contact-signal contact-signal-a" />
            <span data-contact-signal className="contact-signal contact-signal-b" />
            <span data-contact-signal className="contact-signal contact-signal-c" />
          </div>
          <div aria-hidden className="polygon-stack pointer-events-none absolute right-6 top-6 hidden md:block">
            <span />
            <span />
            <span />
          </div>

          {/* Scan line in the card */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px scan-line-card" />

          <div className="relative z-10">
            <RevealOnScroll>
              <SectionHeading
                eyebrow="Contact"
                title="Open to dev collaborations, software and web builds, and photo/video work."
                description="Reach out for software projects, hackathon teams, event coverage, or Studio Nomads inquiries."
              />
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                <MagneticButton>
                  <Button href={`mailto:${siteConfig.email}`}>
                    <Mail className="h-4 w-4" />
                    Email me
                  </Button>
                </MagneticButton>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.18}>
              <div className="mt-10">
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
