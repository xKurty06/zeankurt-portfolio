"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type BackgroundBoxesProps = React.HTMLAttributes<HTMLDivElement> & {
  rows?: number;
  cols?: number;
  variant?: "default" | "full";
};

function BackgroundBoxesCore({
  className,
  rows: rowCount = 150,
  cols: colCount = 100,
  variant = "default",
  ...rest
}: BackgroundBoxesProps) {
  const rows = new Array(rowCount).fill(1);
  const cols = new Array(colCount).fill(1);

  const colors = [
    "rgb(125 211 252)",
    "rgb(249 168 212)",
    "rgb(134 239 172)",
    "rgb(253 224 71)",
    "rgb(252 165 165)",
    "rgb(216 180 254)",
    "rgb(147 197 253)",
    "rgb(165 180 252)",
    "rgb(196 181 253)",
  ];

  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div
      style={{
        transform:
          variant === "full"
            ? "translate(-50%,-50%) skewX(-48deg) skewY(14deg) scale(1.02) rotate(0deg) translateZ(0)"
            : "translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)",
      }}
      className={cn(
        variant === "full"
          ? "pointer-events-auto absolute left-1/2 top-1/2 z-0 flex h-[190%] w-[190%] overflow-hidden p-4"
          : "absolute left-1/4 -top-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden p-4",
        className,
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row${i}`}
          className="relative h-8 w-16 border-l border-slate-700"
        >
          {cols.map((_, j) => (
            <motion.div
              key={`col${i}-${j}`}
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              animate={{
                transition: { duration: 2 },
              }}
              className="relative h-8 w-16 border-r border-t border-slate-700"
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <Plus className="pointer-events-none absolute -left-[22px] -top-[14px] h-6 w-10 text-slate-700 stroke-[1px]" />
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export const BackgroundBoxes = React.memo(BackgroundBoxesCore);
