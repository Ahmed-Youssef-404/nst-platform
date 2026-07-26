// src/components/landing/hero.tsx
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { Constellation } from "@/components/constellation";
import { Reveal } from "@/components/reveal";

export function Hero() {
    return (
        <section className="relative -top-20 overflow-hidden bg-[#141008] dark:bg-background">
            {/* Constellation backdrop — the page's signature visual, largest and
                most visible here since this is the "thesis" moment of the page. */}
            <div className="absolute inset-0 opacity-70">
                <Constellation variant="hero" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#141008] dark:to-background" />

            <div className="relative mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-6 py-32 text-center">
                <Reveal>
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary uppercase">
                        Northern Stars Team
                    </span>
                </Reveal>

                <Reveal delay={100}>
                    <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-balance text-zinc-50 sm:text-5xl md:text-6xl">
                        Build the Mindset of a Programmer.
                    </h1>
                </Reveal>

                <Reveal delay={220}>
                    <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-zinc-300 sm:text-lg">
                        At Northern Stars Team (NST), we don&apos;t just teach Problem
                        Solving—we help you build the way a programmer thinks. Through
                        structured roadmaps, practical challenges, projects, and a
                        supportive community, our goal is to help you grow step by step,
                        avoid common mistakes, and become a better problem solver,
                        developer, and teammate.
                    </p>
                </Reveal>

                <Reveal delay={340}>
                    <div className="mt-10">
                        <LoginDialog>
                            <Button size="lg" className="h-12 px-8 text-base">
                                Join Us
                            </Button>
                        </LoginDialog>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}