"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { monitorElementActivity } from "@/lib/animationActivity";
import { useLowMotionDevice } from "@/hooks/useLowMotionDevice";

function ParticleCanvas({ lowMotion }: { lowMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    if (lowMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measureCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(bounds.width));
      canvas.height = Math.max(1, Math.floor(bounds.height));
      return bounds;
    };

    let bounds = measureCanvas();
    let W = canvas.width;
    let H = canvas.height;
    let isActive = true;

    const COUNT = prefersReduced ? 0 : Math.min(96, Math.floor((W * H) / 14500));
    const CONNECT = 190;
    const MOUSE_R = 260;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.8 + 0.7,
      alpha: Math.random() * 0.3 + 0.2,
    }));

    function tick() {
      if (!isActive) {
        rafRef.current = 0;
        return;
      }

      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (mx > -9000 && my > -9000) {
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, MOUSE_R * 0.9);
        glow.addColorStop(0, "rgba(72,202,228,0.22)");
        glow.addColorStop(0.4, "rgba(0,180,216,0.08)");
        glow.addColorStop(1, "rgba(0,180,216,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mx, my, MOUSE_R * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - mx;
        const dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < MOUSE_R && d > 0) {
          const force = (1 - d / MOUSE_R) * 0.045;
          p.vx += (dx / d) * force;
          p.vy += (dy / d) * force;
        }

        p.vx *= 0.993;
        p.vy *= 0.993;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(72,202,228,${p.alpha})`;
        ctx.fill();

        if (d < MOUSE_R) {
          const glowAlpha = (1 - d / MOUSE_R) * 0.42;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,180,216,${glowAlpha})`;
          ctx.fill();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const cdx = p.x - q.x;
          const cdy = p.y - q.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cd < CONNECT) {
            const qMouseDistance = Math.sqrt((q.x - mx) ** 2 + (q.y - my) ** 2);
            const nearMouseBoost = d < MOUSE_R || qMouseDistance < MOUSE_R ? 1.8 : 1;
            const lineAlpha = (1 - cd / CONNECT) * 0.14 * p.alpha * nearMouseBoost;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,180,216,${lineAlpha})`;
            ctx.lineWidth = nearMouseBoost > 1 ? 0.9 : 0.6;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    const updateActivity = (nextActive: boolean) => {
      isActive = nextActive;
      if (isActive && rafRef.current === 0) {
        tick();
      }
    };

    const stopMonitoring = monitorElementActivity(canvas, updateActivity, {
      threshold: 0.05,
    });

    tick();

    const syncBounds = () => {
      bounds = canvas.getBoundingClientRect();
    };

    const onResize = () => {
      bounds = measureCanvas();
      W = canvas.width;
      H = canvas.height;
    };

    // Use the cached bounds updated on resize instead of remeasuring every mousemove.
    const onMouse = (event: MouseEvent) => {
      mouseRef.current = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", syncBounds, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("mouseout", onMouseLeave);

    return () => {
      stopMonitoring();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", syncBounds);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseout", onMouseLeave);
    };
  }, [lowMotion]);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full opacity-70" />;
}

const CODE_TOKENS = [
  "0x4E2B",
  "async/await",
  "useGSAP()",
  "Web3",
  ".eth",
  "next build",
  "supabase",
  "phi(t)",
  "gsap.to()",
  "ts-node",
  "on-chain",
];

function FloatingTokens({ lowMotion }: { lowMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (lowMotion) return;

      const tokens = ref.current?.querySelectorAll<HTMLElement>("[data-token]");
      if (!tokens) return;

      tokens.forEach((token) => {
        gsap.to(token, {
          y: `${(Math.random() - 0.5) * 50}px`,
          x: `${(Math.random() - 0.5) * 24}px`,
          rotation: (Math.random() - 0.5) * 5,
          duration: 8 + Math.random() * 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: Math.random() * 5,
        });
        gsap.to(token, {
          opacity: Math.random() * 0.14 + 0.05,
          duration: 5 + Math.random() * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: Math.random() * 3,
        });
      });
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {CODE_TOKENS.map((token, i) => (
        <span
          key={token}
          data-token
          className="absolute font-mono text-[var(--blue-400)] opacity-[0.07]"
          style={{
            left: `${8 + ((i * 73) % 82)}%`,
            top: `${5 + ((i * 47) % 88)}%`,
            fontSize: `${10 + (i % 4) * 2}px`,
          }}
        >
          {token}
        </span>
      ))}
    </div>
  );
}

export function AnimatedBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lowMotion = useLowMotionDevice();

  useGSAP(
    () => {
      if (lowMotion) return;

      registerGsapPlugins();
      const root = rootRef.current;
      if (!root) return;
      const orbs = gsap.utils.toArray<HTMLElement>("[data-orb]");
      const parallaxLayers = gsap.utils.toArray<HTMLElement>("[data-parallax]");
      const cursorGlowPrimary = root.querySelector<HTMLElement>("[data-cursor-glow='primary']");
      const cursorGlowSecondary = root.querySelector<HTMLElement>("[data-cursor-glow='secondary']");
      let isActive = true;
      let bounds = root.getBoundingClientRect();

      const syncBounds = () => {
        bounds = root.getBoundingClientRect();
      };

      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          x: i % 2 === 0 ? 70 : -56,
          y: i % 2 === 0 ? -44 : 56,
          duration: 24 + i * 6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 4,
        });
      });

      const glowPrimaryX = cursorGlowPrimary
        ? gsap.quickTo(cursorGlowPrimary, "x", { duration: 0.16, ease: "power2.out" })
        : null;
      const glowPrimaryY = cursorGlowPrimary
        ? gsap.quickTo(cursorGlowPrimary, "y", { duration: 0.16, ease: "power2.out" })
        : null;
      const glowSecondaryX = cursorGlowSecondary
        ? gsap.quickTo(cursorGlowSecondary, "x", { duration: 0.28, ease: "power2.out" })
        : null;
      const glowSecondaryY = cursorGlowSecondary
        ? gsap.quickTo(cursorGlowSecondary, "y", { duration: 0.28, ease: "power2.out" })
        : null;

      // Pre-create quickTo setters for parallax layers to avoid creating new
      // tweens on every mouse move.
      const parallaxSetters = parallaxLayers.map((layer) => {
        const x = gsap.quickTo(layer, "x", { duration: 0.4, ease: "power2.out" });
        const y = gsap.quickTo(layer, "y", { duration: 0.4, ease: "power2.out" });
        const depth = Number(layer.dataset.parallax ?? 0);
        return { x, y, depth };
      });

      const onPointerMove = (event: PointerEvent) => {
        if (!isActive) return;

        const px = event.clientX - bounds.left;
        const py = event.clientY - bounds.top;
        const nx = px / bounds.width - 0.5;
        const ny = py / bounds.height - 0.5;

        glowPrimaryX?.(px);
        glowPrimaryY?.(py);
        glowSecondaryX?.(px);
        glowSecondaryY?.(py);

        parallaxSetters.forEach((s) => {
          s.x(nx * s.depth);
          s.y(ny * s.depth);
        });
      };

      const onPointerLeave = () => {
        const offscreenX = bounds.width * 0.5;
        const offscreenY = bounds.height + 200;

        glowPrimaryX?.(offscreenX);
        glowPrimaryY?.(offscreenY);
        glowSecondaryX?.(offscreenX);
        glowSecondaryY?.(offscreenY);

        parallaxSetters.forEach((s) => {
          s.x(0);
          s.y(0);
        });
      };

      const stopMonitoring = monitorElementActivity(root, (nextActive) => {
        isActive = nextActive;
        if (!isActive) {
          gsap.killTweensOf([
            cursorGlowPrimary,
            cursorGlowSecondary,
            ...parallaxLayers,
          ]);
        }
      }, { threshold: 0.05 });

      window.addEventListener("resize", syncBounds, { passive: true });
      window.addEventListener("scroll", syncBounds, { passive: true });
      root.addEventListener("pointermove", onPointerMove, { passive: true });
      root.addEventListener("pointerleave", onPointerLeave);

      return () => {
        stopMonitoring();
        window.removeEventListener("resize", syncBounds);
        window.removeEventListener("scroll", syncBounds);
        root.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerleave", onPointerLeave);
      };
    },
    { dependencies: [lowMotion], revertOnUpdate: true, scope: rootRef },
  );

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {!lowMotion ? (
        <>
          <div
            data-cursor-glow="secondary"
            className="absolute left-0 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.18),rgba(0,180,216,0.08)_32%,transparent_72%)] opacity-70 blur-3xl"
          />
          <div
            data-cursor-glow="primary"
            className="absolute left-0 top-0 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(202,240,248,0.22),rgba(72,202,228,0.14)_30%,transparent_70%)] opacity-90 blur-2xl"
          />
        </>
      ) : null}

      <div
        data-orb
        data-parallax="28"
        className="glow-orb absolute -left-40 top-10 h-[600px] w-[600px] rounded-full blur-3xl opacity-60"
      />
      <div
        data-orb
        data-parallax="22"
        className="glow-orb absolute -right-32 top-1/3 h-[700px] w-[700px] rounded-full blur-3xl opacity-38"
      />
      <div
        data-orb
        data-parallax="16"
        className="glow-orb absolute left-1/2 bottom-0 h-[500px] w-[500px] rounded-full blur-3xl opacity-28"
      />

      <ParticleCanvas lowMotion={lowMotion} />

      <div data-parallax="12" className="absolute inset-0">
        <FloatingTokens lowMotion={lowMotion} />
      </div>

      <div data-parallax="8" className="grid-bg absolute inset-0 opacity-40" />

      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#030712] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(3,7,18,0.58)_100%)]" />
    </div>
  );
}
