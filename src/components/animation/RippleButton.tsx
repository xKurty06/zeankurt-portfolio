"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/cn";

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Wraps any button/link content with a CSS ripple effect on click.
 * Works entirely with CSS — no GSAP, no rAF.
 */
export function RippleButton({ children, className, onClick }: RippleButtonProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const createRipple = (e: MouseEvent<HTMLSpanElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: rgba(0,180,216,0.25);
      transform: scale(0);
      animation: rippleAnim 0.55s ease-out forwards;
      pointer-events: none;
    `;
    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
    onClick?.();
  };

  return (
    <span
      ref={containerRef}
      onMouseDown={createRipple}
      className={cn("relative inline-flex overflow-hidden", className)}
    >
      {children}
    </span>
  );
}
