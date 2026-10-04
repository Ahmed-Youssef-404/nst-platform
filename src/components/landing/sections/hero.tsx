"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { Reveal } from "@/components/reveal";
import { HERO_COPY, type LandingStat } from "../data/landing-content";
import { useLiteMode } from "../hooks/use-lite-mode";
import { usePointerVars } from "../hooks/use-pointer-vars";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { Magnetic } from "../primitives/magnetic";
import { HeroField } from "./hero-field";
import { HeroStats } from "./hero-stats";
import { MindsetCore } from "./mindset-core";

export function Hero({ stats }: { stats: LandingStat[] }) {
    const lite = useLiteMode();
    const reduced = useReducedMotion();
    const ref = usePointerVars<HTMLElement>(!lite && !reduced);

    const [before, after] = HERO_COPY.headline.split(HERO_COPY.headlineAccent);

    return (
        <section id="top" ref={ref} className="relative isolate overflow-hidden">
            <HeroField className="absolute inset-0 -z-10 h-full w-full" />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_70%_45%,transparent,var(--space-950)_100%)] opacity-70"
            />

            <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-10 px-6 pt-28 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
                <div>
                    <Reveal>
                        <p className="inline-flex items-center gap-3 font-technical text-xs tracking-[0.28em] text-gold-500 uppercase">
                            <span className="nl-hairline h-px w-10" aria-hidden="true" />
                            {HERO_COPY.eyebrow}
                        </p>
                    </Reveal>

                    <Reveal delay={100}>
                        <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.02] tracking-tight text-balance text-starlight-100 sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
                            {before}
                            <span className="nl-gold-text">{HERO_COPY.headlineAccent}</span>
                            {after}
                        </h1>
                    </Reveal>

                    <Reveal delay={220}>
                        <p className="mt-6 max-w-md text-lg text-starlight-300 sm:text-xl">
                            {HERO_COPY.support}
                        </p>
                    </Reveal>

                    <Reveal delay={330}>
                        <div className="mt-10">
                            <Magnetic>
                                <LoginDialog>
                                    <Button
                                        size="lg"
                                        className="group h-14 gap-3 rounded-full bg-gold-500 px-8 text-base font-semibold text-space-950 shadow-[var(--shadow-gold)] hover:bg-gold-400 hover:shadow-[var(--shadow-gold-strong)]"
                                    >
                                        {HERO_COPY.cta}
                                        <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                                    </Button>
                                </LoginDialog>
                            </Magnetic>
                        </div>
                    </Reveal>

                    <Reveal delay={440} className="mt-14 max-w-lg">
                        <HeroStats stats={stats} />
                    </Reveal>
                </div>

                <Reveal delay={200} direction="none">
                    <MindsetCore />
                </Reveal>
            </div>

            <a
                href="#philosophy"
                aria-label="Scroll to the next section"
                className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-starlight-400 transition-colors hover:text-gold-500 sm:block"
            >
                <ChevronDown className="size-6 nl-float" />
            </a>
        </section>
    );
}
