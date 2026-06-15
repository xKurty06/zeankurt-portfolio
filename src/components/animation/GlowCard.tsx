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

    const cardRef = (forwardedRef as React.RefObject<HTMLDivElement>) ?? innerRef;

    useGSAP(
      () => {
        registerGsapPlugins();
        const card = cardRef.current;
        if (!card) return;

        const onMove = (event: MouseEvent) => {
          if (!tilt) return;

          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const cx = rect.width / 2;
          const cy = rect.height / 2;

          gsap.to(card, {
            rotateX: ((y - cy) / cy) * -6 * intensity,
            rotateY: ((x - cx) / cx) * 6 * intensity,
            duration: 0.35,
            ease: "power2.out",
            transformPerspective: 900,
          });
        };

        const onLeave = () => {
          if (!tilt) return;

          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.6)",
          });
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
        {children}
      </div>
    );
  },
);
