// src/app/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import "./login.css";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { LoginScene } from "./login-scene";
import { CelestialOrb } from "./celestial-orb";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Enter Your Universe | NST Platform",
    description:
        "Sign in to NST Platform. Build the mindset of a programmer with structured roadmaps, hands-on challenges, and guided mentorship.",
};

export default async function LoginPage() {
    // If the visitor already has an active session, forward them straight to their dashboard
    const user = await getCurrentUser();
    if (user?.role === "student") redirect("/student");
    if (user?.role === "instructor") redirect("/instructor");
    if (user?.role === "super_admin") redirect("/super-admin");

    return (
        <div className="nst-login relative flex min-h-screen flex-col justify-between overflow-x-hidden selection:bg-gold-500/25 selection:text-gold-300">
            {/* Ambient Cosmic Background & Parallax Starfield */}
            <LoginScene />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    {/* Return to Home Brand Link */}
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 rounded-full py-1.5 px-3 -ml-3 transition-colors hover:bg-space-850/50 outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        aria-label="Return to NST Homepage"
                    >
                        <ArrowLeft className="size-4 text-starlight-400 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-gold-400" />
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-gold-500 font-technical text-xs font-bold text-space-950 shadow-[var(--shadow-gold)]">
                                N
                            </span>
                            <span className="font-heading text-sm font-bold tracking-tight text-starlight-100 group-hover:text-gold-400 transition-colors">
                                NST Platform
                            </span>
                        </div>
                    </Link>

                    {/* Right Tools: Coordinate badge & Theme toggle */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden sm:inline-block font-technical text-[10px] tracking-widest text-starlight-400 uppercase">
                            ST-UNIVERSE // SEC-01
                        </span>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Stage: Two-part Composition */}
            <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 sm:px-6 lg:px-10 py-6 sm:py-10 !pt-0">
                <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
                    {/* Left: Celestial Visual Artwork & Brand Manifesto */}
                    <div className="nst-entrance-1 lg:col-span-7 xl:col-span-7">
                        <CelestialOrb />
                    </div>

                    {/* Right: Glassmorphic Authentication Panel */}
                    <div className="nst-entrance-2 lg:col-span-5 xl:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
                        <LoginForm />
                    </div>
                </div>
            </main>

            {/* Subtle Cosmic Footer */}
            <footer className="relative z-20 w-full px-4 sm:px-6 lg:px-10 py-4 border-t border-[color:var(--border-subtle)] bg-space-950/40 backdrop-blur-xs">
                <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 text-xs text-starlight-400">
                    <p className="text-center sm:text-left">
                        &copy; {new Date().getFullYear()} Northern Stars Team. Built for the programmers of tomorrow.
                    </p>
                    <p className="font-technical text-[11px] tracking-wider text-starlight-400/90 text-center sm:text-right">
                        DIRECTION FIRST. CODE FOLLOWS.
                    </p>
                </div>
            </footer>
        </div>
    );
}