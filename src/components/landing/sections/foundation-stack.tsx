"use client";

import { useState } from "react";
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

/** Isometric layers built bottom → top. Hover or focus a layer to lift it. */
export function FoundationStack() {
    const [hovered, setHovered] = useState<number | null>(null);
    const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35, once: true });

    return (
        <div ref={ref} className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <svg viewBox="0 0 320 300" className="mx-auto h-auto w-full max-w-xs overflow-visible" role="img" aria-label="Four stacked layers: fundamentals, logic, thinking, projects">
                {FOUNDATION_LAYERS.map((layer, i) => {
                    const { top, left, right } = slab(BASE_Y - i * PITCH);
                    const tint = 12 + i * 20;
                    const lifted = hovered === i;
                    return (
                        <g
                            key={layer.id}
                            style={{
                                transform: `translateY(${!inView ? -40 : lifted ? -10 : 0}px)`,
                                opacity: inView ? 1 : 0,
                                transition: `transform 600ms var(--ease-spring, ease) ${inView ? i * 140 : 0}ms, opacity 500ms ${i * 140}ms`,
                            }}
                        >
                            <polygon points={left} fill={`color-mix(in oklab, var(--space-800), var(--gold-700) ${tint}%)`} stroke="var(--gold-500)" strokeOpacity={lifted ? 0.9 : 0.35} />
                            <polygon points={right} fill={`color-mix(in oklab, var(--space-850), var(--gold-800) ${tint}%)`} stroke="var(--gold-500)" strokeOpacity={lifted ? 0.9 : 0.35} />
                            <polygon points={top} fill={`color-mix(in oklab, var(--space-750), var(--gold-500) ${tint}%)`} stroke="var(--gold-500)" strokeOpacity={lifted ? 1 : 0.5} />
                        </g>
                    );
                })}
            </svg>

            <ul className="flex flex-col-reverse gap-2">
                {FOUNDATION_LAYERS.map((layer, i) => (
                    <li key={layer.id}>
                        <button
                            type="button"
                            onPointerEnter={() => setHovered(i)}
                            onPointerLeave={() => setHovered(null)}
                            onFocus={() => setHovered(i)}
                            onBlur={() => setHovered(null)}
                            className={cn(
                                "w-full rounded-lg border border-transparent px-3 py-2 text-left transition-colors outline-none focus-visible:border-gold-500",
                                hovered === i && "bg-gold-500/10"
                            )}
                        >
                            <span className="font-technical text-[0.68rem] tracking-[0.2em] text-gold-500 uppercase">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="block font-heading text-base font-bold text-starlight-100">{layer.label}</span>
                            <span className="block text-sm text-starlight-300">{layer.line}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
