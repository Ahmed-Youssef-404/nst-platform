"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNING_PATHS, PATHS_COPY, type LearningPath } from "../data/landing-content";

type PathId = LearningPath["id"];

interface Layout {
    aspect: string;
    origin: readonly [number, number];
    nodes: Record<PathId, readonly [number, number]>;
    growth: readonly [number, number];
    /** Curves, in order: origin→beginner, beginner→growth, origin→intermediate, intermediate→growth. */
    curves: Record<PathId, readonly [string, string]>;
}

export const LANDSCAPE: Layout = {
    aspect: "aspect-[16/8]",
    origin: [8, 50],
    nodes: { beginner: [50, 22], intermediate: [50, 78] },
    growth: [92, 50],
    curves: {
        beginner: ["M8 50 C28 50 30 22 50 22", "M50 22 C72 22 74 50 92 50"],
        intermediate: ["M8 50 C28 50 30 78 50 78", "M50 78 C72 78 74 50 92 50"],
    },
};

export const PORTRAIT: Layout = {
    aspect: "aspect-[4/6]",
    origin: [50, 8],
    nodes: { beginner: [24, 50], intermediate: [76, 50] },
    growth: [50, 92],
    curves: {
        beginner: ["M50 8 C50 28 24 30 24 50", "M24 50 C24 70 50 72 50 92"],
        intermediate: ["M50 8 C50 28 76 30 76 50", "M76 50 C76 70 50 72 50 92"],
    },
};

interface PathsDiagramProps {
    layout: Layout;
    selected: PathId;
    onSelect: (id: PathId) => void;
    className?: string;
}

const at = ([x, y]: readonly [number, number]) => ({ left: `${x}%`, top: `${y}%` });

/** Two paths branching from the NST origin and meeting again at growth. */
export function PathsDiagram({ layout, selected, onSelect, className }: PathsDiagramProps) {
    return (
        <div className={cn("relative mx-auto w-full max-w-4xl", layout.aspect, className)}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" fill="none" aria-hidden="true">
                {LEARNING_PATHS.map((path) => {
                    const isSelected = path.id === selected;
                    return layout.curves[path.id].map((d) => (
                        <g key={d}>
                            <path
                                d={d}
                                vectorEffect="non-scaling-stroke"
                                stroke={isSelected ? "var(--gold-500)" : "var(--starlight-400)"}
                                strokeOpacity={isSelected ? 0.45 : 0.3}
                                strokeWidth="1.5"
                                style={{ transition: "all 400ms" }}
                            />
                            {isSelected && (
                                <path d={d} vectorEffect="non-scaling-stroke" stroke="var(--gold-400)" strokeWidth="2.5" strokeDasharray="6 10" strokeLinecap="round" className="nl-dash-flow" />
                            )}
                        </g>
                    ));
                })}
            </svg>

            {/* Origin */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2" style={at(layout.origin)}>
                <div className="flex size-14 items-center justify-center rounded-full border border-[color:var(--border-gold)] bg-space-900 font-technical text-sm font-bold text-gold-500 shadow-[var(--border-glow-gold)] sm:size-16">
                    {PATHS_COPY.origin}
                </div>
            </div>

            {/* Path nodes */}
            {LEARNING_PATHS.map((path) => {
                const isSelected = path.id === selected;
                return (
                    <button
                        key={path.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelect(path.id)}
                        onPointerEnter={() => onSelect(path.id)}
                        onFocus={() => onSelect(path.id)}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl text-center outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        style={at(layout.nodes[path.id])}
                    >
                        <span
                            className={cn(
                                "block rounded-2xl border px-4 py-3 transition-all duration-300 sm:px-6 sm:py-4",
                                isSelected
                                    ? "scale-105 border-gold-500 bg-gold-500/10 shadow-[var(--border-glow-gold)]"
                                    : "border-[color:var(--border-default)] bg-space-900/70 group-hover:border-gold-500/60"
                            )}
                        >
                            <span className="block font-technical text-[0.62rem] tracking-[0.2em] text-starlight-400 uppercase sm:text-xs">
                                {path.name}
                            </span>
                            <span className={cn("mt-1 block font-heading text-base font-extrabold transition-colors sm:text-xl", isSelected ? "text-gold-500" : "text-starlight-100")}>
                                {path.destination}
                            </span>
                        </span>
                    </button>
                );
            })}

            {/* Destination */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={at(layout.growth)}>
                <div className="relative mx-auto flex size-14 items-center justify-center sm:size-16">
                    <span className="nl-pulse-ring absolute inset-0 rounded-full border border-gold-500/60" aria-hidden="true" />
                    <span className="flex size-full items-center justify-center rounded-full bg-gold-500 text-space-950 shadow-[var(--shadow-gold-strong)]">
                        <Sparkles className="size-6" aria-hidden="true" />
                    </span>
                </div>
                <p className="mt-2 font-technical text-xs tracking-[0.2em] text-gold-500 uppercase">{PATHS_COPY.growth}</p>
            </div>
        </div>
    );
}
