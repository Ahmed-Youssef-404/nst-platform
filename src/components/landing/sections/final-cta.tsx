"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { CTA_COPY, SOCIAL_LINKS } from "../data/landing-content";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { useScrollProgress } from "../hooks/use-scroll-progress";
import { Magnetic } from "../primitives/magnetic";
import { SocialIcon } from "../primitives/social-icon";

const RINGS = [0.7, 1.1, 1.5] as const;
const STAR_PATH =
    "M100 0 C106 70 130 94 200 100 C130 106 106 130 100 200 C94 130 70 106 0 100 C70 94 94 70 100 0 Z";

/**
 * The destination. As the visitor arrives, rings expand outward from a glowing
 * star (scroll-linked), and the page ends on one action plus the team's
 * channels. The text is always visible; only the decoration travels with scroll.
 */
export function FinalCta() {
    const reduced = useReducedMotion();
    const ref = useScrollProgress<HTMLElement>(undefined, reduced ? 1 : undefined);
    const channels = SOCIAL_LINKS.filter((link) => link.href);

    return (
        <section
            ref={ref}
            className="relative"
            style={reduced ? undefined : { height: "170svh" }}
        >
            {/* Anchor for nav links: lands exactly when the arrival is complete. */}
            <div id="contact" className="pointer-events-none absolute bottom-0 h-svh w-full" aria-hidden="true" />

            <div className={reduced ? "relative min-h-svh py-24" : "sticky top-0 h-svh overflow-hidden"}>
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    {RINGS.map((size, i) => (
                        <span
                            key={size}
                            className="absolute aspect-square w-[min(90vw,46rem)] rounded-full border border-gold-500/40"
                            style={{
                                transform: `scale(calc(${0.35 + i * 0.05} + var(--p) * ${size}))`,
                                opacity: `calc(0.2 + var(--p) * ${0.7 - i * 0.18})`,
                            }}
                        />
                    ))}
                    <svg
                        viewBox="0 0 200 200"
                        className="absolute w-[min(60vw,22rem)] overflow-visible nl-float"
                        style={{ opacity: "calc(0.25 + var(--p) * 0.45)", transform: "scale(calc(0.7 + var(--p) * 0.5))" }}
                    >
                        <defs>
                            <radialGradient id="cta-star" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="var(--gold-300)" />
                                <stop offset="100%" stopColor="var(--gold-600)" />
                            </radialGradient>
                            <radialGradient id="cta-glow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <circle cx="100" cy="100" r="140" fill="url(#cta-glow)" />
                        <path d={STAR_PATH} fill="url(#cta-star)" />
                    </svg>
                </div>

                <div className="relative mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">
                    <h2 className="font-heading text-5xl font-extrabold leading-[1.04] tracking-tight text-balance text-starlight-100 sm:text-7xl">
                        {CTA_COPY.headline}
                    </h2>
                    <p className="mt-5 text-lg text-balance text-starlight-300">{CTA_COPY.support}</p>

                    <div className="mt-10">
                        <Magnetic>
                            <LoginDialog>
                                <Button
                                    size="lg"
                                    className="group h-14 gap-3 rounded-full bg-gold-500 px-8 text-base font-semibold text-space-950 shadow-[var(--shadow-gold-strong)] hover:bg-gold-400"
                                >
                                    {CTA_COPY.cta}
                                    <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                                </Button>
                            </LoginDialog>
                        </Magnetic>
                    </div>

                    <ul className="mt-12 flex flex-wrap items-center justify-center gap-4">
                        {channels.map((channel) => (
                            <li key={channel.id}>
                                <Magnetic strength={0.35} radius={40}>
                                    <a
                                        href={channel.href}
                                        target={channel.id === "email" ? undefined : "_blank"}
                                        rel="noopener noreferrer"
                                        aria-label={channel.label}
                                        className="group flex size-12 items-center justify-center rounded-full border border-[color:var(--border-default)] bg-space-900/70 text-starlight-200 backdrop-blur transition-all duration-300 hover:border-gold-500 hover:text-gold-500 hover:shadow-[var(--border-glow-gold)] focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:outline-none"
                                    >
                                        <SocialIcon id={channel.id} className="size-5 transition-transform duration-300 group-hover:scale-110" />
                                    </a>
                                </Magnetic>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
