"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MINDSET_COPY, MINDSET_STEPS } from "../data/landing-content";
import { ScrollStage } from "../primitives/scroll-stage";

// Where the four fragments of the problem sit at each step (SVG units).
const FRAGMENTS: readonly (readonly (readonly [number, number])[])[] = [
    [[200, 200], [200, 200], [200, 200], [200, 200]], // analyze: still one shape
    [[120, 140], [285, 130], [130, 275], [280, 270]], // break down: split apart
    [[105, 150], [300, 120], [145, 290], [265, 285]], // experiment: restless
    [[80, 200], [160, 200], [240, 200], [320, 200]], // solve: aligned into a line
    [[200, 150], [165, 200], [235, 200], [200, 250]], // learn: settled as a constellation
];

const BLOB =
    "M200 118 C240 112 292 150 286 200 C298 246 250 292 204 284 C158 296 108 252 116 204 C100 160 152 124 200 118 Z";

const TRIAL_PATH = "M105 150 L300 120 L145 290 L265 285";
const SOLVED_PATH = "M80 200 L320 200";
const LEARNED_PATH = "M200 150 L235 200 L200 250 L165 200 Z";

const stepOpacity = (visible: boolean) => ({ opacity: visible ? 1 : 0, transition: "opacity 500ms" });

/**
 * "Problem solving is a means, not the destination." One unknown problem is
 * analysed, broken apart, tested, solved and finally settles into a small
 * constellation: the learned method. Scroll advances the steps.
 */
export function MindsetPipeline() {
    const [step, setStep] = useState(0);

    const handleProgress = (p: number) => {
        const next = Math.min(MINDSET_STEPS.length - 1, Math.floor(p * MINDSET_STEPS.length));
        setStep((current) => (current === next ? current : next));
    };

    return (
        <ScrollStage id="method" length={300} onProgress={handleProgress}>
            <div className="mx-auto grid h-full max-w-6xl items-center gap-8 px-6 py-20 md:grid-cols-2 md:gap-12">
                <div>
                    <p className="font-technical text-xs font-medium tracking-[0.22em] text-gold-500 uppercase">
                        {MINDSET_COPY.kicker}
                    </p>
                    <h2 className="mt-4 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-balance text-starlight-100 sm:text-4xl md:text-5xl">
                        {MINDSET_COPY.headline}
                    </h2>
                    <p className="mt-4 max-w-md text-base text-balance text-starlight-300 sm:text-lg">
                        {MINDSET_COPY.support}
                    </p>

                    <ol className="mt-8 hidden space-y-3 md:block" aria-label="Problem-solving steps">
                        {MINDSET_STEPS.map((item, i) => (
                            <li
                                key={item.id}
                                aria-current={i === step ? "step" : undefined}
                                className={cn(
                                    "flex items-baseline gap-4 transition-all duration-500",
                                    i === step ? "opacity-100" : i < step ? "opacity-60" : "opacity-30"
                                )}
                            >
                                <span
                                    className={cn(
                                        "font-technical text-sm tabular-nums transition-colors",
                                        i <= step ? "text-gold-500" : "text-starlight-400"
                                    )}
                                >
                                    0{i + 1}
                                </span>
                                <span className="font-heading text-xl font-bold text-starlight-100">
                                    {item.label}
                                </span>
                                <span
                                    className={cn(
                                        "text-sm text-starlight-300 transition-opacity duration-500",
                                        i === step ? "opacity-100" : "opacity-0"
                                    )}
                                >
                                    {item.line}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="relative mx-auto w-full max-w-md">
                    <svg viewBox="0 0 400 400" className="h-auto w-full overflow-visible" role="img"
                        aria-label={`Step ${step + 1} of ${MINDSET_STEPS.length}: ${MINDSET_STEPS[step].label}`}>
                        <defs>
                            <radialGradient id="mp-halo" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {/* Final-state halo */}
                        <circle cx="200" cy="200" r="150" fill="url(#mp-halo)" style={stepOpacity(step === 4)} />

                        {/* Analyze: the unknown, scanned */}
                        <g style={stepOpacity(step === 0)}>
                            <path d={BLOB} fill="var(--space-800)" stroke="var(--starlight-400)" strokeDasharray="3 6" />
                            <text x="200" y="222" textAnchor="middle" fontSize="64" className="font-technical" fill="var(--starlight-300)">?</text>
                            <g className="nl-spin">
                                <circle cx="200" cy="200" r="132" fill="none" stroke="var(--gold-500)" strokeOpacity="0.6" strokeDasharray="30 22" />
                            </g>
                        </g>

                        {/* Connections per stage */}
                        <path d={TRIAL_PATH} fill="none" stroke="var(--starlight-400)" strokeDasharray="4 7" className="nl-dash-flow" style={stepOpacity(step === 2)} />
                        <path d={SOLVED_PATH} fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" style={stepOpacity(step === 3)} />
                        <path d={LEARNED_PATH} fill="none" stroke="var(--gold-500)" strokeWidth="1.5" strokeLinejoin="round" style={stepOpacity(step === 4)} />

                        {/* Fragments of the problem */}
                        {FRAGMENTS[step].map(([x, y], i) => (
                            <g
                                key={i}
                                style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                    transition: "transform 800ms var(--ease-smooth, ease), opacity 500ms",
                                    opacity: step === 0 ? 0 : 1,
                                }}
                            >
                                <circle r={step === 4 ? 9 : 14} fill={step >= 3 ? "var(--gold-500)" : "var(--space-800)"} stroke={step >= 3 ? "var(--gold-300)" : "var(--starlight-300)"} strokeWidth="1.5" style={{ transition: "all 600ms" }} />
                                {step === 2 && (
                                    <text y="4" textAnchor="middle" fontSize="12" className="font-technical nl-twinkle" fill="var(--starlight-200)">
                                        {i % 2 ? "✓" : "×"}
                                    </text>
                                )}
                            </g>
                        ))}
                    </svg>

                    <p className="mt-4 h-8 text-center font-technical text-sm tracking-wide text-starlight-300 md:hidden">
                        {MINDSET_STEPS[step].label}: {MINDSET_STEPS[step].line}
                    </p>
                    <p
                        className="mt-2 text-center font-heading text-2xl font-extrabold nl-gold-text transition-all duration-700 md:text-3xl"
                        style={{ opacity: step === 4 ? 1 : 0, transform: `translateY(${step === 4 ? 0 : 10}px)` }}
                        aria-hidden={step !== 4}
                    >
                        {MINDSET_COPY.result}
                    </p>
                </div>
            </div>
        </ScrollStage>
    );
}
