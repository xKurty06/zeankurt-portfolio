"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins, SplitText } from "@/lib/gsap";

interface TextRevealProps {
  children: string;
  /** HTML tag to render */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  /** Split by "chars" or "words" */
  splitBy?: "chars" | "words";
  /** Stagger between each unit */
  stagger?: number;
}

/**
 * Cinematic text reveal — splits text into chars/words and animates them in
 * with a clip-path mask effect, similar to Sui.io / Polygon hero headings.
 */
export function TextReveal({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  splitBy = "words",
  stagger = 0.04,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();
      const el = ref.current;
      if (!el) return;

      const split = new SplitText(el, {
        type: splitBy,
        // Wrap each in a mask container for clip-path reveal
        [splitBy === "chars" ? "charsClass" : "wordsClass"]: "overflow-hidden inline-block",
      });

      const targets = splitBy === "chars" ? split.chars : split.words;

      gsap.fromTo(
        targets,
        { y: "110%", autoAlpha: 0 },
        {
          y: "0%",
          autoAlpha: 1,
          duration: 0.75,
          delay,
          stagger,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
          onComplete: () => split.revert(),
        },
      );
    },
    { scope: ref },
  );

  // Cast to suppress TS generic tag issue
  const Element = Tag as React.ElementType;

  return (
    <Element ref={ref} className={className}>
      {children}
    </Element>
  );
}
