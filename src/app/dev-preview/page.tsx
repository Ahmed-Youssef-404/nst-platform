// src/app/dev-preview/page.tsx
// TEMPORARY — visual check for the shimmer skeletons + scroll-reveal
// animations against the real brand tokens. Safe to delete after review.
"use client";

import { useState } from "react";
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DevPreviewPage() {
    const [replayKey, setReplayKey] = useState(0);

    return (
        <div className="mx-auto max-w-3xl space-y-16 px-6 py-12">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Design system preview</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setReplayKey((k) => k + 1)}>
                        Replay reveal animations
                    </Button>
                    <ThemeToggle />
                </div>
            </div>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Skeleton — shimmer</h2>
                <div className="grid grid-cols-2 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                    <SkeletonAvatar size="size-14" />
                    <SkeletonText lines={3} className="flex-1" />
                </div>
                <Skeleton className="h-32 w-full" />
            </section>

            <section className="space-y-4" key={replayKey}>
                <h2 className="text-lg font-semibold">Reveal on scroll</h2>
                <p className="text-sm text-muted-foreground">
                    Scroll down slowly — each card animates in once it enters the viewport.
                </p>
                <div className="grid grid-cols-3 gap-4">
                    {["Fast track", "Guided path", "Deep dive"].map((label, i) => (
                        <Reveal key={label} delay={i * 120}>
                            <div className="rounded-xl border border-border bg-card p-6 text-center">
                                <p className="font-medium">{label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">Card {i + 1}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>

                <div className="h-[60vh]" />

                <Reveal direction="left">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <p className="font-medium">Slides in from the right</p>
                    </div>
                </Reveal>

                <div className="h-[60vh]" />

                <Reveal direction="up" duration={800}>
                    <div className="rounded-xl bg-primary p-6 text-primary-foreground">
                        <p className="font-medium">Primary gold surface — check text contrast</p>
                    </div>
                </Reveal>

                <div className="h-[30vh]" />

                <Reveal direction="up">
                    <div className="rounded-xl bg-accent p-6 text-accent-foreground">
                        <p className="font-medium">Accent / error surface — check text contrast</p>
                    </div>
                </Reveal>

                <div className="h-[20vh]" />
            </section>
        </div>
    );
}