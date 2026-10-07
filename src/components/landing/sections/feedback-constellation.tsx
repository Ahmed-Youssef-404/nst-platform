"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Quote, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEEDBACK_COPY, FEEDBACK_ITEMS } from "../data/landing-content";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { SectionHeading } from "../primitives/section-heading";

interface CardAnchor {
    x: number; // percentage of container width
    y: number; // percentage of container height
    depth: number; // parallax depth multiplier (0.8 - 1.5)
    width: number; // max-w in px
}

const DESKTOP_ANCHORS: CardAnchor[] = [
    { x: 19, y: 32, depth: 0.85, width: 290 }, // Top-left
    { x: 80, y: 30, depth: 1.15, width: 295 }, // Top-right
    { x: 50, y: 53, depth: 1.45, width: 320 }, // Center focal
    { x: 22, y: 76, depth: 0.90, width: 290 }, // Bottom-left
    { x: 78, y: 76, depth: 1.25, width: 300 }, // Bottom-right
];

// Harmonic phase and frequency constants for organic zero-gravity drift
const FLOAT_PARAMS = [
    { fx: 0.00075, fy: 0.00095, fr: 0.00065, px: 0.2, py: 1.1, pr: 0.3 },
    { fx: 0.00105, fy: 0.00080, fr: 0.00085, px: 2.3, py: 0.5, pr: 1.9 },
    { fx: 0.00085, fy: 0.00115, fr: 0.00075, px: 1.5, py: 2.8, pr: 3.2 },
    { fx: 0.00120, fy: 0.00070, fr: 0.00095, px: 3.6, py: 1.7, pr: 0.7 },
    { fx: 0.00070, fy: 0.00105, fr: 0.00060, px: 4.4, py: 3.4, pr: 2.5 },
];

/**
 * Revamped "In their words" feedback section:
 * Floating zero-gravity cards within a bounded cosmic space.
 * Cards drift organically without colliding, react dynamically to scroll parallax,
 * and feature rich 3D tilt, specular sheen, and glowing aura on hover.
 */
export function FeedbackConstellation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [spotlight, setSpotlight] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [scrollRatio, setScrollRatio] = useState(0.5);
    const reducedMotion = useReducedMotion();

    // Scroll progress observer for parallax depth and perspective shifts
    useEffect(() => {
        let frame = 0;
        const handleScroll = () => {
            frame = 0;
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const winH = window.innerHeight;
            // Ratio goes from 0 (approaching view) to 1 (leaving view)
            const ratio = Math.max(0, Math.min(1, (winH - rect.top) / (winH + rect.height)));
            setScrollRatio(ratio);
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(handleScroll);
        };

        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        schedule();

        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    // Physics animation loop: computes zero-gravity drifting transforms
    useEffect(() => {
        if (reducedMotion) return;

        let reqId = 0;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const el = containerRef.current;
            if (!el) {
                reqId = requestAnimationFrame(tick);
                return;
            }

            const isDesktop = el.clientWidth >= 640;
            if (!isDesktop) {
                reqId = requestAnimationFrame(tick);
                return;
            }

            // Scroll parallax offset factor (-0.5 to +0.5)
            const scrollDelta = scrollRatio - 0.5;

            FEEDBACK_ITEMS.forEach((_, i) => {
                const cardEl = cardRefs.current[i];
                if (!cardEl) return;

                const isHovered = hoveredIdx === i;
                const p = FLOAT_PARAMS[i];
                const anchor = DESKTOP_ANCHORS[i];

                if (isHovered) {
                    // Hovered card freezes float drift and applies 3D cursor tilt
                    cardEl.style.transform = `translate3d(0, 0, 40px) scale(1.06) rotateX(${mouseTilt.x}deg) rotateY(${mouseTilt.y}deg)`;
                    return;
                }

                // Smooth sinusoidal harmonic displacement (bounded to max 14px x, 16px y, 2.5deg rot)
                const floatX = Math.sin(elapsed * p.fx + p.px) * 11 + Math.cos(elapsed * p.fx * 0.7) * 4;
                const floatY = Math.cos(elapsed * p.fy + p.py) * 13 + Math.sin(elapsed * p.fy * 0.8) * 5;
                const floatRot = Math.sin(elapsed * p.fr + p.pr) * 2.4;

                // Parallax depth shift driven by page scroll
                const parallaxY = scrollDelta * anchor.depth * 50;
                const parallaxTiltX = scrollDelta * -5;

                const totalX = floatX;
                const totalY = floatY + parallaxY;
                const totalRot = floatRot;

                const dimmed = hoveredIdx !== null;
                const scale = dimmed ? 0.96 : 1;

                cardEl.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) scale(${scale}) rotateX(${parallaxTiltX.toFixed(2)}deg) rotateZ(${totalRot.toFixed(2)}deg)`;
            });

            reqId = requestAnimationFrame(tick);
        };

        reqId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(reqId);
    }, [reducedMotion, hoveredIdx, mouseTilt, scrollRatio]);

    // Handle mouse move over card to produce 3D perspective tilt & specular sheen
    const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, idx: number) => {
        const card = cardRefs.current[idx];
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Normalized offsets (-0.5 to +0.5)
        const normX = x / rect.width - 0.5;
        const normY = y / rect.height - 0.5;

        setMouseTilt({
            x: Number((-normY * 12).toFixed(2)),
            y: Number((normX * 12).toFixed(2)),
        });
        setSpotlight({ x, y });
    }, []);

    return (
        <section className="relative py-24 sm:py-32 overflow-hidden" aria-label="Student feedback">
            {/* Ambient background glow behind the section */}
            <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
                <div className="size-[42rem] rounded-full bg-gold-500/5 blur-[120px]" />
            </div>

            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading kicker={FEEDBACK_COPY.kicker} title={FEEDBACK_COPY.headline} align="center" />
                <p className="mx-auto mt-3 max-w-md text-center font-technical text-xs tracking-widest text-starlight-400 uppercase">
                    Space-drifting voices from previous travellers · Hover to stabilize
                </p>
            </div>

            {/* Bounded Zero-Gravity Cosmic Container */}
            <div
                ref={containerRef}
                className="relative mx-auto mt-12 max-w-6xl h-[660px] sm:h-[720px] rounded-3xl border border-[color:var(--border-gold-subtle)] bg-space-950/75 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden select-none"
                style={{ perspective: "1200px" }}
            >
                {/* Deep-Space Starfield Grid & Orbital Radians */}
                <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
                    {/* Concentric space radar circles */}
                    <svg className="size-full" viewBox="0 0 1000 700" preserveAspectRatio="none">
                        <defs>
                            <radialGradient id="nebula-radial" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.12" />
                                <stop offset="50%" stopColor="var(--gold-500)" stopOpacity="0.04" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <rect width="1000" height="700" fill="url(#nebula-radial)" />
                        <circle cx="500" cy="350" r="160" fill="none" stroke="var(--gold-500)" strokeOpacity="0.15" strokeDasharray="4 8" />
                        <circle cx="500" cy="350" r="320" fill="none" stroke="var(--gold-500)" strokeOpacity="0.10" strokeDasharray="3 12" />
                        <circle cx="500" cy="350" r="460" fill="none" stroke="var(--starlight-300)" strokeOpacity="0.06" strokeDasharray="2 16" />
                        {/* Crosshairs */}
                        <line x1="500" y1="40" x2="500" y2="660" stroke="var(--gold-500)" strokeOpacity="0.08" strokeDasharray="2 6" />
                        <line x1="60" y1="350" x2="940" y2="350" stroke="var(--gold-500)" strokeOpacity="0.08" strokeDasharray="2 6" />
                    </svg>

                    {/* Faint ambient stars */}
                    <div className="absolute top-[18%] left-[12%] size-1 rounded-full bg-gold-400/60 nl-twinkle" />
                    <div className="absolute top-[28%] left-[88%] size-1.5 rounded-full bg-starlight-100/50 nl-twinkle" style={{ animationDelay: "1.2s" }} />
                    <div className="absolute top-[68%] left-[8%] size-1.5 rounded-full bg-gold-300/50 nl-twinkle" style={{ animationDelay: "2.4s" }} />
                    <div className="absolute top-[82%] left-[84%] size-1 rounded-full bg-starlight-200/60 nl-twinkle" style={{ animationDelay: "0.8s" }} />
                    <div className="absolute top-[48%] left-[45%] size-1 rounded-full bg-gold-500/40 nl-twinkle" style={{ animationDelay: "1.8s" }} />
                </div>

                {/* Desktop/Tablet 2D Floating Zero-Gravity Constellation Field */}
                <div className="relative hidden size-full sm:block">
                    {FEEDBACK_ITEMS.map((item, i) => {
                        const anchor = DESKTOP_ANCHORS[i];
                        const isHovered = hoveredIdx === i;
                        const isDimmed = hoveredIdx !== null && !isHovered;

                        return (
                            <div
                                key={item.id}
                                className="absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
                                style={{
                                    left: `${anchor.x}%`,
                                    top: `${anchor.y}%`,
                                    width: `${anchor.width}px`,
                                    zIndex: isHovered ? 40 : 10 + Math.round(anchor.depth * 5),
                                    opacity: isDimmed ? 0.38 : 1,
                                    filter: isDimmed ? "blur(0.5px)" : "none",
                                }}
                            >
                                <div
                                    ref={(el) => {
                                        cardRefs.current[i] = el;
                                    }}
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => {
                                        setHoveredIdx(null);
                                        setMouseTilt({ x: 0, y: 0 });
                                    }}
                                    onMouseMove={(e) => handleCardMouseMove(e, i)}
                                    className={cn(
                                        "group relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md",
                                        isHovered
                                            ? "border-gold-400/90 bg-space-900/95 shadow-[0_22px_45px_-10px_rgba(0,0,0,0.85),0_0_35px_rgba(var(--nl-gold-rgb)/0.4),inset_0_0_16px_rgba(var(--nl-gold-rgb)/0.12)]"
                                            : "border-[color:var(--border-default)] bg-space-950/80 shadow-[0_12px_30px_rgba(0,0,0,0.5)] hover:border-gold-500/50"
                                    )}
                                    style={{
                                        willChange: "transform",
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    {/* Cursor-following Specular Sheen on Hover */}
                                    {isHovered && (
                                        <div
                                            className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 transition-opacity"
                                            style={{
                                                background: `radial-gradient(circle 240px at ${spotlight.x}px ${spotlight.y}px, rgba(var(--nl-gold-rgb) / 0.22), transparent 75%)`,
                                            }}
                                        />
                                    )}

                                    {/* Card Header: Star Badge & Quotation Symbol */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "flex size-7 items-center justify-center rounded-full border transition-all duration-300",
                                                    isHovered
                                                        ? "border-gold-400 bg-gold-500/20 text-gold-400 shadow-[0_0_12px_rgba(var(--nl-gold-rgb)/0.6)]"
                                                        : "border-[color:var(--border-gold-subtle)] bg-space-900 text-gold-500/80"
                                                )}
                                            >
                                                <Star className="size-3.5 fill-current" />
                                            </span>
                                            <span className="font-technical text-[0.65rem] tracking-[0.2em] text-gold-500 uppercase">
                                                NST Student
                                            </span>
                                        </div>
                                        <Quote className="size-4 text-starlight-400/40 transition-colors group-hover:text-gold-400/70" />
                                    </div>

                                    {/* Feedback Quote */}
                                    <p className="mt-3.5 font-heading text-sm font-semibold leading-relaxed text-balance text-starlight-100 sm:text-[0.95rem]">
                                        "{item.quote}"
                                    </p>

                                    {/* Footer: Author / Context */}
                                    <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border-default)]/60 pt-2.5">
                                        <span className="font-technical text-[0.68rem] tracking-wider text-starlight-400 uppercase">
                                            {item.context}
                                        </span>
                                        {isHovered && (
                                            <span className="flex items-center gap-1 font-technical text-[0.62rem] text-gold-400 animate-in fade-in duration-200">
                                                <Sparkles className="size-3" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Floating Stream View (< 640px) */}
                <div className="relative flex size-full flex-col justify-center px-4 py-6 sm:hidden">
                    <div className="nl-no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 py-4">
                        {FEEDBACK_ITEMS.map((item, i) => (
                            <div
                                key={item.id}
                                className="w-[82vw] shrink-0 snap-center rounded-2xl border border-[color:var(--border-gold-subtle)] bg-space-900/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md active:border-gold-400"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-7 items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/10 text-gold-400">
                                            <Star className="size-3.5 fill-current" />
                                        </span>
                                        <span className="font-technical text-[0.65rem] tracking-[0.2em] text-gold-500 uppercase">
                                            NST Student
                                        </span>
                                    </div>
                                    <Quote className="size-4 text-starlight-400/40" />
                                </div>
                                <p className="mt-3.5 font-heading text-sm font-semibold leading-relaxed text-starlight-100">
                                    "{item.quote}"
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border-default)]/60 pt-2.5">
                                    <span className="font-technical text-[0.68rem] tracking-wider text-starlight-400 uppercase">
                                        {item.context}
                                    </span>
                                    <span className="font-technical text-[0.65rem] text-gold-400">0{i + 1} / 05</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-center font-technical text-[0.65rem] tracking-widest text-starlight-400 uppercase">
                        Swipe to explore all voices →
                    </p>
                </div>
            </div>
        </section>
    );
}
