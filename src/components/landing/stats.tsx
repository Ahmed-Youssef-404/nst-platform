// src/components/landing/stats.tsx
import { Reveal } from "@/components/reveal";

const STATS = [
    { value: "+30", label: "Members" },
    { value: "+7", label: "Instructors" },
    { value: "+50", label: "Challenges Solved" },
];

export function Stats() {
    return (
        <section id="stats" className="mx-auto max-w-6xl px-6 py-28">
            <Reveal>
                <div className="mx-auto max-w-3xl text-center">
                    <span className="text-sm font-medium tracking-wide text-primary uppercase">
                        Statistics
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                        Growing with every member
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        Every great community starts with a single step. We&apos;re
                        building a place where students learn together, challenge
                        themselves, and grow consistently. These numbers will continue to
                        grow with every new member who joins the journey.
                    </p>
                </div>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
                {STATS.map((stat, i) => (
                    <Reveal key={stat.label} delay={i * 120}>
                        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center ring-1 ring-foreground/5">
                            <p className="font-display text-5xl font-semibold text-primary">
                                {stat.value}
                            </p>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}