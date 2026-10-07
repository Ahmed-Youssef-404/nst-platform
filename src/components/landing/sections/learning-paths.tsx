"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNING_PATHS, PATHS_COPY, type LearningPath } from "../data/landing-content";
import { ScrollStage } from "../primitives/scroll-stage";
import { PathsDiagram } from "./paths-diagram";

/**
 * Compact, fully visible Learning Paths section:
 * Both paths and their complete details are clearly visible on any screen height.
 * Scrolling smoothly guides the spotlight from Beginner to Intermediate with
 * generous breathing room and zero cutoff.
 */
export function LearningPaths() {
    const [selectedId, setSelectedId] = useState<LearningPath["id"]>("beginner");

    const handleProgress = (p: number) => {
        const nextId: LearningPath["id"] = p < 0.5 ? "beginner" : "intermediate";
        setSelectedId((current) => (current === nextId ? current : nextId));
    };

    const selected = LEARNING_PATHS.find((path) => path.id === selectedId) ?? LEARNING_PATHS[0];

    return (
        <ScrollStage id="paths" length={260} onProgress={handleProgress}>
            <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-4 sm:px-6 py-6 sm:py-8">
                {/* Section Heading */}
                <div className="text-center">
                    <p className="font-technical text-xs font-medium tracking-[0.22em] text-gold-500 uppercase">
                        {PATHS_COPY.kicker}
                    </p>
                    <h2 className="mt-1.5 font-heading text-2xl font-extrabold tracking-tight text-starlight-100 sm:text-3xl md:text-4xl">
                        {PATHS_COPY.headline}
                    </h2>
                </div>

                {/* Compact Cosmic Trajectory Bridge */}
                <div className="mt-4 sm:mt-6">
                    <PathsDiagram selected={selectedId} onSelect={setSelectedId} />
                </div>

                {/* Desktop & Tablet: Side-by-Side Dual Trajectory Deck */}
                <div className="mt-5 hidden sm:grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto w-full">
                    {LEARNING_PATHS.map((path) => {
                        const isSelected = path.id === selectedId;
                        return (
                            <div
                                key={path.id}
                                onClick={() => setSelectedId(path.id)}
                                className={cn(
                                    "group relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md",
                                    isSelected
                                        ? "border-gold-500 bg-space-900/95 shadow-[var(--border-glow-gold)] scale-[1.02] z-10"
                                        : "border-[color:var(--border-default)] bg-space-950/70 opacity-60 hover:opacity-85 hover:border-gold-500/50"
                                )}
                            >
                                {/* Top Badge */}
                                <div className="flex items-center justify-between">
                                    <span
                                        className={cn(
                                            "font-technical text-[0.68rem] tracking-[0.2em] uppercase rounded-full px-2.5 py-0.5 border transition-colors",
                                            isSelected
                                                ? "border-gold-500 bg-gold-500/15 text-gold-400 font-bold"
                                                : "border-[color:var(--border-default)] text-starlight-400"
                                        )}
                                    >
                                        {path.name === "Beginner" ? "01" : "02"} · {path.destination}
                                    </span>
                                    {isSelected ? (
                                        <span className="flex items-center gap-1.5 font-technical text-[0.65rem] text-gold-400 uppercase tracking-widest animate-in fade-in duration-300">
                                            <span className="size-2 rounded-full bg-gold-500 shadow-[0_0_8px_var(--gold-500)] animate-pulse" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="font-technical text-[0.62rem] text-starlight-400 uppercase tracking-wider">
                                            Scroll to activate
                                        </span>
                                    )}
                                </div>

                                {/* Tagline */}
                                <h3
                                    className={cn(
                                        "mt-3 font-heading text-xl font-extrabold transition-colors",
                                        isSelected ? "text-gold-300" : "text-starlight-100"
                                    )}
                                >
                                    {path.tagline}
                                </h3>

                                {/* Audience */}
                                <p className="mt-1 text-xs text-starlight-300 leading-relaxed">
                                    {path.audience}
                                </p>

                                {/* Focus Items */}
                                <ul className="mt-3.5 space-y-1.5 border-t border-[color:var(--border-default)]/60 pt-3">
                                    {path.focus.map((item) => (
                                        <li key={item} className="flex items-center gap-2 font-technical text-xs text-starlight-200">
                                            <Check
                                                className={cn(
                                                    "size-3.5 shrink-0 transition-colors",
                                                    isSelected ? "text-gold-500" : "text-starlight-400"
                                                )}
                                            />
                                            <span className={isSelected ? "text-starlight-100 font-medium" : "text-starlight-300"}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile View (< 640px): Compact Selected Card */}
                <div className="mt-4 w-full max-w-sm mx-auto sm:hidden">
                    <div
                        key={selected.id}
                        className="rounded-2xl border border-gold-500/90 bg-space-900/95 p-5 shadow-[var(--border-glow-gold)] backdrop-blur-md animate-in fade-in duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-technical text-[0.65rem] tracking-[0.2em] uppercase rounded-full px-2.5 py-0.5 border border-gold-500 bg-gold-500/15 text-gold-400 font-bold">
                                {selected.name === "Beginner" ? "01" : "02"} · {selected.destination}
                            </span>
                            <span className="flex items-center gap-1.5 font-technical text-[0.65rem] text-gold-400">
                                <span className="size-1.5 rounded-full bg-gold-500 animate-pulse" />
                                Active
                            </span>
                        </div>
                        <h3 className="mt-2.5 font-heading text-lg font-extrabold text-gold-300">
                            {selected.tagline}
                        </h3>
                        <p className="mt-1 text-xs text-starlight-300">
                            {selected.audience}
                        </p>
                        <ul className="mt-3 space-y-1.5 border-t border-[color:var(--border-default)]/60 pt-2.5">
                            {selected.focus.map((item) => (
                                <li key={item} className="flex items-center gap-2 font-technical text-xs text-starlight-200">
                                    <Check className="size-3.5 text-gold-500 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </ScrollStage>
    );
}
