// src/components/maintenance/maintenance-screen.tsx
// Server Component. Rendered by the student layout INSTEAD of the student
// shell + page while Maintenance Mode is on. It has no sidebar, top bar, ST
// balance or navigation, and it fetches no student data.

import { Sparkles } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import "./maintenance.css";
import { MaintenanceScene } from "./maintenance-scene";
import { MaintenancePlanet } from "./maintenance-planet";

interface MaintenanceScreenProps {
    /** Optional note written by the Super Admin. */
    message?: string | null;
    /** True when the setting couldn't be read (fail-safe copy, no claims). */
    statusUnknown?: boolean;
}

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function MaintenanceScreen({ message, statusUnknown = false }: MaintenanceScreenProps) {
    const eyebrow = statusUnknown ? "STATUS UNAVAILABLE" : "TEMPORARY MAINTENANCE";
    const statusText = statusUnknown
        ? "We can\u2019t confirm the platform\u2019s status right now."
        : "The platform is currently offline for maintenance.";

    return (
        <div className="mt-root relative isolate flex min-h-svh w-full flex-col overflow-hidden bg-space-950 text-starlight-100 selection:bg-gold-500/25 selection:text-gold-300">
            <title>{statusUnknown ? "Status unavailable" : "Maintenance"} — NST Platform</title>
            <MaintenanceScene />

            <header className="relative z-10 flex items-center justify-center px-5 pt-7 sm:pt-9">
                <div className="mt-rise flex items-center gap-2" style={rise(0)}>
                    <Sparkles className="size-4 text-gold-500" aria-hidden="true" />
                    <span className="font-technical text-sm font-bold tracking-tight text-starlight-100">
                        NST Platform
                    </span>
                </div>
            </header>

            <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-6 text-center sm:px-8">
                <div className="mt-rise" style={rise(1)}>
                    <MaintenancePlanet />
                </div>

                <p
                    className="mt-rise mt-3 font-technical text-[11px] font-medium tracking-[0.28em] text-gold-500 uppercase sm:text-xs"
                    style={rise(2)}
                >
                    {eyebrow}
                </p>

                <h1
                    className="mt-rise mt-3 font-heading text-3xl leading-[1.1] font-extrabold tracking-tight text-balance text-starlight-100 sm:text-4xl md:text-5xl"
                    style={rise(3)}
                >
                    {statusUnknown ? (
                        "We\u2019ll be right back."
                    ) : (
                        <>
                            We&rsquo;re preparing for <span className="mt-gold-text">what&rsquo;s next.</span>
                        </>
                    )}
                </h1>

                <p
                    className="mt-rise mt-4 max-w-xl text-base text-balance text-starlight-300 sm:text-lg"
                    style={rise(4)}
                >
                    {statusUnknown
                        ? "NST can\u2019t verify its availability at the moment. Please refresh in a little while \u2014 your journey is still here."
                        : "NST Platform is temporarily unavailable while we make improvements to your learning experience. Your journey is still here, and we\u2019ll be back soon."}
                </p>

                {message && (
                    <figure
                        className="mt-rise mt-6 w-full max-w-lg rounded-2xl border border-gold-500/25 bg-space-900/60 px-5 py-4 text-left backdrop-blur-md"
                        style={rise(5)}
                    >
                        <figcaption className="font-technical text-[10px] font-medium tracking-[0.24em] text-gold-500 uppercase">
                            A note from the NST team
                        </figcaption>
                        <p className="mt-2 text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-line text-starlight-200 sm:text-base">
                            {message}
                        </p>
                    </figure>
                )}

                <div
                    role="status"
                    className="mt-rise mt-7 inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-space-900/60 px-4 py-2 text-xs text-starlight-200 backdrop-blur-md sm:text-sm"
                    style={rise(6)}
                >
                    <span
                        className="mt-pulse size-2 shrink-0 rounded-full bg-gold-500 shadow-[0_0_0_0_rgb(var(--mt-gold-rgb)/0.5)]"
                        aria-hidden="true"
                    />
                    <span>{statusText}</span>
                </div>

                {!statusUnknown && (
                    <p
                        className="mt-rise mt-4 max-w-md text-xs text-balance text-starlight-400 sm:text-sm"
                        style={rise(7)}
                    >
                        Your progress is saved &mdash; maintenance doesn&rsquo;t touch your work, ST balance or
                        submissions.
                    </p>
                )}

                <div className="mt-rise mt-8" style={rise(8)}>
                    <LogoutButton className="border-border/70 bg-space-900/60 text-starlight-200 backdrop-blur-md" />
                </div>
            </main>

            <footer className="relative z-10 flex items-center justify-center gap-2 px-5 pt-2 pb-6 font-technical text-[11px] tracking-wide text-starlight-400">
                <span>Northern Stars Team</span>
                <span aria-hidden="true">·</span>
                <span>{statusUnknown ? "Status unavailable" : "Maintenance in progress"}</span>
            </footer>
        </div>
    );
}
