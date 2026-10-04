"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { LEARNING_PATHS, PATHS_COPY, type LearningPath } from "../data/landing-content";
import { SectionHeading } from "../primitives/section-heading";
import { LANDSCAPE, PORTRAIT, PathsDiagram } from "./paths-diagram";

/** Beginner builds the foundation, Intermediate strengthens the thinking. Pick one to compare. */
export function LearningPaths() {
    const [selectedId, setSelectedId] = useState<LearningPath["id"]>("beginner");
    const selected = LEARNING_PATHS.find((path) => path.id === selectedId) ?? LEARNING_PATHS[0];

    return (
        <section id="paths" className="relative mx-auto max-w-6xl scroll-mt-12 px-6 py-24 sm:py-32">
            <Reveal>
                <SectionHeading kicker={PATHS_COPY.kicker} title={PATHS_COPY.headline} align="center" />
            </Reveal>

            <Reveal delay={150} className="mt-14">
                <PathsDiagram layout={LANDSCAPE} selected={selectedId} onSelect={setSelectedId} className="hidden sm:block" />
                <PathsDiagram layout={PORTRAIT} selected={selectedId} onSelect={setSelectedId} className="max-w-xs sm:hidden" />
            </Reveal>

            <div aria-live="polite" className="mx-auto mt-10 max-w-3xl text-center">
                <div key={selected.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p className="font-heading text-2xl font-extrabold text-starlight-100 sm:text-3xl">
                        {selected.tagline}
                    </p>
                    <p className="mt-2 text-starlight-300">{selected.audience}</p>
                    <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
                        {selected.focus.map((item) => (
                            <li key={item} className="flex items-center gap-2 font-technical text-sm text-starlight-200">
                                <Check className="size-4 text-gold-500" aria-hidden="true" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
