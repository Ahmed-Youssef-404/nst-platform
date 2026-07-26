// src/components/landing/why-us.tsx
import { Reveal } from "@/components/reveal";
import { Constellation } from "@/components/constellation";

export function WhyUs() {
    return (
        <section id="why-us" className="relative overflow-hidden bg-[#141008] py-28 dark:bg-card/40">
            <div className="mx-auto max-w-3xl px-6 text-center">
                <Reveal>
                    <span className="text-sm font-medium tracking-wide text-secondary uppercase">
                        Why &quot;Northern Stars&quot;?
                    </span>
                </Reveal>

                <Reveal delay={100}>
                    <Constellation variant="divider" className="mx-auto mt-6" />
                </Reveal>

                <Reveal delay={180}>
                    <p className="mt-8 text-lg leading-relaxed text-balance text-zinc-200 sm:text-xl">
                        Long ago, travelers and sailors relied on the Northern Stars to
                        navigate their way through the darkness. Those stars helped
                        people find the right direction without getting lost.
                    </p>
                </Reveal>

                <Reveal delay={260}>
                    <p className="mt-5 font-display text-xl font-medium text-zinc-50 sm:text-2xl">
                        That idea inspired our name.
                    </p>
                </Reveal>

                <Reveal delay={340}>
                    <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-balance text-zinc-400">
                        Just as the Northern Stars guided travelers to their destination,
                        we aim to guide students through their learning journey, helping
                        them avoid unnecessary detours, learn the right concepts in the
                        right order, and reach their goals faster with confidence.
                    </p>
                </Reveal>
            </div>
        </section>
    );
}