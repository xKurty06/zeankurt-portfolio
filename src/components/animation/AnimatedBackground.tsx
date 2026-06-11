"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

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

    tick();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const onMouse = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

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

function FloatingTokens() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
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
    { scope: ref },
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

  useGSAP(
    () => {
      registerGsapPlugins();
      const orbs = gsap.utils.toArray<HTMLElement>("[data-orb]");
      const parallaxLayers = gsap.utils.toArray<HTMLElement>("[data-parallax]");
      const cursorGlowPrimary = rootRef.current?.querySelector<HTMLElement>("[data-cursor-glow='primary']");
      const cursorGlowSecondary = rootRef.current?.querySelector<HTMLElement>("[data-cursor-glow='secondary']");

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
        ? gsap.quickTo(cursorGlowPrimary, "x", { duration: 0.45, ease: "power3.out" })
        : null;
      const glowPrimaryY = cursorGlowPrimary
        ? gsap.quickTo(cursorGlowPrimary, "y", { duration: 0.45, ease: "power3.out" })
        : null;
      const glowSecondaryX = cursorGlowSecondary
        ? gsap.quickTo(cursorGlowSecondary, "x", { duration: 0.75, ease: "power3.out" })
        : null;
      const glowSecondaryY = cursorGlowSecondary
        ? gsap.quickTo(cursorGlowSecondary, "y", { duration: 0.75, ease: "power3.out" })
        : null;

      const onMouseMove = (event: MouseEvent) => {
        const px = event.clientX;
        const py = event.clientY;
        const nx = px / window.innerWidth - 0.5;
        const ny = py / window.innerHeight - 0.5;

        glowPrimaryX?.(px);
        glowPrimaryY?.(py);
        glowSecondaryX?.(px);
        glowSecondaryY?.(py);

        parallaxLayers.forEach((layer) => {
          const depth = Number(layer.dataset.parallax ?? 0);
          gsap.to(layer, {
            x: nx * depth,
            y: ny * depth,
            duration: 0.8,
            ease: "power3.out",
            overwrite: "auto",
          });
        });
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        data-cursor-glow="secondary"
        className="absolute left-0 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(72,202,228,0.18),rgba(0,180,216,0.08)_32%,transparent_72%)] opacity-70 blur-3xl"
      />
      <div
        data-cursor-glow="primary"
        className="absolute left-0 top-0 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(202,240,248,0.22),rgba(72,202,228,0.14)_30%,transparent_70%)] opacity-90 blur-2xl"
      />

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

      <ParticleCanvas />

      <div data-parallax="12" className="absolute inset-0">
        <FloatingTokens />
      </div>

      <div data-parallax="8" className="grid-bg absolute inset-0 opacity-40" />

      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#030712] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(3,7,18,0.58)_100%)]" />
    </div>
  );
}
