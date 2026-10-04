"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLiteMode } from "../hooks/use-lite-mode";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { readPalette, watchTheme, type CanvasPalette } from "../primitives/palette";

interface Star {
    x: number; // 0–1
    y: number; // 0–1
    depth: number; // 0.25–1, drives size, brightness and parallax
    phase: number;
    speed: number;
}

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Shooter {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

const PARALLAX_PX = 38;
const CURSOR_REACH = 190;

/**
 * The hero's living background: a layered star field with mouse parallax and a
 * drifting constellation whose nodes link up, and light up gold, as the cursor
 * approaches. On touch devices a slow virtual cursor wanders so the effect
 * still plays. Pauses off-screen / when the tab is hidden; draws one still
 * frame for reduced motion.
 */
export function HeroField({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lite = useLiteMode();
    const reduced = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        const host = canvas?.parentElement;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !host || !ctx) return;

        let palette: CanvasPalette = readPalette();
        let width = 0;
        let height = 0;
        let stars: Star[] = [];
        let nodes: Node[] = [];
        let linkDistance = 150;
        let shooter: Shooter | null = null;
        let nextShot = performance.now() + 3500;
        let visible = true;
        let frame = 0;
        let last = performance.now();

        const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, lastReal: 0 };
        const parallax = { x: 0, y: 0 };

        const seed = () => {
            const area = width * height;
            const starCount = Math.min(lite ? 70 : 190, Math.round(area / (lite ? 9000 : 8500)));
            const nodeCount = Math.min(lite ? 14 : 30, Math.round(area / (lite ? 26000 : 20000)));
            linkDistance = Math.max(110, Math.min(170, width / 8));

            stars = Array.from({ length: starCount }, () => ({
                x: Math.random(),
                y: Math.random(),
                depth: 0.25 + Math.random() * 0.75,
                phase: Math.random() * Math.PI * 2,
                speed: 0.4 + Math.random() * 1.1,
            }));
            nodes = Array.from({ length: nodeCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.018,
                vy: (Math.random() - 0.5) * 0.018,
            }));
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
            width = host.clientWidth;
            height = host.clientHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
            draw(performance.now(), 0);
        };

        function draw(now: number, dt: number) {
            const { star, gold, isDark } = palette;
            const starAlpha = isDark ? 0.95 : 0.6;
            const lineAlpha = isDark ? 0.2 : 0.3;

            ctx!.clearRect(0, 0, width, height);

            // Pointer easing + parallax target.
            if (pointer.active) {
                pointer.x += (pointer.tx - pointer.x) * 0.12;
                pointer.y += (pointer.ty - pointer.y) * 0.12;
            }
            const wantX = pointer.active ? pointer.x / width - 0.5 : 0;
            const wantY = pointer.active ? pointer.y / height - 0.5 : 0;
            parallax.x += (wantX - parallax.x) * 0.06;
            parallax.y += (wantY - parallax.y) * 0.06;

            // Stars
            for (const s of stars) {
                const twinkle = 0.55 + 0.45 * Math.sin(now * 0.0008 * s.speed + s.phase);
                const x = s.x * width - parallax.x * PARALLAX_PX * s.depth;
                const y = s.y * height - parallax.y * PARALLAX_PX * s.depth;
                ctx!.fillStyle = `rgba(${star}, ${(starAlpha * s.depth * twinkle).toFixed(3)})`;
                ctx!.beginPath();
                ctx!.arc(x, y, 0.5 + s.depth * 1.1, 0, Math.PI * 2);
                ctx!.fill();
            }

            // Constellation nodes
            for (const n of nodes) {
                n.x += n.vx * dt;
                n.y += n.vy * dt;
                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;
            }
            const shift = PARALLAX_PX * 0.6;
            const px = (n: Node) => n.x - parallax.x * shift;
            const py = (n: Node) => n.y - parallax.y * shift;

            ctx!.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d > linkDistance) continue;
                    ctx!.strokeStyle = `rgba(${star}, ${((1 - d / linkDistance) * lineAlpha).toFixed(3)})`;
                    ctx!.beginPath();
                    ctx!.moveTo(px(a), py(a));
                    ctx!.lineTo(px(b), py(b));
                    ctx!.stroke();
                }
            }
            for (const n of nodes) {
                const x = px(n);
                const y = py(n);
                const near = pointer.active ? Math.hypot(x - pointer.x, y - pointer.y) : Infinity;
                const reach = near < CURSOR_REACH ? 1 - near / CURSOR_REACH : 0;

                if (reach > 0) {
                    ctx!.strokeStyle = `rgba(${gold}, ${(reach * 0.6).toFixed(3)})`;
                    ctx!.beginPath();
                    ctx!.moveTo(x, y);
                    ctx!.lineTo(pointer.x, pointer.y);
                    ctx!.stroke();
                }
                ctx!.fillStyle =
                    reach > 0
                        ? `rgba(${gold}, ${(0.55 + reach * 0.45).toFixed(3)})`
                        : `rgba(${star}, ${(starAlpha * 0.55).toFixed(3)})`;
                ctx!.beginPath();
                ctx!.arc(x, y, 1.6 + reach * 2.4, 0, Math.PI * 2);
                ctx!.fill();
            }

            // Shooting star (full mode only)
            if (!lite && !reduced) {
                if (!shooter && now > nextShot) {
                    shooter = {
                        x: Math.random() * width * 0.7,
                        y: Math.random() * height * 0.4,
                        vx: 0.55 + Math.random() * 0.25,
                        vy: 0.22 + Math.random() * 0.12,
                        life: 1,
                    };
                    nextShot = now + 6000 + Math.random() * 6000;
                }
                if (shooter) {
                    shooter.x += shooter.vx * dt;
                    shooter.y += shooter.vy * dt;
                    shooter.life -= dt * 0.0011;
                    if (shooter.life <= 0) {
                        shooter = null;
                    } else {
                        const tail = 90;
                        const grad = ctx!.createLinearGradient(
                            shooter.x,
                            shooter.y,
                            shooter.x - shooter.vx * tail,
                            shooter.y - shooter.vy * tail
                        );
                        grad.addColorStop(0, `rgba(${gold}, ${shooter.life.toFixed(3)})`);
                        grad.addColorStop(1, `rgba(${gold}, 0)`);
                        ctx!.strokeStyle = grad;
                        ctx!.lineWidth = 1.4;
                        ctx!.beginPath();
                        ctx!.moveTo(shooter.x, shooter.y);
                        ctx!.lineTo(shooter.x - shooter.vx * tail, shooter.y - shooter.vy * tail);
                        ctx!.stroke();
                    }
                }
            }
        }

        const running = () => visible && !document.hidden && !reduced;

        const tick = (now: number) => {
            frame = 0;
            const dt = Math.min(50, now - last);
            last = now;

            // Touch / idle: a slow virtual cursor keeps the field alive.
            if (lite && now - pointer.lastReal > 2500) {
                pointer.tx = width * (0.5 + 0.3 * Math.sin(now / 2400));
                pointer.ty = height * (0.45 + 0.25 * Math.cos(now / 2000));
                pointer.active = true;
            }
            draw(now, dt);
            if (running()) frame = requestAnimationFrame(tick);
        };

        const sync = () => {
            if (running()) {
                last = performance.now();
                if (!frame) frame = requestAnimationFrame(tick);
            } else if (frame) {
                cancelAnimationFrame(frame);
                frame = 0;
            }
        };

        const onPointer = (event: PointerEvent) => {
            const rect = host.getBoundingClientRect();
            const inside =
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom &&
                event.clientX >= rect.left &&
                event.clientX <= rect.right;
            if (!inside) {
                pointer.active = false;
                return;
            }
            if (!pointer.active) {
                pointer.x = event.clientX - rect.left;
                pointer.y = event.clientY - rect.top;
            }
            pointer.tx = event.clientX - rect.left;
            pointer.ty = event.clientY - rect.top;
            pointer.active = true;
            pointer.lastReal = performance.now();
        };

        const intersection = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
        });
        const resizeObserver = new ResizeObserver(resize);
        const stopTheme = watchTheme(() => {
            palette = readPalette();
            if (!running()) draw(performance.now(), 0);
        });

        intersection.observe(host);
        resizeObserver.observe(host);
        window.addEventListener("pointermove", onPointer, { passive: true });
        document.addEventListener("visibilitychange", sync);
        resize();
        sync();

        return () => {
            if (frame) cancelAnimationFrame(frame);
            intersection.disconnect();
            resizeObserver.disconnect();
            stopTheme();
            window.removeEventListener("pointermove", onPointer);
            document.removeEventListener("visibilitychange", sync);
        };
    }, [lite, reduced]);

    return <canvas ref={canvasRef} className={cn("pointer-events-none", className)} aria-hidden="true" />;
}
