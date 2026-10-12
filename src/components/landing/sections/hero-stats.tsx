"use client";

import type { LandingStat } from "../data/landing-content";
import { useCountUp } from "../hooks/use-count-up";
import { useInView } from "../hooks/use-in-view";
import { useReducedMotion } from "../hooks/use-reduced-motion";

function StatItem({ stat }: { stat: LandingStat }) {
    const reduced = useReducedMotion();
    const { ref, inView } = useInView<HTMLDivElement>({
        once: true,
    });

    const value = useCountUp(stat.value, inView, reduced);

    return (
        <div ref={ref}>
            <dt className="font-technical text-[0.68rem] tracking-[0.2em] text-starlight-400 uppercase">
                {stat.label}
            </dt>

            <dd
                className="mt-1 flex items-baseline gap-1 font-technical text-2xl font-semibold text-starlight-100 tabular-nums"
                aria-label={`${stat.prefix ?? ""}${stat.value}`}
            >
                {stat.prefix && (
                    <span aria-hidden="true">{stat.prefix}</span>
                )}

                <span aria-hidden="true">
                    {value.toLocaleString("en-US")}
                </span>
            </dd>
        </div>
    );
}

/** Fixed, hard-coded statistics under the hero CTA. */
export function HeroStats({ stats }: { stats: LandingStat[] }) {
    return (
        <dl className="flex flex-wrap gap-x-10 gap-y-5 border-t border-[color:var(--border-subtle)] pt-6">
            {stats.map((stat) => (
                <StatItem key={stat.id} stat={stat} />
            ))}
        </dl>
    );
}