// src/components/landing/quote.tsx
import { Reveal } from "@/components/reveal";

/**
 * Deliberately the loudest, most different-feeling moment on the page —
 * full-bleed near-black, oversized display type, nothing else competing
 * for attention. A single breath between the feature-heavy sections above
 * and the statistics/contact sections below.
 */
export function Quote() {
    return (
        <section className="bg-[#141008] py-32 dark:bg-black">
            <div className="mx-auto max-w-3xl px-6 text-center">
                <Reveal>
                    <p className="font-display text-3xl font-semibold leading-snug text-balance text-zinc-50 sm:text-4xl md:text-5xl">
                        &ldquo;Every Accepted started with a Wrong Answer.&rdquo;
                    </p>
                </Reveal>
                <Reveal delay={160}>
                    <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-balance text-zinc-400">
                        Don&apos;t be afraid to make mistakes. Every error is a lesson,
                        every challenge is an opportunity to improve, and every accepted
                        solution begins with the courage to keep trying.
                    </p>
                </Reveal>
            </div>
        </section>
    );
}