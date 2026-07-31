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
    const COUNT = isSmall ? 80 : 140;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Initialize stars
    starsRef.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.4 + 0.4,
      speed: Math.random() * 0.25 + 0.05,      // slow upward drift
      opacity: Math.random() * 0.4 + 0.1,
      opacityDelta: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
    }));

    const drawNebula = () => {
      // Nebula glow — drawn once per frame but cheap (just 2 radial gradients)
      const g1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 0,
        canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.4,
      );
      g1.addColorStop(0, 'rgba(59,130,246,0.07)');
      g1.addColorStop(1, 'transparent');

      const g2 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.7, 0,
        canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.4,
      );
      g2.addColorStop(0, 'rgba(167,139,250,0.05)');
      g2.addColorStop(1, 'transparent');

      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebula();

      const stars = starsRef.current;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Twinkle
        s.opacity += s.opacityDelta;
        if (s.opacity > 0.7 || s.opacity < 0.05) s.opacityDelta *= -1;

        // Drift upward
        if (!prefersReduced) {
          s.y -= s.speed;
          if (s.y < -2) {
            s.y = canvas.height + 2;
            s.x = Math.random() * canvas.width;
          }
        }

        // Draw star (single arc call per star — very fast)
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity.toFixed(2)})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      resize();
      // Redistribute stars on resize
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
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />
      {/* Nebula static layer — CSS only, zero JS cost */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59,130,246,0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(167,139,250,0.1) 0%, transparent 40%)
          `,
        }}
        aria-hidden="true"
      />    
    </>
  );
};

export default React.memo(StarsBackground);