// src/components/instructor/instructor-navbar-clock.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

export function InstructorNavbarClock() {
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setMounted(true);
        setNow(new Date());
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted || !now) {
        return (
            <div className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-space-950/60 px-3 py-1.5 border border-border/60 text-xs font-mono text-starlight-400">
                <Clock className="size-3.5 text-gold-400 animate-pulse" />
                <span className="opacity-60">--:--:--</span>
            </div>
        );
    }

    const dateStr = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    return (
        <div className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-space-950/70 px-3 py-1 border border-border/70 text-xs font-mono shadow-xs backdrop-blur-xs select-none">
            <div className="flex items-center gap-1.5 text-starlight-300 hidden md:flex">
                <Calendar className="size-3.5 text-gold-400" />
                <span>{dateStr}</span>
            </div>
            <span className="text-border hidden md:inline">|</span>
            <div className="flex items-center gap-1.5 font-bold text-gold-300 tracking-wide">
                <Clock className="size-3.5 text-gold-400" />
                <span>{timeStr}</span>
            </div>
        </div>
    );
}
