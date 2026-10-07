"use client";

import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import {
    CYCLE_STEPS,
    EFFORT_COPY,
    FOLLOW_UP_COPY,
    FOUNDATION_COPY,
    FOUNDATION_LAYERS,
} from "../data/landing-content";
import { ScrollStage } from "../primitives/scroll-stage";
import { SectionHeading } from "../primitives/section-heading";
import { EffortGrowth } from "./effort-growth";
import { FollowUpOrbit } from "./follow-up-orbit";
import { FoundationStack } from "./foundation-stack";

/** Station 1: Continuous follow-up - scroll steps through LEARN, PRACTICE, TRACK, REVIEW, IMPROVE */
function FollowUpStation() {
    const [step, setStep] = useState(0);

    const handleProgress = (p: number) => {
        const next = Math.min(CYCLE_STEPS.length - 1, Math.floor(p * CYCLE_STEPS.length));
        setStep((current) => (current === next ? current : next));
    };

    return (
        <ScrollStage id="follow-up" length={220} onProgress={handleProgress}>
            <div className="mx-auto grid h-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16">
                <div>
                    <SectionHeading
                        kicker={FOLLOW_UP_COPY.kicker}
                        title={FOLLOW_UP_COPY.headline}
                        support={FOLLOW_UP_COPY.support}
                        as="h3"
                    />
                    <div className="mt-8 flex items-center gap-2.5" aria-label="Cycle progress">
                        {CYCLE_STEPS.map((s, idx) => (
                            <div
                                key={s.id}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === step
                                        ? "w-8 bg-gold-500 shadow-[var(--border-glow-gold)]"
                                        : idx < step
                                        ? "w-3 bg-gold-500/50"
                                        : "w-2 bg-starlight-400/20"
                                )}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <FollowUpOrbit activeStep={step} />
                </div>
            </div>
        </ScrollStage>
    );
}

/** Station 2: Strong foundations - scroll steps through Fundamentals, Logic, Thinking, Projects */
function FoundationStation() {
    const [layer, setLayer] = useState(0);

    const handleProgress = (p: number) => {
        const next = Math.min(FOUNDATION_LAYERS.length - 1, Math.floor(p * FOUNDATION_LAYERS.length));
        setLayer((current) => (current === next ? current : next));
    };

    return (
        <ScrollStage id="foundations" length={220} onProgress={handleProgress}>
            <div className="mx-auto grid h-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16">
                <div className="md:order-2">
                    <SectionHeading
                        kicker={FOUNDATION_COPY.kicker}
                        title={FOUNDATION_COPY.headline}
                        support={FOUNDATION_COPY.support}
                        as="h3"
                    />
                    <div className="mt-8 flex items-center gap-2.5" aria-label="Layer progress">
                        {FOUNDATION_LAYERS.map((l, idx) => (
                            <div
                                key={l.id}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === layer
                                        ? "w-8 bg-gold-500 shadow-[var(--border-glow-gold)]"
                                        : idx < layer
                                        ? "w-3 bg-gold-500/50"
                                        : "w-2 bg-starlight-400/20"
                                )}
                            />
                        ))}
                    </div>
                </div>
                <div className="md:order-1">
                    <FoundationStack activeLayer={layer} />
                </div>
            </div>
        </ScrollStage>
    );
}

/** The three supporting ideas: follow-up (scroll-driven), foundations (scroll-driven), genuine effort. */
export function Principles() {
    return (
        <div id="principles" className="relative">
            <FollowUpStation />
            <FoundationStation />

            <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
                <Reveal>
                    <SectionHeading
                        kicker={EFFORT_COPY.kicker}
                        title={EFFORT_COPY.headline}
                        support={EFFORT_COPY.support}
                        as="h3"
                    />
                </Reveal>
                <Reveal delay={150} className="mt-12">
                    <EffortGrowth />
                </Reveal>
            </section>
        </div>
    );
}
