"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterCycleProps {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
}

/**
 * Types through a list of phrases, deletes them, and loops.
 * Pure React state — no GSAP needed, no rAF conflict.
 */
export function TypewriterCycle({
  phrases,
  className,
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseMs = 1800,
}: TypewriterCycleProps) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showCaret, setShowCaret] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Blink caret
  useEffect(() => {
    const id = setInterval(() => setShowCaret((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const phrase = phrases[phraseIdx % phrases.length];

    if (!deleting && displayed === phrase) {
      // Pause at full phrase then start deleting
      timerRef.current = setTimeout(() => setDeleting(true), pauseMs);
      return;
    }

    if (deleting && displayed === "") {
      // Move to next phrase
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
      return;
    }

    timerRef.current = setTimeout(
      () => {
        setDisplayed(deleting
          ? phrase.slice(0, displayed.length - 1)
          : phrase.slice(0, displayed.length + 1),
        );
      },
      deleting ? deletingSpeed : typingSpeed,
    );

    return () => clearTimeout(timerRef.current);
  }, [displayed, deleting, phraseIdx, phrases, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className}>
      {displayed}
      <span
        aria-hidden
        className="ml-0.5 inline-block w-[2px] rounded-full align-middle"
        style={{
          height: "0.9em",
          background: "var(--blue-400)",
          opacity: showCaret ? 1 : 0,
          transition: "opacity 0.1s",
        }}
      />
    </span>
  );
}
