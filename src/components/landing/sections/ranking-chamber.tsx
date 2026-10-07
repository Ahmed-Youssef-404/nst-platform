"use client";

import { useMemo, useRef, useState } from "react";
import {
    Crown,
    Sparkles,
    Flame,
    TrendingUp,
    Minus,
    ArrowRight,
    Compass,
    CheckCircle2,
    Code2,
    Layers,
    Orbit,
    Trophy,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import {
    RANKING_COPY,
    RANKED_CADETS,
    type RankedCadet,
} from "../data/landing-content";
import { useCountUp } from "../hooks/use-count-up";
import { useInView } from "../hooks/use-in-view";
import { useLiteMode } from "../hooks/use-lite-mode";
import { usePointerVars } from "../hooks/use-pointer-vars";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { Magnetic } from "../primitives/magnetic";
import { SectionHeading } from "../primitives/section-heading";

function getInitials(name: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "S"
    );
}

/** Interactive card 3D tilt with specular cursor reflection */
function useCardTilt(enabled: boolean) {
    const cardRef = useRef<HTMLDivElement>(null);

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enabled) return;
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (py - 0.5) * -12;
        const ry = (px - 0.5) * 12;
        el.style.setProperty("--card-x", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--card-y", `${(py * 100).toFixed(1)}%`);
        el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    };

    const onPointerLeave = () => {
        const el = cardRef.current;
        if (!el) return;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--card-x", "50%");
        el.style.setProperty("--card-y", "50%");
    };

    return { cardRef, onPointerMove, onPointerLeave };
}

/** Rank #1, #2, #3 Podium Card */
function PodiumCard({
    cadet,
    active,
    interactive,
}: {
    cadet: RankedCadet;
    active: boolean;
    interactive: boolean;
}) {
    const reduced = useReducedMotion();
    const st = useCountUp(cadet.st, active, reduced);
    const isFirst = cadet.rank === 1;
    const isSecond = cadet.rank === 2;
    const isThird = cadet.rank === 3;
    const { cardRef, onPointerMove, onPointerLeave } = useCardTilt(interactive);

    // Stagger delay based on rank
    const delayMs = isFirst ? 0 : isSecond ? 0 : 0;

    return (
        <li
            className={cn(
                "relative flex flex-col items-center",
                isFirst && "order-1 sm:order-2 z-20 w-full sm:w-[22rem] lg:w-[24rem]",
                isSecond && "order-2 sm:order-1 z-10 w-full sm:w-[19rem] lg:w-[20.5rem]",
                isThird && "order-3 sm:order-3 z-10 w-full sm:w-[19rem] lg:w-[20.5rem]"
            )}
        >
            <div
                ref={cardRef}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                className={cn(
                    "group relative w-full transition-all duration-700 ease-out will-change-transform",
                    isFirst ? "sm:-translate-y-6 lg:-translate-y-8" : "translate-y-0"
                )}
                style={{
                    opacity: active ? 1 : 0,
                    transform: active
                        ? `perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(${isFirst ? "-1.5rem" : "0"
                        })`
                        : "translateY(36px)",
                    transitionDelay: `${delayMs}ms`,
                }}
            >
                {/* Background Corona / Aurora for #1 */}
                {isFirst && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-b from-gold-500/25 via-gold-500/10 to-transparent blur-2xl opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 nl-aurora"
                    />
                )}

                {/* Subtle back ambient glow for #2 & #3 */}
                {!isFirst && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gold-500/10 blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-500"
                    />
                )}

                {/* Main Glass Podium Card */}
                <article
                    className={cn(
                        "relative flex flex-col items-center rounded-3xl p-6 !pt-10 sm:p-7 text-center backdrop-blur-xl transition-all duration-300 overflow-hidden",
                        isFirst
                            ? "border-2 border-gold-500/60 bg-gradient-to-b from-space-900/95 via-space-900/85 to-space-950/95 shadow-[var(--shadow-gold-strong)] group-hover:border-gold-400 group-hover:shadow-[0_0_35px_rgba(232,184,74,0.35)]"
                            : "border border-border-gold-subtle bg-gradient-to-b from-space-900/80 via-space-900/65 to-space-950/90 shadow-2 hover:border-gold-500/40 hover:shadow-gold"
                    )}
                >
                    {/* Dynamic Specular Sheen (follows cursor) */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            background:
                                "radial-gradient(350px circle at var(--card-x, 50%) var(--card-y, 50%), rgba(232, 184, 74, 0.18), transparent 70%)",
                        }}
                    />

                    {/* Scan line highlight on hover */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold-500/10 to-transparent group-hover:animate-[nl-scan_1.6s_ease-in-out_infinite]"
                    />

                    {/* Celestial Orbital Halo */}
                    <div className="relative mt-2 flex items-center justify-center">
                        {isFirst ? (
                            <>
                                {/* Double Concentric Planetary Orbit Rings for Rank 1 */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute size-36 sm:size-40 rounded-full border border-dashed border-gold-500/35 nl-spin-slow"
                                >
                                    <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_8px_#E8B84A]" />
                                </div>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute size-28 sm:size-32 rounded-full border border-gold-500/25 nl-spin-reverse"
                                >
                                    <span className="absolute top-1/2 -right-1 -translate-y-1/2 size-1.5 rounded-full bg-starlight-100 shadow-[0_0_6px_#fff]" />
                                </div>
                                <span
                                    aria-hidden="true"
                                    className="nl-pulse-ring absolute size-24 rounded-full border border-gold-500/60"
                                />

                                {/* Crown for Zenith #1 */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                    <Crown className="size-6 text-gold-400 drop-shadow-[0_0_10px_rgba(232,184,74,0.8)] nl-float" />
                                </div>
                            </>
                        ) : (
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute size-28 rounded-full border border-border-gold-subtle/40 nl-spin-slow"
                            >
                                <span className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-gold-500/80 shadow-[0_0_6px_#E8B84A]" />
                            </div>
                        )}

                        {/* Avatar Node */}
                        <div className="relative">
                            <Avatar
                                size={isFirst ? "xl" : "md"}
                                className={cn(
                                    "transition-transform duration-300 group-hover:scale-105",
                                    isFirst
                                        ? "size-20 sm:size-24 border-2 border-gold-400 ring-4 ring-gold-500/20 shadow-gold"
                                        : "size-16 sm:size-18 border border-gold-500/40 ring-2 ring-gold-500/10"
                                )}
                            >
                                <AvatarFallback
                                    className={cn(
                                        "font-technical font-bold text-base sm:text-lg",
                                        isFirst
                                            ? "bg-gradient-to-br from-gold-500/25 via-space-850 to-space-950 text-gold-300"
                                            : "bg-space-850 text-starlight-200"
                                    )}
                                >
                                    {getInitials(cadet.name)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Rank Badge */}
                            <span
                                className={cn(
                                    "absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center font-technical font-extrabold rounded-full transition-transform duration-300 group-hover:scale-110",
                                    isFirst
                                        ? "size-8 sm:size-9 bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-space-950 text-sm sm:text-base shadow-[var(--shadow-gold-strong)] ring-2 ring-space-950"
                                        : "size-7 sm:size-8 bg-space-800 text-gold-400 border border-gold-500/40 text-xs sm:text-sm ring-2 ring-space-950 shadow-1"
                                )}
                            >
                                {isFirst ? "01" : cadet.rank === 2 ? "02" : "03"}
                            </span>
                        </div>
                    </div>

                    {/* Cadet Identity & Celestial Designation */}
                    <div className="mt-5 w-full">
                        {/* <div className="flex items-center justify-center gap-1.5">
                            <Sparkles className="size-3.5 text-gold-500/80" />
                            <p className="font-technical text-xs font-semibold tracking-widest text-gold-500 uppercase">
                                {cadet.celestialRole}
                            </p>
                        </div> */}

                        <h3 className="mt-1 font-heading text-lg sm:text-xl font-bold text-starlight-100 group-hover:text-gold-300 transition-colors">
                            {cadet.name}
                        </h3>

                        <p className="font-technical text-xs text-starlight-400">
                            {/* @{cadet.handle} · {cadet.orbit} */}
                        </p>
                    </div>

                    {/* Space Tokens (ST) Metric */}
                    <div className="mt-4 flex flex-col items-center rounded-2xl bg-space-950/70 border border-border-gold-subtle/30 px-5 py-3 w-full backdrop-blur-md">
                        <span className="font-technical text-[11px] uppercase tracking-wider text-starlight-400">
                            Stellar Score
                        </span>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span
                                className={cn(
                                    "font-technical font-extrabold tabular-nums tracking-tight",
                                    isFirst
                                        ? "text-2xl sm:text-3xl text-gold-400 drop-shadow-[0_0_12px_rgba(232,184,74,0.4)]"
                                        : "text-xl sm:text-2xl text-starlight-100"
                                )}
                            >
                                {st}
                            </span>
                            <span className="font-technical text-xs font-bold text-gold-500">
                                ST
                            </span>
                        </div>
                    </div>

                    {/* Telemetry Pills (Tasks, Streak, Trend) */}
                    {/* <div className="mt-3.5 flex w-full items-center justify-between gap-2 border-t border-border-subtle pt-3 text-xs font-technical">
                        <div className="flex items-center gap-1.5 text-starlight-300">
                            <Flame className="size-3.5 text-amber-500 fill-amber-500/20" />
                            <span>{cadet.streakDays}d streak</span>
                        </div>

                        <div className="flex items-center gap-1 text-starlight-400">
                            <CheckCircle2 className="size-3.5 text-gold-500/70" />
                            <span>{cadet.tasksSolved} tasks</span>
                        </div>

                        <div className="flex items-center gap-1 font-semibold text-emerald-400">
                            <TrendingUp className="size-3.5" />
                            <span>+{cadet.trendDelta ?? 1}</span>
                        </div>
                    </div> */}

                    {/* Specialty Pill for First Place */}
                    {/* {isFirst && cadet.specialty && (
                        <div className="mt-3 w-full rounded-xl bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 text-center">
                            <p className="font-technical text-[11px] text-gold-400 tracking-wide font-medium">
                                Focus: {cadet.specialty}
                            </p>
                        </div>
                    )} */}
                </article>

                {/* Base Pedestal Light Pillar */}
                <div
                    aria-hidden="true"
                    className={cn(
                        "relative mx-auto w-4/5 origin-bottom transition-all duration-1000",
                        isFirst ? "h-16 sm:h-20" : isSecond ? "h-10 sm:h-12" : "h-6 sm:h-8"
                    )}
                    style={{
                        transform: `scaleY(${active ? 1 : 0})`,
                        transitionDelay: `${delayMs + 100}ms`,
                    }}
                >
                    <div className="absolute inset-x-0 bottom-full h-16 bg-gradient-to-t from-gold-500/25 to-transparent blur-sm" />
                    <div
                        className={cn(
                            "h-full rounded-t-2xl border border-b-0",
                            isFirst
                                ? "border-gold-500/40 bg-gradient-to-b from-gold-500/20 via-space-850 to-space-950"
                                : "border-border-gold-subtle bg-gradient-to-b from-gold-500/10 via-space-850 to-space-950"
                        )}
                    />
                </div>
            </div>
        </li>
    );
}

/** Ascending Star Field Cadets Card (Ranks 4 - 8) */
function RosterCard({
    cadet,
    interactive,
}: {
    cadet: RankedCadet;
    interactive: boolean;
}) {
    const { cardRef, onPointerMove, onPointerLeave } = useCardTilt(interactive);

    return (
        <article
            ref={cardRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="group relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-space-900/70 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-gold-500/40 hover:bg-space-900/90 hover:shadow-gold overflow-hidden"
            style={{
                transform: "perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
            }}
        >
            {/* Dynamic Specular cursor reflection */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background:
                        "radial-gradient(280px circle at var(--card-x, 50%) var(--card-y, 50%), rgba(232, 184, 74, 0.12), transparent 70%)",
                }}
            />

            {/* Top row: Rank, Avatar, Name & Handle */}
            <div className="flex items-center gap-3">
                {/* Rank number badge */}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-space-850 border border-border-subtle font-technical text-xs font-bold text-starlight-300 group-hover:border-gold-500/40 group-hover:text-gold-400 transition-colors">
                    #{cadet.rank < 10 ? `0${cadet.rank}` : cadet.rank}
                </span>

                <Avatar size="default" className="size-10 border border-gold-500/25 ring-1 ring-gold-500/10">
                    <AvatarFallback className="bg-space-800 text-xs font-technical font-bold text-starlight-200">
                        {getInitials(cadet.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="truncate font-heading text-sm font-bold text-starlight-100 group-hover:text-gold-300 transition-colors">
                            {cadet.name}
                        </h4>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-space-800/80 px-2 py-0.5 font-technical text-[10px] text-starlight-300 border border-border-subtle">
                            {/* {cadet.trackLabel} */}
                        </span>
                    </div>
                    <p className="truncate font-technical text-xs text-starlight-400">
                        {/* @{cadet.handle} · {cadet.celestialRole} */}
                    </p>
                </div>
            </div>

            {/* Bottom telemetry row: Streak, Tasks, ST Score & Trend */}
            <div className="mt-4 flex items-center justify-between border-t border-border-subtle/60 pt-3">
                <div className="flex items-center gap-3 text-xs font-technical text-starlight-300">
                    <span className="flex items-center gap-1">
                        <Flame className="size-3 text-amber-500" />
                        {/* {cadet.streakDays}d */}
                    </span>
                    <span className="text-starlight-400">·</span>
                    <span className="flex items-center gap-1">
                        <Code2 className="size-3 text-gold-500/70" />
                        {/* {cadet.tasksSolved} tasks */}
                    </span>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="text-right">
                        <span className="font-technical text-sm font-bold text-gold-400">
                            {cadet.st.toLocaleString()}
                        </span>
                        <span className="ml-1 font-technical text-[10px] text-gold-500/80">
                            ST
                        </span>
                    </div>

                    {/* {cadet.trend === "up" ? (
                        <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-technical text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                            <TrendingUp className="size-3" />
                            +{cadet.trendDelta ?? 1}
                        </span>
                    ) : (
                        <span className="flex items-center gap-0.5 rounded-md bg-space-800/70 px-1.5 py-0.5 font-technical text-[11px] text-starlight-400 border border-border-subtle">
                            <Minus className="size-3" />
                        </span>
                    )} */}
                </div>
            </div>
        </article>
    );
}

/** SVG Constellation Map linking stars */
function ConstellationWebSvg() {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-16 h-[34rem] w-full overflow-visible opacity-30 sm:opacity-40"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id="constellation-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--gold-400)" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="var(--gold-500)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--gold-600)" stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Constellation line: Left Flank (#2) -> Zenith (#1) -> Right Flank (#3) */}
            <path
                d="M 240 240 L 500 120 L 760 260"
                fill="none"
                stroke="url(#constellation-gold)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                className="nl-dash-flow"
            />

            {/* Downward network nodes branching toward the starfield */}
            <path
                d="M 240 240 L 320 420 M 500 120 L 500 440 M 760 260 L 680 420"
                fill="none"
                stroke="var(--gold-500)"
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="2 4"
            />

            {/* Star vertices with twinkling light dots */}
            <circle cx="500" cy="120" r="5" fill="var(--gold-300)" className="nl-twinkle" />
            <circle cx="240" cy="240" r="4" fill="var(--gold-400)" className="nl-twinkle" />
            <circle cx="760" cy="260" r="4" fill="var(--gold-400)" className="nl-twinkle" />
            <circle cx="320" cy="420" r="3" fill="var(--starlight-100)" opacity="0.6" />
            <circle cx="500" cy="440" r="3" fill="var(--starlight-100)" opacity="0.6" />
            <circle cx="680" cy="420" r="3" fill="var(--starlight-100)" opacity="0.6" />
        </svg>
    );
}

/**
 * NST Landing Page: The Cosmic Ranking Experience.
 *
 * Storytelling: "The brightest stars are not just the ones who shine —
 * they are the ones who keep moving forward."
 *
 * Combines:
 * 1. Celestial Zenith Podium for Top 3 with rotating orbits & golden auroras.
 * 2. Interactive Parallax and 3D card tilt with specular cursor reflection.
 * 3. Dynamic track filters (All, Beginner, Intermediate).
 * 4. Ascending Starfield roster for top community cadets.
 * 5. Inspiring cosmic transition CTA ("Your place among the stars is waiting").
 */
export function RankingChamber() {
    const lite = useLiteMode();
    const reduced = useReducedMotion();
    const interactive = !lite && !reduced;
    const pointerRef = usePointerVars<HTMLDivElement>(interactive);
    const { ref: viewRef, inView } = useInView<HTMLDivElement>({
        threshold: 0.15,
        once: true,
    });

    const [activeTrack, setActiveTrack] = useState<"all" | "beginner" | "intermediate">("all");

    // Top 3 cadets are always the absolute batch podium
    const topThree = useMemo(() => RANKED_CADETS.slice(0, 3), []);

    // Cadets 4 to 8, filtered by track if selected
    const ascendingCadets = useMemo(() => {
        const remaining = RANKED_CADETS.slice(3);
        if (activeTrack === "all") return remaining;
        // return remaining.filter((c) => c.track === activeTrack);
    }, [activeTrack]);

    return (
        <section
            id="ranking"
            ref={pointerRef}
            className="relative mx-auto scroll-mt-12 px-5 !pt-0 py-24 sm:px-8 sm:py-32 overflow-hidden"
            aria-label="NST Cosmic Leaderboard"
        >
            <div className="nl-hairline mx-auto mb-20 h-px max-w-4xl" aria-hidden="true" />
            {/* Ambient Radial Cursor Spotlight (Smoothly tracked by --mx, --my) */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700"
                style={{
                    background:
                        "radial-gradient(750px circle at calc(50% + var(--mx, 0) * 320px) calc(28% + var(--my, 0) * 180px), rgba(var(--nl-gold-rgb) / 0.12), transparent 70%)",
                }}
            />

            {/* Subtle celestial orbital lines in background */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[44rem] sm:size-[56rem] rounded-full border border-gold-500/10 opacity-60 nl-spin-slow"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-[34rem] sm:size-[44rem] rounded-full border border-dashed border-gold-500/15 opacity-40 nl-spin-reverse"
            />

            {/* Section Header */}
            <Reveal>
                <div className="relative z-10 mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1 text-xs font-technical font-semibold tracking-[0.2em] text-gold-400 uppercase shadow-xs">
                        <Compass className="size-3.5 text-gold-400" />
                        {RANKING_COPY.kicker}
                    </div>

                    <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-balance text-starlight-100 sm:text-4xl md:text-5xl lg:text-6xl">
                        {RANKING_COPY.headline}
                    </h2>

                    <p className="mt-4 text-base sm:text-lg text-balance text-starlight-300 max-w-2xl mx-auto leading-relaxed">
                        {RANKING_COPY.support}
                    </p>

                    {/* Orbit / Track Filter Bar */}
                    {/* <div className="mt-8 inline-flex items-center rounded-2xl bg-space-900/80 p-1.5 border border-border-subtle shadow-1 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setActiveTrack("all")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-technical font-semibold transition-all duration-200 cursor-pointer",
                                activeTrack === "all"
                                    ? "bg-gold-500 text-space-950 shadow-gold"
                                    : "text-starlight-300 hover:text-starlight-100 hover:bg-space-800/60"
                            )}
                        >
                            <Orbit className="size-3.5" />
                            All Constellations
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTrack("beginner")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-technical font-semibold transition-all duration-200 cursor-pointer",
                                activeTrack === "beginner"
                                    ? "bg-gold-500 text-space-950 shadow-gold"
                                    : "text-starlight-300 hover:text-starlight-100 hover:bg-space-800/60"
                            )}
                        >
                            <Layers className="size-3.5" />
                            Foundations Orbit
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTrack("intermediate")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-technical font-semibold transition-all duration-200 cursor-pointer",
                                activeTrack === "intermediate"
                                    ? "bg-gold-500 text-space-950 shadow-gold"
                                    : "text-starlight-300 hover:text-starlight-100 hover:bg-space-800/60"
                            )}
                        >
                            <Trophy className="size-3.5" />
                            Problem Solving Orbit
                        </button>
                    </div> */}
                </div>
            </Reveal>

            {/* Main Ranking Stage */}
            <div ref={viewRef} className="relative z-10 mt-14 sm:mt-20">
                {/* SVG Constellation Network */}
                <ConstellationWebSvg />

                {/* Celestial Podium (Top 3 Brightest Stars) */}
                <ol
                    aria-label="Podium of top three cadets"
                    className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 sm:gap-4 lg:gap-8"
                >
                    {topThree.map((cadet) => (
                        <PodiumCard
                            key={cadet.rank}
                            cadet={cadet}
                            active={inView}
                            interactive={interactive}
                        />
                    ))}
                </ol>

                {/* Celestial Hairline Separator */}
                <div className="nl-hairline mx-auto mt-12 mb-16 h-px max-w-4xl" aria-hidden="true" />

                {/* Ascending Stars in Orbit (Starfield Roster: Ranks 4 to 8) */}
                {/* <div className="relative mx-auto max-w-5xl">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="font-technical text-xs font-semibold uppercase tracking-wider text-gold-500">
                                    Ascending Starfield
                                </span>
                            </div>
                            <h3 className="mt-1 font-heading text-xl font-bold text-starlight-100">
                                Cadets Rising Through The Orbits
                            </h3>
                        </div>

                        <p className="font-technical text-xs text-starlight-400">
                            Showing {ascendingCadets.length} stars progressing to Zenith
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                        {ascendingCadets.map((cadet) => (
                            <RosterCard
                                key={cadet.rank}
                                cadet={cadet}
                                interactive={interactive}
                            />
                        ))}
                    </div>
                </div> */}

                {/* Cosmic Storytelling Transition & Bottom CTA */}

            </div>
        </section>
    );
}
