"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface BoxesProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  cols?: number;
}

const THEME_COLORS = [
  "rgba(72, 202, 228, 0.52)",
  "rgba(0, 180, 216, 0.44)",
  "rgba(144, 224, 239, 0.4)",
  "rgba(202, 240, 248, 0.32)",
  "rgba(59, 130, 246, 0.34)",
];

function BackgroundBoxesCore({
  className,
  rows = 28,
  cols = 18,
  ...rest
}: BoxesProps) {
  const rowItems = Array.from({ length: rows }, (_, index) => index);
  const colItems = Array.from({ length: cols }, (_, index) => index);

  const getRandomColor = () =>
    THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];

  return (
    <div
      style={{
        transform:
          "translate(-18%,-48%) skewX(-38deg) skewY(10deg) scale(0.96) rotate(0deg) translateZ(0)",
      }}
      className={cn(
        "absolute left-1/2 top-1/2 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4 pointer-events-auto",
        className,
      )}
      {...rest}
    >
      {rowItems.map((row) => (
        <motion.div
          key={`row-${row}`}
          className="relative h-8 w-16 border-l border-[rgba(72,202,228,0.18)]"
          animate={{
            opacity: [0.62, 0.82, 0.62],
          }}
          transition={{
            duration: 7 + (row % 5),
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          {colItems.map((col) => (
            <motion.div
              key={`col-${row}-${col}`}
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              animate={{
                opacity: [0.82, 1, 0.82],
              }}
              transition={{
                duration: 5 + ((row + col) % 4),
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: ((row * 3 + col) % 12) * 0.12,
              }}
              className="relative h-8 w-16 border-r border-t border-[rgba(72,202,228,0.18)]"
            >
              {col % 2 === 0 && row % 2 === 0 ? (
                <Plus className="pointer-events-none absolute -left-[20px] -top-[13px] h-6 w-10 text-[rgba(72,202,228,0.22)] stroke-[1px]" />
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export const BackgroundBoxes = React.memo(BackgroundBoxesCore);
