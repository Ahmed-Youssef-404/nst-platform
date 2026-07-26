// src/components/landing/about.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { Compass, Route, Users } from "lucide-react";

const POINTS = [
    {
        icon: Compass,
        title: "Where we started",
        body: "Northern Stars Team is a student-led community founded by students who experienced the same challenges every beginner faces.",
    },
    {
        icon: Route,
        title: "What we learned",
        body: "Throughout our journey, we made countless mistakes, wasted time following the wrong paths, and learned many valuable lessons along the way.",
    },
    {
        icon: Users,
        title: "What we built",
        body: "Instead of letting others repeat the same journey, we built a community with a clearer roadmap, practical guidance, and a supportive environment for every member.",
    },
];

export function About() {
    return (
        <section id="about" className="mx-auto max-w-6xl px-6 py-28">
            <Reveal>
                <div className="mx-auto max-w-3xl text-center">
                    <span className="text-sm font-medium tracking-wide text-primary uppercase">
                        About Us
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                        Built by students, for students
                    </h2>
                </div>
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
                {POINTS.map((point, i) => (
                    <Reveal key={point.title} delay={i * 120}>
                        <Card className="h-full">
                            <CardContent className="flex h-full flex-col gap-4">
                                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <point.icon className="size-5" />
                                </div>
                                <h3 className="font-display text-lg font-semibold">{point.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {point.body}
                                </p>
                            </CardContent>
                        </Card>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}