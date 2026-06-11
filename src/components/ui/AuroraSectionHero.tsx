"use client";

import { CSSProperties, useEffect, useState } from "react";

export interface BackgroundSceneProps {
  beamCount?: number;
}

const BACKGROUND_BEAM_COUNT = 42;

export default function BackgroundScene({
  beamCount = BACKGROUND_BEAM_COUNT,
}: BackgroundSceneProps) {
  const [beams, setBeams] = useState<
    Array<{ id: number; style: CSSProperties }>
  >([]);

  useEffect(() => {
    const generated = Array.from({ length: beamCount }).map((_, i) => {
      const riseDuration = Math.random() * 2 + 5;
      const fadeDuration = riseDuration;
      const driftDuration = Math.random() * 4 + 7;

      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: `${Math.floor(Math.random() * 3) + 1}px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${riseDuration}s, ${fadeDuration}s, ${driftDuration}s`,
        },
      };
    });

    setBeams(generated);
  }, [beamCount]);

  return (
    <div
      className="aurora-scene"
      role="img"
      aria-label="Animated cyan light field background"
    >
      <div className="aurora-floor" />
      <div className="aurora-main-column" />
      <div className="aurora-light-stream-container">
        {beams.map((beam) => (
          <div key={beam.id} className="aurora-light-beam" style={beam.style} />
        ))}
      </div>
    </div>
  );
}
