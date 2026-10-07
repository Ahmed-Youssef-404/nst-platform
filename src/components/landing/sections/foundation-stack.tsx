"use client";

import { cn } from "@/lib/utils";
import { FOUNDATION_LAYERS } from "../data/landing-content";
import { useInView } from "../hooks/use-in-view";

const HALF_W = 110;
const HALF_H = 38;
const THICK = 22;
const PITCH = 34;
const CX = 160;
const BASE_Y = 196;

function slab(y: number) {
    const top = `${CX},${y} ${CX + HALF_W},${y + HALF_H} ${CX},${y + HALF_H * 2} ${CX - HALF_W},${y + HALF_H}`;
    const left = `${CX - HALF_W},${y + HALF_H} ${CX},${y + HALF_H * 2} ${CX},${y + HALF_H * 2 + THICK} ${CX - HALF_W},${y + HALF_H + THICK}`;
    const right = `${CX},${y + HALF_H * 2} ${CX + HALF_W},${y + HALF_H} ${CX + HALF_W},${y + HALF_H + THICK} ${CX},${y + HALF_H * 2 + THICK}`;
    return { top, left, right };
}

interface FoundationStackProps {
    /** Controlled active layer index (0-3), driven by scroll progression. */
    activeLayer?: number;
}

/** Isometric layers built bottom → top: Fundamentals → Logic → Thinking → Projects, driven by scroll. */
export function FoundationStack({ activeLayer = 0 }: FoundationStackProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2, once: true });
    const active = Math.max(0, Math.min(FOUNDATION_LAYERS.length - 1, activeLayer));

    return (
        <div ref={ref} className="grid items-center gap-8 sm:grid-cols-[1fr_auto]">
            {/* Isometric 3D Layer Slabs */}
            <svg
                viewBox="0 0 320 300"
                className="mx-auto h-auto w-full max-w-xs overflow-visible"
                role="img"
                aria-label="Four stacked layers: fundamentals, logic, thinking, projects"
            >
                {FOUNDATION_LAYERS.map((layer, i) => {
                    const { top, left, right } = slab(BASE_Y - i * PITCH);
                    const tint = 12 + i * 20;
                    const lifted = active === i;

                    return (
                        <g
                            key={layer.id}
                            style={{
                                transform: `translateY(${!inView ? -40 : lifted ? -14 : 0}px)`,
                                opacity: inView ? 1 : 0,
                                transition: "transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms",
                                filter: lifted ? "drop-shadow(0 6px 16px rgba(var(--nl-gold-rgb) / 0.35))" : "none",
                            }}
                        >
                            {/* Left facet */}
                            <polygon
                                points={left}
                                fill={`color-mix(in oklab, var(--space-800), var(--gold-700) ${lifted ? tint + 25 : tint}%)`}
                                stroke="var(--gold-500)"
                                strokeOpacity={lifted ? 0.95 : 0.35}
                                strokeWidth={lifted ? 1.5 : 1}
                                style={{ transition: "all 350ms" }}
                            />
                            {/* Right facet */}
                            <polygon
                                points={right}
                                fill={`color-mix(in oklab, var(--space-850), var(--gold-800) ${lifted ? tint + 25 : tint}%)`}
                                stroke="var(--gold-500)"
                                strokeOpacity={lifted ? 0.95 : 0.35}
                                strokeWidth={lifted ? 1.5 : 1}
                                style={{ transition: "all 350ms" }}
                            />
                            {/* Top face */}
                            <polygon
                                points={top}
                                fill={
                                    lifted
                                        ? "color-mix(in oklab, var(--gold-500), var(--gold-400) 45%)"
                                        : `color-mix(in oklab, var(--space-750), var(--gold-500) ${tint}%)`
                                }
                                stroke="var(--gold-500)"
                                strokeOpacity={lifted ? 1 : 0.45}
                                strokeWidth={lifted ? 2 : 1}
                                style={{ transition: "all 350ms" }}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Layer Details List (Stacked bottom to top) */}
            <ul className="flex flex-col-reverse gap-2.5">
                {FOUNDATION_LAYERS.map((layer, i) => {
                    const isActive = active === i;
                    return (
                        <li key={layer.id}>
                            <div
                                className={cn(
                                    "w-full rounded-xl border px-4 py-2.5 text-left transition-all duration-300",
                                    isActive
                                        ? "border-gold-500/80 bg-gold-500/15 shadow-[var(--border-glow-gold)] translate-x-1.5"
                                        : "border-transparent bg-transparent opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "font-technical text-[0.68rem] tracking-[0.2em] uppercase transition-colors",
                                            isActive ? "text-gold-400 font-bold" : "text-starlight-400"
                                        )}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    {isActive && (
                                        <span className="size-1.5 rounded-full bg-gold-500 shadow-[0_0_6px_var(--gold-500)] animate-pulse" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "block font-heading text-base font-bold transition-colors",
                                        isActive ? "text-gold-300" : "text-starlight-100"
                                    )}
                                >
                                    {layer.label}
                                </span>
                                <span
                                    className={cn(
                                        "block text-sm transition-colors",
                                        isActive ? "text-starlight-200" : "text-starlight-400"
                                    )}
                                >
                                    {layer.line}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
