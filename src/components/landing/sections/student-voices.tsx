"use client";

import { cn } from "@/lib/utils";
import { STUDENT_VOICES, VOICES_COPY } from "../data/landing-content";
import { ScrollStage } from "../primitives/scroll-stage";

// The four statements are the four points of an "N". Lighting them in order
// draws the NST mark: the identity is built out of what students say.
const POINTS = [
    [70, 250],
    [70, 70],
    [210, 250],
    [210, 70],
] as const;
const N_PATH = POINTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

// Scroll windows (0 → 1) in which each statement lights up.
const WINDOW = 0.22;
const START = 0.08;

/** The things NST wants every student to say, appearing one by one and forming the NST "N". */
export function StudentVoices() {
    return (
        <ScrollStage id="voices" length={300}>
            <div className="mx-auto grid h-full max-w-6xl items-center gap-8 px-6 py-20 md:grid-cols-[1.2fr_0.8fr] md:gap-16">
                <div>
                    <p className="font-technical text-xs font-medium tracking-[0.22em] text-gold-500 uppercase">
                        {VOICES_COPY.kicker}
                    </p>
                    <ul className="mt-8 space-y-5 sm:space-y-7">
                        {STUDENT_VOICES.map((voice, i) => {
                            const from = START + i * WINDOW;
                            return (
                                <li
                                    key={voice}
                                    className="flex items-baseline gap-4"
                                    style={{
                                        opacity: `clamp(0.18, calc(0.18 + (var(--p) - ${from}) * 8), 1)`,
                                        transform: `translateX(calc((1 - clamp(0, (var(--p) - ${from}) * 8, 1)) * 18px))`,
                                    }}
                                >
                                    <span className="font-technical text-sm text-gold-500 tabular-nums">0{i + 1}</span>
                                    <q className={cn("font-heading text-2xl leading-snug font-extrabold text-balance text-starlight-100 sm:text-4xl", "[quotes:none]")}>
                                        {voice}
                                    </q>
                                </li>
                            );
                        })}
                    </ul>
                    <p
                        className="mt-10 max-w-md text-base text-balance text-starlight-300 sm:text-lg"
                        style={{ opacity: "clamp(0, calc((var(--p) - 0.82) * 8), 1)" }}
                    >
                        {VOICES_COPY.closing}
                    </p>
                </div>

                <svg viewBox="0 0 280 320" className="mx-auto h-auto w-full max-w-[16rem] overflow-visible md:max-w-xs" aria-hidden="true" fill="none">
                    <defs>
                        <radialGradient id="sv-halo" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="140" cy="160" r="150" fill="url(#sv-halo)" style={{ opacity: "clamp(0, calc((var(--p) - 0.7) * 4), 1)" }} />
                    <path
                        d={N_PATH}
                        pathLength={1}
                        stroke="var(--gold-500)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="1"
                        style={{ strokeDashoffset: "calc(1 - clamp(0, (var(--p) - 0.12) / 0.7, 1))" }}
                    />
                    {POINTS.map(([x, y], i) => (
                        <g key={i} style={{ opacity: `clamp(0.25, calc(0.25 + (var(--p) - ${START + i * WINDOW}) * 8), 1)` }}>
                            <circle cx={x} cy={y} r="14" fill="var(--gold-500)" fillOpacity="0.2" />
                            <circle cx={x} cy={y} r="6.5" fill="var(--gold-400)" />
                        </g>
                    ))}
                </svg>
            </div>
        </ScrollStage>
    );
}
