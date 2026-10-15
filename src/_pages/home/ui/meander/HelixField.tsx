'use client';

import { useEffect, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';

/* ─────────────────────────────────────────────
   DNA HELIX / HOURGLASS GALAXY FIELD
   Canvas-rendered double helix of glowing dots
   that responds to scroll with rotation and
   pulsing. Hourglass shape narrows at center.
   Loaded via next/dynamic with ssr:false.
   ───────────────────────────────────────────── */
export interface HelixFieldProps {
  scrollProgress: MotionValue<number>;
  isDark: boolean;
}

export function HelixField({ scrollProgress, isDark }: HelixFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef(0);
  const timeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Track scroll via motion value
  useMotionValueEvent(scrollProgress, 'change', (v) => {
    scrollRef.current = v;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const scroll = scrollRef.current;
      const time = timeRef.current;

      // Clear with transparency
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w * dpr, h * dpr);
      ctx.save();
      // Reset scale since we already set it in resize
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const centerX = w / 2;
      const dotCount = 70;
      const baseAmp = Math.min(w * 0.12, 140);
      // Scroll drives the helix rotation — 6 full twists over the scroll range
      const phaseShift = scroll * Math.PI * 8;
      // Gentle autonomous drift so it feels alive even without scrolling
      const liveDrift = time * 0.3;

      // ─── CONNECTING RUNGS (draw first, behind dots) ───
      for (let i = 0; i < dotCount; i += 3) {
        const t = i / (dotCount - 1);
        const y = h * 0.03 + t * h * 0.94;

        // Hourglass: amplitude is large at top/bottom, narrow at center
        const hourglassFactor = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(Math.PI * t)), 0.6);
        const amp = baseAmp * hourglassFactor;

        const theta1 = t * Math.PI * 5 + phaseShift + liveDrift;
        const theta2 = theta1 + Math.PI;
        const x1 = centerX + amp * Math.sin(theta1);
        const x2 = centerX + amp * Math.sin(theta2);

        const z1 = Math.cos(theta1);
        const z2 = Math.cos(theta2);
        const avgZ = (z1 + z2) / 2;

        // Only draw rungs that face the viewer
        if (avgZ > -0.2) {
          const rungAlpha = Math.max(0, (avgZ + 0.2) * 0.12);
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          // Magenta / rose rungs
          ctx.strokeStyle = `rgba(236, 72, 153, ${rungAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // ─── DOT STRANDS ───
      const colors: readonly [(alpha: number) => string, (alpha: number) => string] = [
        // Strand A: cyan → electric blue gradient
        (alpha) => {
          const r = 6,
            g = 182,
            b = 212;
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
        // Strand B: violet → purple gradient
        (alpha) => {
          const r = 139,
            g = 92,
            b = 246;
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
      ];

      for (let strand = 0; strand < 2; strand++) {
        const strandOffset = strand * Math.PI;
        // Subtle color shift based on vertical position
        const colorFn = strand === 0 ? colors[0] : colors[1];

        for (let i = 0; i < dotCount; i++) {
          const t = i / (dotCount - 1); // 0→1 top→bottom
          const y = h * 0.03 + t * h * 0.94;

          // Hourglass amplitude modulation
          const hourglassFactor = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(Math.PI * t)), 0.6);
          const amp = baseAmp * hourglassFactor;

          const theta = t * Math.PI * 5 + phaseShift + liveDrift + strandOffset;
          const x = centerX + amp * Math.sin(theta);

          // Z-depth for pseudo-3D — dots in front are bigger/brighter
          const z = Math.cos(theta);
          const depthScale = 0.5 + (z + 1) * 0.5; // 0→1 range
          const size = 1.2 + depthScale * 2.0;
          const alpha = 0.15 + depthScale * 0.65;

          // Outer glow (only for front-facing dots)
          if (z > 0) {
            ctx.beginPath();
            ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = colorFn(alpha * 0.08);
            ctx.fill();
          }

          // Core dot
          ctx.beginPath();
          ctx.arc(x, y, Math.max(size, 0.6), 0, Math.PI * 2);
          ctx.fillStyle = colorFn(alpha);
          ctx.fill();

          // Bright white center for the frontmost dots
          if (z > 0.7) {
            ctx.beginPath();
            ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${(z - 0.7) * 1.5})`;
            ctx.fill();
          }
        }
      }

      // ─── ACCENT: BRIGHT TRAVELING PULSE ───
      // A bright dot that races along strand A, position tied to scroll
      const pulseT = (scroll * 3 + time * 0.05) % 1;
      const pulseY = h * 0.03 + pulseT * h * 0.94;
      const pulseHourglass = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(Math.PI * pulseT)), 0.6);
      const pulseAmp = baseAmp * pulseHourglass;
      const pulseTheta = pulseT * Math.PI * 5 + phaseShift + liveDrift;
      const pulseX = centerX + pulseAmp * Math.sin(pulseTheta);
      const pulseZ = Math.cos(pulseTheta);

      if (pulseZ > 0) {
        // Large outer halo
        const grad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 20);
        grad.addColorStop(0, `rgba(6, 182, 212, ${0.4 * pulseZ})`);
        grad.addColorStop(0.5, `rgba(139, 92, 246, ${0.15 * pulseZ})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 20, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core white dot
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulseZ})`;
        ctx.fill();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[6]"
      style={{ opacity: 0.75 }}
    />
  );
}
