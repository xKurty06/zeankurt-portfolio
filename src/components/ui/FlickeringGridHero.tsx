"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
}

type GridState = {
  cols: number;
  rows: number;
  squares: Float32Array;
  dpr: number;
};

function getRgbPrefix(color: string) {
  if (typeof window === "undefined") {
    return "rgba(0, 0, 0,";
  }

  const resolvedColor = color.startsWith("var(")
    ? getComputedStyle(document.documentElement)
        .getPropertyValue(color.slice(4, -1).trim())
        .trim() || color
    : color;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "rgba(0, 0, 0,";
  }

  ctx.fillStyle = resolvedColor;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return `rgba(${r}, ${g}, ${b},`;
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lowMotion = useLowMotionDevice();
  const frameRef = useRef<number | null>(null);
  const isInViewRef = useRef(false);
  const gridRef = useRef<GridState | null>(null);
  const colorPrefixRef = useRef("rgba(0, 0, 0,");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    colorPrefixRef.current = getRgbPrefix(color);
  }, [color]);

  useEffect(() => {
    if (lowMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = (nextWidth: number, nextHeight: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = nextWidth * dpr;
      canvas.height = nextHeight * dpr;
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      setCanvasSize({ width: nextWidth, height: nextHeight });

      const cols = Math.floor(nextWidth / (squareSize + gridGap));
      const rows = Math.floor(nextHeight / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);

      for (let i = 0; i < squares.length; i += 1) {
        squares[i] = Math.random() * maxOpacity;
      }

      gridRef.current = { cols, rows, squares, dpr };
    };

    const drawGrid = () => {
      const grid = gridRef.current;
      if (!grid) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let col = 0; col < grid.cols; col += 1) {
        for (let row = 0; row < grid.rows; row += 1) {
          const opacity = grid.squares[col * grid.rows + row];
          ctx.fillStyle = `${colorPrefixRef.current}${opacity})`;
          ctx.fillRect(
            col * (squareSize + gridGap) * grid.dpr,
            row * (squareSize + gridGap) * grid.dpr,
            squareSize * grid.dpr,
            squareSize * grid.dpr,
          );
        }
      }
    };

    const updateSquares = (deltaTime: number) => {
      const grid = gridRef.current;
      if (!grid) return;

      for (let i = 0; i < grid.squares.length; i += 1) {
        if (Math.random() < flickerChance * deltaTime) {
          grid.squares[i] = Math.random() * maxOpacity;
        }
      }
    };

    const updateCanvasSize = () => {
      const nextWidth = width ?? container.clientWidth;
      const nextHeight = height ?? container.clientHeight;
      setupCanvas(nextWidth, nextHeight);
      drawGrid();
    };

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInViewRef.current) {
        frameRef.current = null;
        return;
      }

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      updateSquares(deltaTime);
      drawGrid();
      frameRef.current = window.requestAnimationFrame(animate);
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isInViewRef.current = Boolean(entry?.isIntersecting);

      if (isInViewRef.current && frameRef.current === null) {
        lastTime = performance.now();
        frameRef.current = window.requestAnimationFrame(animate);
      }
    });

    intersectionObserver.observe(container);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [flickerChance, gridGap, height, lowMotion, maxOpacity, squareSize, width]);

  if (lowMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
}
