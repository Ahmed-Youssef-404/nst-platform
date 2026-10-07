"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginDialog } from "@/components/login-dialog";
import { NAV_LINKS } from "./data/landing-content";
import { useReducedMotion } from "./hooks/use-reduced-motion";

/**
 * Mapping of section IDs on the page to the 5 curated navbar links.
 * Ensures the active link indicator accurately follows the entire journey.
 */
const SECTION_MAP: Record<string, string> = {
    philosophy: "philosophy",
    method: "philosophy",
    principles: "principles",
    "follow-up": "principles",
    foundations: "principles",
    paths: "paths",
    ranking: "ranking",
    voices: "feedback",
    feedback: "feedback",
};

/**
 * Floating navigation for desktop & tablet (hidden on mobile).
 * Features smooth glassmorphism, curated section links, active golden underline,
 * and a scroll progress indicator along its base.
 */
export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [activeId, setActiveId] = useState("");
    const progressRef = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();

    // Track scroll depth and fill ambient progress hairline
    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            setScrolled(window.scrollY > 24);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            progressRef.current?.style.setProperty("transform", `scaleX(${p.toFixed(4)})`);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    // Track which section is in view and highlight the corresponding nav link
    useEffect(() => {
        const sectionIds = Object.keys(SECTION_MAP);
        const targets = sectionIds
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);

        const handleScroll = () => {
            if (window.scrollY < 120) {
                setActiveId("");
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (window.scrollY < 120) {
                    setActiveId("");
                    return;
                }
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((a, b) =>
                    a.boundingClientRect.top < b.boundingClientRect.top ? a : b
                );
                const mapped = SECTION_MAP[top.target.id];
                if (mapped) setActiveId(mapped);
            },
            { rootMargin: "-20% 0px -40% 0px" }
        );

        targets.forEach((el) => observer.observe(el));
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    function goTo(event: React.MouseEvent, id: string) {
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
            <div
                className={cn(
                    "relative mx-auto max-w-6xl overflow-hidden rounded-full border transition-all duration-500",
                    scrolled
                        ? "border-[color:var(--border-default)] bg-space-950/75 shadow-[var(--shadow-3)] backdrop-blur-xl"
                        : "border-transparent bg-transparent"
                )}
            >
                <div className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-3.5 sm:py-2 sm:pr-2 sm:pl-5">
                    {/* Brand / Logo */}
                    <a
                        href="#top"
                        onClick={(e) => goTo(e, "top")}
                        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        aria-label="NST, back to top"
                    >
                        <span className="flex size-8 items-center justify-center rounded-xl bg-gold-500 font-technical text-sm font-bold text-space-950 shadow-[var(--shadow-gold)] sm:size-9 sm:text-base">
                            N
                        </span>
                        <span className="font-heading text-base font-extrabold tracking-tight text-starlight-100 sm:text-lg">
                            NST
                        </span>
                    </a>

                    {/* Curated Primary Links (Hidden on mobile, visible on desktop) */}
                    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map((link) => {
                            const isActive = activeId === link.id;
                            return (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={(e) => goTo(e, link.id)}
                                    aria-current={isActive ? "location" : undefined}
                                    className={cn(
                                        "relative rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-500",
                                        isActive
                                            ? "text-gold-500 font-semibold"
                                            : "text-starlight-300 hover:text-starlight-100"
                                    )}
                                >
                                    {link.label}
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "absolute bottom-1 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gold-500 transition-all duration-300 shadow-[0_0_8px_var(--gold-500)]",
                                            isActive ? "w-5 opacity-100" : "w-0 opacity-0"
                                        )}
                                    />
                                </a>
                            );
                        })}
                    </nav>

                    {/* Actions: Theme Toggle & Get Started */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <ThemeToggle />
                        <LoginDialog>
                            <Button
                                size="sm"
                                className="h-8 rounded-full bg-gold-500 px-3.5 text-xs font-semibold text-space-950 hover:bg-gold-400 shadow-[var(--shadow-gold-subtle)] sm:h-9 sm:px-5 sm:text-sm"
                            >
                                Get Started
                            </Button>
                        </LoginDialog>
                    </div>
                </div>

                {/* Ambient Progress Hairline along base */}
                <span
                    ref={progressRef}
                    aria-hidden="true"
                    className="nl-hairline absolute inset-x-0 bottom-0 h-px origin-left scale-x-0"
                />
            </div>
        </header>
    );
}
