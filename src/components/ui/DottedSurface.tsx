"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { cn } from "@/lib/cn";
import { monitorElementActivity } from "@/lib/animationActivity";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points[];
    animationId: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const SEPARATION = 120;
    const AMOUNTX = 44;
    const AMOUNTY = 64;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050812, 1400, 6200);

    const getBounds = () => container.getBoundingClientRect();
    const initialBounds = getBounds();

    const camera = new THREE.PerspectiveCamera(
      58,
      initialBounds.width / Math.max(initialBounds.height, 1),
      1,
      10000,
    );
    camera.position.set(0, 380, 1460);
    camera.lookAt(0, -260, -420);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialBounds.width, initialBounds.height);
    renderer.setClearColor(scene.fog.color, 0);

    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];
    const geometry = new THREE.BufferGeometry();

    const isDark = theme !== "light";
    const baseColor = isDark
      ? new THREE.Color("#98cfd9")
      : new THREE.Color("#0f1729");

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        colors.push(baseColor.r, baseColor.g, baseColor.b);
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.position.set(0, -220, -480);
    points.rotation.x = -0.18;
    scene.add(points);

    let count = 0;
    let animationId = 0;
    let isActive = true;

    const animate = () => {
      if (!isActive) {
        animationId = 0;
        return;
      }

      animationId = window.requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const coords = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;
          coords[index + 1] =
            Math.sin((ix * 0.45) + count * 0.65) * 60 +
            Math.cos((iy * 0.35) + count * 0.82) * 52;
          i++;
        }
      }

      points.rotation.z = Math.sin(count * 0.08) * 0.018;
      camera.position.x = Math.sin(count * 0.1) * 8;
      camera.position.y = 380 + Math.cos(count * 0.12) * 5;
      camera.lookAt(0, -260, -420);

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.045;
    };

    const handleResize = () => {
      const bounds = getBounds();
      camera.aspect = bounds.width / Math.max(bounds.height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(bounds.width, bounds.height);
    };

    const stopMonitoring = monitorElementActivity(container, (nextActive) => {
      isActive = nextActive;
      if (isActive && animationId === 0) {
        animate();
      }
    }, { threshold: 0.05 });

    window.addEventListener("resize", handleResize);
    animate();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles: [points],
      animationId,
      count,
    };

    return () => {
      stopMonitoring();
      window.removeEventListener("resize", handleResize);

      if (sceneRef.current) {
        window.cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((entry) => entry.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        sceneRef.current.renderer.dispose();
        if (containerRef.current && sceneRef.current.renderer.domElement) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    />
  );
}
