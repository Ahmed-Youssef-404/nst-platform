"use client";

import { Check } from "lucide-react";
import { EFFORT_COPY, GROWTH_SIGNALS } from "../data/landing-content";
import { useInView } from "../hooks/use-in-view";

const POINTS = [
    [20, 150],
    [95, 118],
    [170, 100],
    [245, 62],
    [320, 24],
] as const;
const LINE = POINTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

/** Completion ≠ growth: a bar that simply fills versus a climb measured in thinking. */
export function EffortGrowth() {
    const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35, once: true });

    return (
        <div ref={ref} className="grid items-center gap-8 sm:grid-cols-[1fr_auto_1.4fr]">
            {/* Completion */}
            <div>
                <div className="h-2.5 overflow-hidden rounded-full bg-space-800">
                    <div
                        className="h-full rounded-full bg-starlight-400"
                        style={{ width: inView ? "100%" : "0%", transition: "width 1900ms var(--ease-smooth, ease)" }}
                    />
                </div>
                <p className="mt-3 flex items-center gap-2 font-technical text-sm text-starlight-300">
                    <Check className="size-4" aria-hidden="true" />
                    {EFFORT_COPY.completionLabel}
                </p>
            </div>

            <span className="mx-auto font-heading text-4xl font-extrabold text-gold-500" aria-label="is not">≠</span>

            {/* Growth */}
            <div>
                <svg viewBox="0 0 340 170" className="h-auto w-full overflow-visible" role="img" aria-label="Growth rising through thinking, solving, applying, improving and consistency">
                    <path
                        d={LINE}
                        pathLength={1}
                        fill="none"
                        stroke="var(--gold-500)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="1"
                        strokeDashoffset={inView ? 0 : 1}
                        style={{ transition: "stroke-dashoffset 1800ms var(--ease-smooth, ease)" }}
                    />
                    {POINTS.map(([x, y], i) => (
                        <circle
                            key={GROWTH_SIGNALS[i]}
                            cx={x}
                            cy={y}
                            r="5.5"
                            fill="var(--gold-500)"
                            style={{ opacity: inView ? 1 : 0, transition: `opacity 400ms ${300 + i * 300}ms` }}
                        />
                    ))}
                </svg>
                <ul className="mt-2 flex justify-between gap-1">
                    {GROWTH_SIGNALS.map((signal, i) => (
                        <li
                            key={signal}
                            className="font-technical text-[0.62rem] tracking-wider text-starlight-300 uppercase sm:text-[0.68rem]"
                            style={{ opacity: inView ? 1 : 0, transition: `opacity 400ms ${300 + i * 300}ms` }}
                        >
                            {signal}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
