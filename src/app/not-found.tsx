// src/app/not-found.tsx
// Global Not Found (Next.js App Router convention): rendered for any unmatched
// URL and whenever notFound() is called, inside the root layout.
import type { Metadata } from "next";
import "./not-found.css";
import { NotFoundScene } from "@/components/not-found/not-found-scene";
import { Lost404 } from "@/components/not-found/lost-404";
import { RouteMap } from "@/components/not-found/route-map";
import { RouteConsole } from "@/components/not-found/route-console";
import { NotFoundActions } from "@/components/not-found/not-found-actions";

export const metadata: Metadata = {
    title: "404 — Lost in space | NST Platform",
    robots: { index: false },
};

export default function NotFound() {
    return (
        <div className="nf-root relative isolate flex min-h-svh flex-1 flex-col overflow-hidden">
            <NotFoundScene />

            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
                <p
                    className="nf-rise font-technical text-[11px] font-medium tracking-[0.28em] text-gold-500 uppercase sm:text-xs"
                    style={{ "--i": 0 } as React.CSSProperties}
                >
                    Error 404 · Page Not Found
                </p>

                <div className="nf-rise mt-2 w-full" style={{ "--i": 1 } as React.CSSProperties}>
                    <Lost404 />
                </div>

                <div className="nf-rise w-full" style={{ "--i": 2 } as React.CSSProperties}>
                    <RouteMap className="mt-1 sm:mt-0" />
                </div>

                <h1
                    className="nf-rise mt-6 max-w-2xl font-heading text-3xl leading-[1.1] font-extrabold tracking-tight text-balance text-starlight-100 sm:text-4xl md:text-5xl"
                    style={{ "--i": 3 } as React.CSSProperties}
                >
                    This route drifted into unknown space.
                </h1>
                <p
                    className="nf-rise mt-4 max-w-xl text-base text-balance text-starlight-300 sm:text-lg"
                    style={{ "--i": 4 } as React.CSSProperties}
                >
                    The destination you asked for isn&rsquo;t anywhere in the NST universe. The link may be mistyped,
                    or the page may have moved on.
                </p>

                <div className="nf-rise mt-8" style={{ "--i": 5 } as React.CSSProperties}>
                    <NotFoundActions />
                </div>

                <div className="nf-rise mt-10 w-full" style={{ "--i": 6 } as React.CSSProperties}>
                    <RouteConsole />
                </div>
            </main>
        </div>
    );
}
