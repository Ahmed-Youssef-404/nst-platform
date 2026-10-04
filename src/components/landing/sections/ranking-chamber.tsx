"use client";

import { Crown } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import { RANKING_COPY, TOP_STUDENTS, type TopStudent } from "../data/landing-content";
import { useCountUp } from "../hooks/use-count-up";
import { useInView } from "../hooks/use-in-view";
import { useLiteMode } from "../hooks/use-lite-mode";
import { usePointerVars } from "../hooks/use-pointer-vars";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { SectionHeading } from "../primitives/section-heading";

// Podium order on screen: 2nd, 1st, 3rd. Heights make the champion distinct without overdoing it.
const SLOTS: Record<TopStudent["rank"], { column: string; pillar: string; star: string; delay: number }> = {
    1: { column: "order-2", pillar: "h-44 sm:h-56", star: "size-14", delay: 450 },
    2: { column: "order-1", pillar: "h-32 sm:h-40", star: "size-10", delay: 250 },
    3: { column: "order-3", pillar: "h-24 sm:h-32", star: "size-9", delay: 100 },
};

function Pedestal({ student, active }: { student: TopStudent; active: boolean }) {
    const reduced = useReducedMotion();
    const slot = SLOTS[student.rank];
    const st = useCountUp(student.st ?? 0, active && student.st !== null, reduced);
    const isFirst = student.rank === 1;

    return (
        <li className={cn("flex flex-1 flex-col items-center", slot.column)}>
            <div
                className="flex flex-col items-center text-center transition-all duration-700"
                style={{
                    opacity: active ? 1 : 0,
                    transform: `translateY(${active ? 0 : 24}px)`,
                    transitionDelay: `${slot.delay}ms`,
                }}
            >
                <div className="relative">
                    {isFirst && (
                        <>
                            <span className="nl-pulse-ring absolute -inset-4 rounded-full border border-gold-500/50" aria-hidden="true" />
                            <Crown className="absolute -top-6 left-1/2 size-5 -translate-x-1/2 text-gold-500" aria-hidden="true" />
                        </>
                    )}
                    <span
                        className={cn(
                            "flex items-center justify-center rounded-full bg-gold-500 font-technical font-bold text-space-950 shadow-[var(--shadow-gold-strong)]",
                            slot.star,
                            isFirst ? "text-xl" : "text-base"
                        )}
                    >
                        {student.rank}
                    </span>
                </div>
                <p className="mt-4 max-w-[9rem] font-heading text-sm font-bold text-balance text-starlight-100 sm:max-w-[12rem] sm:text-lg">
                    {student.name}
                </p>
                <p className="mt-1 font-technical text-sm tabular-nums text-gold-500">
                    {student.st === null ? "— ST" : `${st} ST`}
                </p>
            </div>

            {/* Light beam + pillar */}
            <div
                className={cn("relative mt-5 w-full max-w-[7.5rem] origin-bottom transition-transform duration-1000 sm:max-w-[10rem]", slot.pillar)}
                style={{ transform: `scaleY(${active ? 1 : 0})`, transitionDelay: `${slot.delay - 100}ms` }}
                aria-hidden="true"
            >
                <div className="absolute inset-x-0 bottom-full h-24 bg-gradient-to-t from-gold-500/25 to-transparent blur-[2px]" />
                <div className="h-full rounded-t-xl border border-b-0 border-[color:var(--border-gold-subtle)] bg-gradient-to-b from-gold-500/25 via-space-850 to-space-900" />
            </div>
        </li>
    );
}

/** The top 3 of the previous batch, ranked by ST, in an illuminated "achievement chamber". */
export function RankingChamber() {
    const lite = useLiteMode();
    const reduced = useReducedMotion();
    const pointerRef = usePointerVars<HTMLDivElement>(!lite && !reduced);
    const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3, once: true });

    return (
        <section id="ranking" className="relative mx-auto max-w-5xl scroll-mt-12 px-6 py-24 sm:py-32">
            <Reveal>
                <SectionHeading kicker={RANKING_COPY.kicker} title={RANKING_COPY.headline} support={RANKING_COPY.caption} align="center" />
            </Reveal>

            <div ref={pointerRef} className="mt-20">
                <div
                    ref={ref}
                    className="relative"
                    style={{
                        transform: "perspective(1200px) rotateY(calc(var(--mx, 0) * 5deg)) rotateX(calc(var(--my, 0) * -3deg))",
                        transition: "transform 200ms ease-out",
                    }}
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 bg-[radial-gradient(50%_60%_at_50%_30%,rgb(var(--nl-gold-rgb)/0.16),transparent_70%)]"
                    />
                    <ol aria-label="Top three students of the previous batch" className="relative flex items-end justify-center gap-2 sm:gap-8">
                        {TOP_STUDENTS.map((student) => (
                            <Pedestal key={student.rank} student={student} active={inView} />
                        ))}
                    </ol>
                    <div className="nl-hairline mx-auto h-px max-w-3xl" aria-hidden="true" />
                </div>
            </div>
        </section>
    );
}
