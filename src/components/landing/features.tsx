// src/components/landing/features.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { Map, Hammer, UserCheck, HeartHandshake } from "lucide-react";

const FEATURES = [
    {
        icon: Map,
        title: "Structured Roadmaps",
        body: "A clear, ordered path through the concepts that matter—no guessing what to learn next.",
    },
    {
        icon: Hammer,
        title: "Practical Projects",
        body: "Hands-on challenges and projects that turn theory into real problem-solving skill.",
    },
    {
        icon: UserCheck,
        title: "Personal Mentorship",
        body: "Guidance from instructors who've walked the same path and know where beginners get stuck.",
    },
    {
        icon: HeartHandshake,
        title: "Supportive Community",
        body: "A community that celebrates progress and makes learning motivating and enjoyable.",
    },
];

export function Features() {
    return (
        <section id="features" className="mx-auto max-w-6xl px-6 py-28">
            <Reveal>
                <div className="mx-auto max-w-3xl text-center">
                    <span className="text-sm font-medium tracking-wide text-primary uppercase">
                        What Makes NST Different?
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                        Built around how you think, not just what you learn
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        NST is more than just another programming community. We focus on
                        building the way you think before teaching you how to solve
                        problems. Our learning experience is built around structured
                        roadmaps, hands-on projects, weekly challenges, personalized
                        mentorship, and an engaging coin system that keeps learning
                        motivating, interactive, and enjoyable from the very first step.
                    </p>
                </div>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
                {FEATURES.map((feature, i) => (
                    <Reveal key={feature.title} delay={i * 100}>
                        <Card className="h-full">
                            <CardContent className="flex h-full items-start gap-4">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                                    <feature.icon className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg font-semibold">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                        {feature.body}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}