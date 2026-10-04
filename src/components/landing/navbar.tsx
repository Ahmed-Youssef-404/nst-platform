"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginDialog } from "@/components/login-dialog";
import { NAV_LINKS } from "./data/landing-content";
import { useReducedMotion } from "./hooks/use-reduced-motion";

/**
 * Floating navigation that belongs to the journey: transparent over the hero,
 * a quiet glass pill once you move, a gold active marker, and a thin gold line
 * along its base that fills as you travel down the page.
 */
export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [activeId, setActiveId] = useState("");
    const [open, setOpen] = useState(false);
    const progressRef = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();

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

    useEffect(() => {
        const targets = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
            (el): el is HTMLElement => el !== null
        );
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
                setActiveId(top.target.id);
            },
            { rootMargin: "-30% 0px -60% 0px" }
        );
        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    function goTo(event: React.MouseEvent, id: string) {
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        setOpen(false);
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
            <div
                className={cn(
                    "relative mx-auto max-w-6xl overflow-hidden rounded-full border transition-all duration-500",
                    scrolled
                        ? "border-[color:var(--border-default)] bg-space-950/70 shadow-[var(--shadow-3)] backdrop-blur-xl"
                        : "border-transparent bg-transparent"
                )}
            >
                <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4 sm:pl-5">
                    <a
                        href="#top"
                        onClick={(e) => goTo(e, "top")}
                        className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        aria-label="NST, back to top"
                    >
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gold-500 font-technical text-base font-bold text-space-950 shadow-[var(--shadow-gold)]">
                            N
                        </span>
                        <span className="font-heading text-lg font-extrabold tracking-tight text-starlight-100">NST</span>
                    </a>

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
                                        isActive ? "text-gold-500" : "text-starlight-300 hover:text-starlight-100"
                                    )}
                                >
                                    {link.label}
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "absolute bottom-1 left-1/2 h-px -translate-x-1/2 bg-gold-500 transition-all duration-300",
                                            isActive ? "w-5 opacity-100" : "w-0 opacity-0"
                                        )}
                                    />
                                </a>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LoginDialog>
                            <Button
                                size="sm"
                                className="hidden h-9 rounded-full bg-gold-500 px-5 font-semibold text-space-950 hover:bg-gold-400 sm:inline-flex"
                            >
                                Get Started
                            </Button>
                        </LoginDialog>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full md:hidden"
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            aria-controls="mobile-nav"
                            onClick={() => setOpen((v) => !v)}
                        >
                            {open ? <X className="size-4" /> : <Menu className="size-4" />}
                        </Button>
                    </div>
                </div>

                <div
                    id="mobile-nav"
                    className={cn(
                        "grid transition-all duration-300 md:hidden",
                        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                    inert={!open}
                >
                    <nav aria-label="Mobile" className="overflow-hidden">
                        <ul className="flex flex-col gap-1 px-3 pb-4">
                            {NAV_LINKS.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={`#${link.id}`}
                                        onClick={(e) => goTo(e, link.id)}
                                        className={cn(
                                            "block rounded-xl px-4 py-3 font-heading text-lg font-bold",
                                            activeId === link.id ? "bg-gold-500/10 text-gold-500" : "text-starlight-100"
                                        )}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <li className="pt-2 sm:hidden">
                                <LoginDialog>
                                    <Button className="h-11 w-full rounded-full bg-gold-500 font-semibold text-space-950 hover:bg-gold-400">
                                        Get Started
                                    </Button>
                                </LoginDialog>
                            </li>
                        </ul>
                    </nav>
                </div>

                <span
                    ref={progressRef}
                    aria-hidden="true"
                    className="nl-hairline absolute inset-x-0 bottom-0 h-px origin-left scale-x-0"
                />
            </div>
        </header>
    );
}
