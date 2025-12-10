import React, { useEffect, useRef } from 'react';

const WireframeTunnel = ({
  gridColor = "rgba(255,255,255,0.1)",
  burstColor = "rgba(255,255,255,1)",
  isDark = true
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Configuration - Refined for "Spider Web" feel
    const numRings = 30;
    const numSlices = 24;
    const rotationSpeed = 0.0005; // Very slow, majestic rotation
    const speed = 0.002; // Slow tunnel movement

    // State
    let rotation = 0;
    let offset = 0;
    let pulses = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const spawnPulse = () => {
      pulses.push({
        slice: Math.floor(Math.random() * numSlices),
        depth: 0, // Starts at center
        speed: 0.02 + Math.random() * 0.01, // Fast bursts
        length: 0.05, // VERY SHORT (Sharp packet)
        opacity: 1
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = Math.sqrt(cx ** 2 + cy ** 2);

      rotation += rotationSpeed;
      offset = (offset + speed) % 1;

      // Spawn pulses less frequently for cleaner look
      if (Math.random() < 0.02) spawnPulse();

      ctx.lineWidth = 1; // Thin, sharp lines

      // Pre-calculate ring radii
      const ringRadii = [];
      for (let i = 0; i < numRings; i++) {
        const progress = (i / numRings + offset) % 1;
        // Exponential depth for tunnel feel
        const r = Math.pow(progress, 2.5) * maxRadius;
        ringRadii.push({ r, progress });
      }
      ringRadii.sort((a, b) => a.r - b.r);

      // 1. Radial Lines (Longitudinal)
      for (let s = 0; s < numSlices; s++) {
        const baseAngle = (s / numSlices) * Math.PI * 2 + rotation;

        ctx.beginPath();
        let firstPoint = true;

        for (let i = 0; i < ringRadii.length; i++) {
          const { r, progress } = ringRadii[i];
          // Organic twist: Sin wave distortion based on depth
          const twist = Math.sin(progress * Math.PI * 2) * 0.1;
          const angle = baseAngle + twist;

          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;

          if (firstPoint) { ctx.moveTo(x, y); firstPoint = false; }
          else { ctx.lineTo(x, y); }
        }
        ctx.strokeStyle = isDark ? `rgba(255,255,255,0.05)` : `rgba(0,0,0,0.05)`;
        ctx.stroke();
      }

      // 2. Concentric Rings (Transverse)
      for (let i = 0; i < ringRadii.length; i++) {
        const { r, progress } = ringRadii[i];

        ctx.beginPath();
        for (let s = 0; s <= numSlices; s++) {
          const baseAngle = (s / numSlices) * Math.PI * 2 + rotation;
          const twist = Math.sin(progress * Math.PI * 2) * 0.1;
          const angle = baseAngle + twist;

          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;

          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        // Fade out in center
        const alpha = Math.min(1, progress * 2) * 0.1;
        ctx.strokeStyle = isDark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
        ctx.stroke();
      }

      // 3. Light Bursts (Sharp & Bright)
      // No shadowBlur for sharpness
      ctx.shadowBlur = 0;
      ctx.lineCap = 'butt';

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.depth += p.speed;
        if (p.depth > 1) { pulses.splice(i, 1); continue; }

        const headDepth = p.depth;
        const tailDepth = Math.max(0, p.depth - p.length);

        const rHead = Math.pow(headDepth, 2.5) * maxRadius;
        const rTail = Math.pow(tailDepth, 2.5) * maxRadius;

        const baseAngle = (p.slice / numSlices) * Math.PI * 2 + rotation;
        const twistHead = Math.sin(headDepth * Math.PI * 2) * 0.1;
        const twistTail = Math.sin(tailDepth * Math.PI * 2) * 0.1;

        const angleHead = baseAngle + twistHead;
        const angleTail = baseAngle + twistTail;

        const xHead = cx + Math.cos(angleHead) * rHead;
        const yHead = cy + Math.sin(angleHead) * rHead;
        const xTail = cx + Math.cos(angleTail) * rTail;
        const yTail = cy + Math.sin(angleTail) * rTail;

        ctx.lineWidth = 2; // Sharp thin line
        ctx.strokeStyle = burstColor; // Pure white/black

        ctx.beginPath();
        ctx.moveTo(xTail, yTail);
        ctx.lineTo(xHead, yHead);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridColor, burstColor, isDark]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default WireframeTunnel;