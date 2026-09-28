// src/components/route-progress-bar.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Whenever pathname or searchParams change, navigation finished
    useEffect(() => {
        if (loading) {
            setProgress(100);
            const timer = setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [pathname, searchParams]);

    // Intercept clicks on internal links to trigger instant 0ms feedback
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Find closest <a> tag
            const target = (e.target as HTMLElement).closest("a");
            if (!target) return;

            const href = target.getAttribute("href");
            if (!href) return;

            // Ignore external links, downloads, hash links, new tabs
            if (
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("#") ||
                target.getAttribute("target") === "_blank" ||
                target.hasAttribute("download") ||
                e.metaKey ||
                e.ctrlKey ||
                e.shiftKey ||
                e.altKey ||
                e.button !== 0
            ) {
                return;
            }

            // Check if navigating to a different pathname
            const currentUrl = window.location.pathname + window.location.search;
            if (href === currentUrl || href === window.location.pathname) {
                return;
            }

            // Start instant progress
            setLoading(true);
            setProgress(30);

            // Progressive increments while waiting for server response
            const t1 = setTimeout(() => setProgress(65), 150);
            const t2 = setTimeout(() => setProgress(85), 500);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        };

        document.addEventListener("click", handleClick, { capture: true });
        return () => {
            document.removeEventListener("click", handleClick, { capture: true });
        };
    }, []);

    if (!loading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent overflow-hidden"
            aria-hidden="true"
        >
            <div
                className="h-full bg-gradient-to-r from-gold-500 via-amber-400 to-gold-300 shadow-[0_0_12px_rgba(232,184,74,0.6)] transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: progress === 100 ? 0 : 1,
                    transitionProperty: "width, opacity",
                }}
            />
        </div>
    );
}
