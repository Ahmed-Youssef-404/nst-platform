"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNING_PATHS, PATHS_COPY, type LearningPath } from "../data/landing-content";

type PathId = LearningPath["id"];

interface PathsDiagramProps {
    selected: PathId;
    onSelect: (id: PathId) => void;
    className?: string;
}

/**
 * Compact Cosmic Trajectory Bridge:
 * Connects Origin [NST] → [Beginner / Intermediate] → Destination [Growth]
 * in a space-efficient horizontal layout (~55px height) that fits comfortably on any screen.
 */
export function PathsDiagram({ selected, onSelect, className }: PathsDiagramProps) {
    return (
        <div className={cn("relative mx-auto w-full max-w-3xl px-2", className)}>
            <div className="relative flex items-center justify-between gap-2 sm:gap-6">
                {/* SVG Conduit Lines between Origin, Nodes, and Growth */}
                <svg
                    viewBox="0 0 800 60"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 size-full overflow-visible"
                    fill="none"
                    aria-hidden="true"
                >
                    {/* Conduit: Origin to Beginner */}
                    <path
                        d="M 50 30 C 130 30, 180 18, 270 18"
                        stroke={selected === "beginner" ? "var(--gold-500)" : "var(--starlight-400)"}
                        strokeOpacity={selected === "beginner" ? 0.9 : 0.25}
                        strokeWidth={selected === "beginner" ? "2.5" : "1.5"}
                        style={{ transition: "all 400ms" }}
                    />
                    {selected === "beginner" && (
                        <path
                            d="M 50 30 C 130 30, 180 18, 270 18"
                            stroke="var(--gold-400)"
                            strokeWidth="3"
                            strokeDasharray="6 10"
                            strokeLinecap="round"
                            className="nl-dash-flow"
                        />
                    )}

                    {/* Conduit: Beginner to Growth */}
                    <path
                        d="M 370 18 C 480 18, 620 30, 750 30"
                        stroke={selected === "beginner" ? "var(--gold-500)" : "var(--starlight-400)"}
                        strokeOpacity={selected === "beginner" ? 0.9 : 0.25}
                        strokeWidth={selected === "beginner" ? "2.5" : "1.5"}
                        style={{ transition: "all 400ms" }}
                    />
                    {selected === "beginner" && (
                        <path
                            d="M 370 18 C 480 18, 620 30, 750 30"
                            stroke="var(--gold-400)"
                            strokeWidth="3"
                            strokeDasharray="6 10"
                            strokeLinecap="round"
                            className="nl-dash-flow"
                        />
                    )}

                    {/* Conduit: Origin to Intermediate */}
                    <path
                        d="M 50 30 C 130 30, 200 42, 430 42"
                        stroke={selected === "intermediate" ? "var(--gold-500)" : "var(--starlight-400)"}
                        strokeOpacity={selected === "intermediate" ? 0.9 : 0.25}
                        strokeWidth={selected === "intermediate" ? "2.5" : "1.5"}
                        style={{ transition: "all 400ms" }}
                    />
                    {selected === "intermediate" && (
                        <path
                            d="M 50 30 C 130 30, 200 42, 430 42"
                            stroke="var(--gold-400)"
                            strokeWidth="3"
                            strokeDasharray="6 10"
                            strokeLinecap="round"
                            className="nl-dash-flow"
                        />
                    )}

                    {/* Conduit: Intermediate to Growth */}
                    <path
                        d="M 540 42 C 630 42, 680 30, 750 30"
                        stroke={selected === "intermediate" ? "var(--gold-500)" : "var(--starlight-400)"}
                        strokeOpacity={selected === "intermediate" ? 0.9 : 0.25}
                        strokeWidth={selected === "intermediate" ? "2.5" : "1.5"}
                        style={{ transition: "all 400ms" }}
                    />
                    {selected === "intermediate" && (
                        <path
                            d="M 540 42 C 630 42, 680 30, 750 30"
                            stroke="var(--gold-400)"
                            strokeWidth="3"
                            strokeDasharray="6 10"
                            strokeLinecap="round"
                            className="nl-dash-flow"
                        />
                    )}
                </svg>

                {/* Left: Origin Node [NST] */}
                <div className="relative z-10 flex items-center">
                    <div className="flex size-10 items-center justify-center rounded-full border border-[color:var(--border-gold)] bg-space-900 font-technical text-xs font-bold text-gold-500 shadow-[var(--border-glow-gold)] sm:size-11">
                        {PATHS_COPY.origin}
                    </div>
                </div>

                {/* Middle: Path Selector Badges */}
                <div className="relative z-10 flex items-center gap-2.5 sm:gap-4">
                    {LEARNING_PATHS.map((path) => {
                        const isSelected = path.id === selected;
                        return (
                            <button
                                key={path.id}
                                type="button"
                                onClick={() => onSelect(path.id)}
                                aria-pressed={isSelected}
                                className={cn(
                                    "flex items-center gap-2 rounded-full border px-3.5 py-1 sm:px-4 sm:py-1.5 transition-all duration-300 outline-none",
                                    isSelected
                                        ? "scale-105 border-gold-500 bg-space-900 text-gold-400 shadow-[var(--border-glow-gold)]"
                                        : "border-[color:var(--border-default)] bg-space-950/80 text-starlight-300 hover:border-gold-500/50"
                                )}
                            >
                                <span
                                    className={cn(
                                        "size-2 rounded-full transition-colors",
                                        isSelected ? "bg-gold-500 shadow-[0_0_6px_var(--gold-500)]" : "bg-starlight-400/50"
                                    )}
                                />
                                <span className="font-technical text-xs font-semibold tracking-wider uppercase">
                                    {path.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Growth Node [Growth] */}
                <div className="relative z-10 flex items-center">
                    <div className="relative flex size-10 items-center justify-center sm:size-11">
                        <span className="nl-pulse-ring absolute inset-0 rounded-full border border-gold-500/60" aria-hidden="true" />
                        <span className="flex size-full items-center justify-center rounded-full bg-gold-500 text-space-950 shadow-[var(--shadow-gold-strong)]">
                            <Sparkles className="size-4 sm:size-5" aria-hidden="true" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
