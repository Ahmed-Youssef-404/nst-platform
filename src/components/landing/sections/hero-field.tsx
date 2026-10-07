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
    baseSize: number;
    isGold: boolean;
    hasCrossGlow: boolean;
    // Dynamic interactive displacement
    ox: number; // offset x (pixels)
    oy: number; // offset y (pixels)
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
    tailLength: number;
    thickness: number;
    life: number; // 1 -> 0
    decay: number;
    colorGold: boolean;
}

interface StardustSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
}

const PARALLAX_PX = 46;
const CURSOR_REACH = 240;
const STAR_INTERACTION_RADIUS = 220;

/**
 * Enhanced Hero Celestial Field:
 * - Rich star field with 400+ stars, golden stellar gems, and cross diffraction flares.
 * - Multi-meteor shooting star engine with high cadence, particle sparks, and glowing tails.
 * - Interactive mouse physics: gravitational magnification, elastic repulsion,
 *   golden constellation conduits, and velocity-triggered meteors.
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
        let shooters: Shooter[] = [];
        let sparks: StardustSpark[] = [];
        let linkDistance = 160;
        let nextShotTime = performance.now() + 1200;
        let visible = true;
        let frame = 0;
        let lastTime = performance.now();

        const pointer = {
            x: 0,
            y: 0,
            tx: 0,
            ty: 0,
            vx: 0,
            vy: 0,
            prevX: 0,
            prevY: 0,
            active: false,
            lastReal: 0,
        };
        const parallax = { x: 0, y: 0 };

        const spawnShooter = (originX?: number, originY?: number, angleDeg?: number) => {
            const angle = angleDeg !== undefined
                ? (angleDeg * Math.PI) / 180
                : 0.45 + (Math.random() - 0.5) * 0.35; // ~25° to ~45° downward angle

            const speed = 0.85 + Math.random() * 0.45;
            const sx = originX !== undefined ? originX : Math.random() * width * 0.85;
            const sy = originY !== undefined ? originY : Math.random() * height * 0.45;

            shooters.push({
                x: sx,
                y: sy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                tailLength: 110 + Math.random() * 80,
                thickness: 1.4 + Math.random() * 1.2,
                life: 1,
                decay: 0.0009 + Math.random() * 0.0006,
                colorGold: Math.random() > 0.25,
            });
        };

        const seed = () => {
            const area = width * height;
            // Increased star count: ~380-450 on desktop, ~140 on lite
            const starCount = Math.min(lite ? 140 : 420, Math.round(area / (lite ? 5500 : 3800)));
            // Increased constellation nodes
            const nodeCount = Math.min(lite ? 18 : 46, Math.round(area / (lite ? 24000 : 16000)));
            linkDistance = Math.max(120, Math.min(190, width / 7));

            stars = Array.from({ length: starCount }, (_, i) => {
                const depth = 0.2 + Math.random() * 0.8;
                const isGold = i % 7 === 0;
                const hasCrossGlow = !lite && isGold && Math.random() > 0.6;
                const baseSize = hasCrossGlow
                    ? 1.0 + Math.random() * 1.0      // كان 2.2 + 1.2
                    : isGold
                        ? 0.7 + Math.random() * 0.8      // كان 1.5 + 1.0
                        : 0.2 + depth * 0.6;

                return {
                    x: Math.random(),
                    y: Math.random(),
                    depth,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 1.3,
                    baseSize,
                    isGold,
                    hasCrossGlow,
                    ox: 0,
                    oy: 0,
                };
            });

            nodes = Array.from({ length: nodeCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.024,
                vy: (Math.random() - 0.5) * 0.024,
            }));

            shooters = [];
            sparks = [];
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
            const starAlpha = isDark ? 0.95 : 0.65;
            const lineAlpha = isDark ? 0.22 : 0.32;

            ctx!.clearRect(0, 0, width, height);

            // Pointer easing and velocity
            if (pointer.active) {
                pointer.vx = (pointer.tx - pointer.x) * 0.16;
                pointer.vy = (pointer.ty - pointer.y) * 0.16;
                pointer.x += pointer.vx;
                pointer.y += pointer.vy;

                // Fast cursor sweeps trigger shooting stars
                const cursorSpeed = Math.hypot(pointer.vx, pointer.vy);
                if (!lite && !reduced && cursorSpeed > 32 && Math.random() > 0.88 && shooters.length < 4) {
                    spawnShooter(pointer.x, pointer.y, (Math.atan2(pointer.vy, pointer.vx) * 180) / Math.PI);
                }
            }

            const wantX = pointer.active ? pointer.x / width - 0.5 : 0;
            const wantY = pointer.active ? pointer.y / height - 0.5 : 0;
            parallax.x += (wantX - parallax.x) * 0.07;
            parallax.y += (wantY - parallax.y) * 0.07;

            // Ambient Cursor Aura Glow
            if (pointer.active) {
                const aura = ctx!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 140);
                aura.addColorStop(0, `rgba(${gold}, 0.12)`);
                aura.addColorStop(0.5, `rgba(${gold}, 0.04)`);
                aura.addColorStop(1, "transparent");
                ctx!.fillStyle = aura;
                ctx!.beginPath();
                ctx!.arc(pointer.x, pointer.y, 140, 0, Math.PI * 2);
                ctx!.fill();
            }

            // ------------------------------------------------ Stars Layer ---
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const twinkle = 0.5 + 0.5 * Math.sin(now * 0.0009 * s.speed + s.phase);

                let targetX = s.x * width - parallax.x * PARALLAX_PX * s.depth;
                let targetY = s.y * height - parallax.y * PARALLAX_PX * s.depth;

                // Mouse interaction with stars (magnification & elastic displacement)
                let lensFactor = 1;
                let isNearCursor = false;

                if (pointer.active) {
                    const dx = targetX - pointer.x;
                    const dy = targetY - pointer.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < STAR_INTERACTION_RADIUS) {
                        isNearCursor = true;
                        const factor = 1 - dist / STAR_INTERACTION_RADIUS;
                        lensFactor = 1 + factor * 1.8;

                        // Gentle elastic repulsion push away from cursor
                        const push = factor * 22 * s.depth;
                        const angle = Math.atan2(dy, dx);
                        s.ox += (Math.cos(angle) * push - s.ox) * 0.12;
                        s.oy += (Math.sin(angle) * push - s.oy) * 0.12;
                    } else {
                        s.ox *= 0.88;
                        s.oy *= 0.88;
                    }
                } else {
                    s.ox *= 0.88;
                    s.oy *= 0.88;
                }

                const px = targetX + s.ox;
                const py = targetY + s.oy;
                const currentRadius = s.baseSize * lensFactor;

                // Color selection
                const colorRgb = s.isGold || isNearCursor ? gold : star;
                const alpha = Math.min(1, starAlpha * s.depth * twinkle * (isNearCursor ? 1.5 : 1));

                // Bright stars with cross diffraction halo
                if (s.hasCrossGlow || (isNearCursor && s.depth > 0.65)) {
                    ctx!.strokeStyle = `rgba(${gold}, ${(alpha * 0.65).toFixed(3)})`;
                    ctx!.lineWidth = 0.75;
                    const arm = currentRadius * 3.5;
                    ctx!.beginPath();
                    ctx!.moveTo(px - arm, py);
                    ctx!.lineTo(px + arm, py);
                    ctx!.moveTo(px, py - arm);
                    ctx!.lineTo(px, py + arm);
                    ctx!.stroke();

                    // Soft radial star glow
                    const halo = ctx!.createRadialGradient(px, py, 0, px, py, currentRadius * 3);
                    halo.addColorStop(0, `rgba(${gold}, ${(alpha * 0.45).toFixed(3)})`);
                    halo.addColorStop(1, "transparent");
                    ctx!.fillStyle = halo;
                    ctx!.beginPath();
                    ctx!.arc(px, py, currentRadius * 3, 0, Math.PI * 2);
                    ctx!.fill();
                }

                // Core Star Body
                ctx!.fillStyle = `rgba(${colorRgb}, ${alpha.toFixed(3)})`;
                ctx!.beginPath();
                ctx!.arc(px, py, currentRadius, 0, Math.PI * 2);
                ctx!.fill();
            }

            // --------------------------------- Constellation Nodes & Mesh ---
            for (const n of nodes) {
                n.x += n.vx * dt;
                n.y += n.vy * dt;
                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;
            }

            const shift = PARALLAX_PX * 0.65;
            const px = (n: Node) => n.x - parallax.x * shift;
            const py = (n: Node) => n.y - parallax.y * shift;

            ctx!.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d > linkDistance) continue;

                    // Near cursor lines illuminate gold
                    const midX = (px(a) + px(b)) / 2;
                    const midY = (py(a) + py(b)) / 2;
                    const nearPointer = pointer.active && Math.hypot(midX - pointer.x, midY - pointer.y) < CURSOR_REACH;
                    const colorStr = nearPointer ? gold : star;
                    const lineAlphaMultiplier = nearPointer ? 0.55 : lineAlpha;

                    ctx!.strokeStyle = `rgba(${colorStr}, ${((1 - d / linkDistance) * lineAlphaMultiplier).toFixed(3)})`;
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

                // Dynamic conduit link to the mouse cursor
                if (reach > 0) {
                    ctx!.strokeStyle = `rgba(${gold}, ${(reach * 0.75).toFixed(3)})`;
                    ctx!.lineWidth = 1 + reach * 1.5;
                    ctx!.beginPath();
                    ctx!.moveTo(x, y);
                    ctx!.lineTo(pointer.x, pointer.y);
                    ctx!.stroke();
                }

                ctx!.fillStyle = reach > 0
                    ? `rgba(${gold}, ${(0.6 + reach * 0.4).toFixed(3)})`
                    : `rgba(${star}, ${(starAlpha * 0.55).toFixed(3)})`;

                ctx!.beginPath();
                ctx!.arc(x, y, 1.8 + reach * 3, 0, Math.PI * 2);
                ctx!.fill();
            }

            // --------------------------------- Shooting Stars & Particles ---
            if (!lite && !reduced) {
                // High cadence spawn: every 1.8s - 3.2s
                if (now > nextShotTime && shooters.length < 3) {
                    spawnShooter();
                    // 35% chance to spawn a second companion meteor!
                    if (Math.random() > 0.65) {
                        spawnShooter(undefined, undefined, 30 + Math.random() * 20);
                    }
                    nextShotTime = now + 1800 + Math.random() * 2200;
                }

                // Render Shooting Stars
                for (let i = shooters.length - 1; i >= 0; i--) {
                    const sh = shooters[i];
                    sh.x += sh.vx * dt;
                    sh.y += sh.vy * dt;
                    sh.life -= dt * sh.decay;

                    if (sh.life <= 0 || sh.x > width + 200 || sh.y > height + 200) {
                        shooters.splice(i, 1);
                        continue;
                    }

                    // Near-mouse meteor flare boost
                    const nearCursor = pointer.active && Math.hypot(sh.x - pointer.x, sh.y - pointer.y) < 220;
                    const lifeAlpha = Math.min(1, sh.life * (nearCursor ? 1.4 : 1));

                    // Add sparkling dust tail behind the head
                    if (Math.random() > 0.45 && sparks.length < 80) {
                        sparks.push({
                            x: sh.x - sh.vx * (Math.random() * 20),
                            y: sh.y - sh.vy * (Math.random() * 20),
                            vx: (Math.random() - 0.5) * 0.2,
                            vy: (Math.random() - 0.5) * 0.2,
                            alpha: lifeAlpha * 0.8,
                            size: 1 + Math.random() * 1.5,
                        });
                    }

                    const tailX = sh.x - sh.vx * sh.tailLength;
                    const tailY = sh.y - sh.vy * sh.tailLength;

                    // Radiant gradient tail
                    const tailGrad = ctx!.createLinearGradient(sh.x, sh.y, tailX, tailY);
                    const headColor = sh.colorGold ? gold : "255, 255, 255";
                    tailGrad.addColorStop(0, `rgba(${headColor}, ${lifeAlpha.toFixed(3)})`);
                    tailGrad.addColorStop(0.2, `rgba(${gold}, ${(lifeAlpha * 0.8).toFixed(3)})`);
                    tailGrad.addColorStop(1, "transparent");

                    ctx!.strokeStyle = tailGrad;
                    ctx!.lineWidth = sh.thickness * (nearCursor ? 1.6 : 1);
                    ctx!.lineCap = "round";
                    ctx!.beginPath();
                    ctx!.moveTo(sh.x, sh.y);
                    ctx!.lineTo(tailX, tailY);
                    ctx!.stroke();

                    // Glowing Diamond Head
                    const headHalo = ctx!.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 10);
                    headHalo.addColorStop(0, `rgba(255, 255, 255, ${lifeAlpha.toFixed(3)})`);
                    headHalo.addColorStop(0.4, `rgba(${gold}, ${(lifeAlpha * 0.85).toFixed(3)})`);
                    headHalo.addColorStop(1, "transparent");
                    ctx!.fillStyle = headHalo;
                    ctx!.beginPath();
                    ctx!.arc(sh.x, sh.y, 10, 0, Math.PI * 2);
                    ctx!.fill();
                }

                // Render Stardust Sparks
                for (let i = sparks.length - 1; i >= 0; i--) {
                    const sp = sparks[i];
                    sp.x += sp.vx * dt;
                    sp.y += sp.vy * dt;
                    sp.alpha -= dt * 0.0022;

                    if (sp.alpha <= 0) {
                        sparks.splice(i, 1);
                        continue;
                    }

                    ctx!.fillStyle = `rgba(${gold}, ${sp.alpha.toFixed(3)})`;
                    ctx!.beginPath();
                    ctx!.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
                    ctx!.fill();
                }
            }
        }

        const running = () => visible && !document.hidden && !reduced;

        const tick = (now: number) => {
            frame = 0;
            const dt = Math.min(50, now - lastTime);
            lastTime = now;

            // Touch / idle: gentle wandering virtual cursor keeps the celestial field dynamic
            if (lite && now - pointer.lastReal > 2500) {
                pointer.tx = width * (0.5 + 0.35 * Math.sin(now / 2200));
                pointer.ty = height * (0.45 + 0.28 * Math.cos(now / 1900));
                pointer.active = true;
            }

            draw(now, dt);
            if (running()) frame = requestAnimationFrame(tick);
        };

        const sync = () => {
            if (running()) {
                lastTime = performance.now();
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

            const currentX = event.clientX - rect.left;
            const currentY = event.clientY - rect.top;

            if (!pointer.active) {
                pointer.x = currentX;
                pointer.y = currentY;
                pointer.prevX = currentX;
                pointer.prevY = currentY;
            } else {
                pointer.prevX = pointer.tx;
                pointer.prevY = pointer.ty;
            }

            pointer.tx = currentX;
            pointer.ty = currentY;
            pointer.active = true;
            pointer.lastReal = performance.now();
        };

        // Pointer click sparks an instant meteor burst
        const onPointerDown = (event: PointerEvent) => {
            if (lite || reduced) return;
            const rect = host.getBoundingClientRect();
            const px = event.clientX - rect.left;
            const py = event.clientY - rect.top;
            if (px >= 0 && px <= width && py >= 0 && py <= height) {
                spawnShooter(px, py, Math.random() * 360);
                if (Math.random() > 0.5) {
                    spawnShooter(px, py, Math.random() * 360);
                }
            }
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
        window.addEventListener("pointerdown", onPointerDown, { passive: true });
        document.addEventListener("visibilitychange", sync);

        resize();
        sync();

        return () => {
            if (frame) cancelAnimationFrame(frame);
            intersection.disconnect();
            resizeObserver.disconnect();
            stopTheme();
            window.removeEventListener("pointermove", onPointer);
            window.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("visibilitychange", sync);
        };
    }, [lite, reduced]);

    return <canvas ref={canvasRef} className={cn("pointer-events-none", className)} aria-hidden="true" />;
}
