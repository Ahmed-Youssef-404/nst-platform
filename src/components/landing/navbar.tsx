"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginDialog } from "@/components/login-dialog";

const NAV_LINKS = [
    { id: "about", label: "About Us" },
    { id: "why-us", label: "Why Us" },
    { id: "features", label: "Features" },
    { id: "stats", label: "Statistics" },
    { id: "contact", label: "Contact" },
];

export function Navbar() {
    const [activeId, setActiveId] = useState("");
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const sections = NAV_LINKS.map((l) =>
            document.getElementById(l.id)
        ).filter((el): el is HTMLElement => el !== null);

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);

                if (visible.length > 0) {
                    const top = visible.reduce((a, b) =>
                        a.boundingClientRect.top < b.boundingClientRect.top
                            ? a
                            : b
                    );

                    setActiveId(top.target.id);
                }
            },
            {
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0,
            }
        );

        sections.forEach((el) => observer.observe(el));

        const onScroll = () => setScrolled(window.scrollY > 8);

        window.addEventListener("scroll", onScroll, {
            passive: true,
        });

        onScroll();

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    function scrollTo(id: string) {
        const element = document.getElementById(id);

        if (!element) return;

        // const offset = 90;
        const offset = 10;

        const top =
            element.getBoundingClientRect().top +
            window.pageYOffset -
            offset;

        window.scrollTo({
            top,
            behavior: "smooth",
        });
    }

    return (
        <header className="sticky top-4 z-50 px-4">
            <div
                className={cn(
                    "mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-6 transition-all duration-300 ease-out",
                    scrolled
                        ? "border-border/60 bg-background/60 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl"
                        : "border-transparent bg-background/10 py-4 backdrop-blur-xl"
                )}
            >
                {/* Logo */}

                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="flex items-center gap-3 transition-transform duration-200 hover:scale-[1.02]"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20">
                        N
                    </div>

                    <span className="text-lg font-bold tracking-tight">
                        NST
                    </span>
                </button>

                {/* Desktop Navigation */}

                <nav className="hidden items-center gap-2 rounded-full border border-border/50 bg-muted/40 p-1 backdrop-blur-md md:flex">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => scrollTo(link.id)}
                            className={cn(
                                "relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                                activeId === link.id
                                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            {link.label}

                            {activeId === link.id && (
                                <span className="absolute bottom-1 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-primary" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Right Side */}

                <div className="flex items-center gap-3">
                    {/* <ThemeToggle /> */}

                    <LoginDialog>
                        <Button
                            size="sm"
                            className="rounded-full px-5 shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-105 hover:shadow-primary/40"
                        >
                            Get Started
                        </Button>
                    </LoginDialog>
                </div>
            </div>
        </header>
    );
}