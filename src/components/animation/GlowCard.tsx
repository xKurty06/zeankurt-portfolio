"use client";

import { useRef, forwardRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { cn } from "@/lib/cn";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  intensity?: number;
  tilt?: boolean;
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  function GlowCard(
    { children, className, intensity = 0.5, tilt = true, ...rest },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLDivElement>(null);
    const glowRef  = useRef<HTMLDivElement>(null);

    // Support both forwarded ref and internal ref
    const cardRef = (forwardedRef as React.RefObject<HTMLDivElement>) ?? innerRef;

    useGSAP(
      () => {
        registerGsapPlugins();
        const card = cardRef.current;
        const glow = glowRef.current;
        if (!card || !glow) return;

        const onMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // left/top + negative margin centres the glow on the cursor.
          // No CSS transform involved — no GSAP conflict.
          glow.style.left = `${x}px`;
          glow.style.top  = `${y}px`;
          gsap.to(glow, { opacity: 1, duration: 0.2 });

          if (tilt) {
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            gsap.to(card, {
              rotateX: ((y - cy) / cy) * -6 * intensity,
              rotateY: ((x - cx) / cx) * 6 * intensity,
              duration: 0.35,
              ease: "power2.out",
              transformPerspective: 900,
            });
          }
        };

        const onLeave = () => {
          gsap.to(glow, { opacity: 0, duration: 0.4 });
          if (tilt) {
            gsap.to(card, {
              rotateX: 0,
              rotateY: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.6)",
            });
          }
        };

        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
        return () => {
          card.removeEventListener("mousemove", onMove);
          card.removeEventListener("mouseleave", onLeave);
        };
      },
      { scope: cardRef },
    );

    return (
      <div
        ref={cardRef}
        className={cn("relative overflow-hidden will-change-transform", className)}
        style={{ transformStyle: tilt ? "preserve-3d" : "flat" }}
        {...rest}
      >
        {/* Glow spot — centred via negative margin so left/top = cursor pos */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute z-10 h-48 w-48 rounded-full opacity-0"
          style={{
            marginLeft: -96,
            marginTop:  -96,
            background: "radial-gradient(circle, rgba(0,180,216,0.18) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        {children}
      </div>
    );
  },
);
