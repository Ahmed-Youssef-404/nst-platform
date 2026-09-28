"use client";

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  opacityDelta: number;
}

const StarsBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 768;
    const COUNT = isSmall ? 60 : 100;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Initialize stars with calm, subtle ambient opacity
    starsRef.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.15 + 0.03, // serene upward drift
      opacity: Math.random() * 0.25 + 0.05,
      opacityDelta: (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
    }));

    const drawNebula = (isDark: boolean) => {
      // Nebula glow — soft atmospheric depth without overpowering content
      const g1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 0,
        canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.45,
      );
      if (isDark) {
        g1.addColorStop(0, 'rgba(59,130,246,0.05)');
        g1.addColorStop(1, 'transparent');
      } else {
        g1.addColorStop(0, 'rgba(232,184,74,0.03)');
        g1.addColorStop(1, 'transparent');
      }

      const g2 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.7, 0,
        canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.45,
      );
      if (isDark) {
        g2.addColorStop(0, 'rgba(167,139,250,0.04)');
        g2.addColorStop(1, 'transparent');
      } else {
        g2.addColorStop(0, 'rgba(77,145,217,0.03)');
        g2.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      drawNebula(isDark);

      const stars = starsRef.current;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Twinkle capped so it never glares
        s.opacity += s.opacityDelta;
        if (s.opacity > 0.4 || s.opacity < 0.05) s.opacityDelta *= -1;

        // Drift upward
        if (!prefersReduced) {
          s.y -= s.speed;
          if (s.y < -2) {
            s.y = canvas.height + 2;
            s.x = Math.random() * canvas.width;
          }
        }

        // Draw star with theme-tailored tones
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `rgba(247,244,237,${s.opacity.toFixed(2)})`;
        } else {
          // Warm ethereal golden-slate particle in light mode
          ctx.fillStyle = `rgba(184,120,14,${(s.opacity * 0.5).toFixed(2)})`;
        }
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      resize();
      starsRef.current.forEach(s => {
        s.x = Math.random() * canvas.width;
        s.y = Math.random() * canvas.height;
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none opacity-85"
        aria-hidden="true"
      />
      {/* Nebula static ambient layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20 dark:opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59,130,246,0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(232,184,74,0.06) 0%, transparent 40%)
          `,
        }}
        aria-hidden="true"
      />
      {/* Readability backdrop veil to keep foreground content 100% crisp and readable */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-space-950/15 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />
    </>
  );
};

export default React.memo(StarsBackground);