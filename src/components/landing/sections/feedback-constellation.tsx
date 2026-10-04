"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import { FEEDBACK_COPY, FEEDBACK_ITEMS } from "../data/landing-content";
import { useInView } from "../hooks/use-in-view";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { SectionHeading } from "../primitives/section-heading";

const AUTO_ADVANCE_MS = 5500;

/**
 * Student feedback as a draggable row of stars. The star nearest the centre
 * grows and brightens; the rest recede. Drag, swipe, use the arrows or let it
 * advance on its own (it pauses on hover/focus/drag and for reduced motion).
 */
export function FeedbackConstellation() {
    const scroller = useRef<HTMLUListElement>(null);
    const items = useRef<(HTMLLIElement | null)[]>([]);
    const [active, setActive] = useState(0);
    const interacting = useRef(false);
    const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });
    const reduced = useReducedMotion();
    const { ref: viewRef, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

    // Emphasis follows the scroll position: scale/opacity per item from its distance to the centre.
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const center = el.scrollLeft + el.clientWidth / 2;
            let nearest = 0;
            let nearestDistance = Infinity;
            items.current.forEach((item, i) => {
                if (!item) return;
                const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
                const t = Math.min(1, distance / (el.clientWidth * 0.6));
                item.style.setProperty("--focus", (1 - t).toFixed(3));
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = i;
                }
            });
            setActive((current) => (current === nearest ? current : nearest));
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        el.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            el.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    const goTo = useCallback((index: number) => {
        const el = scroller.current;
        const item = items.current[(index + FEEDBACK_ITEMS.length) % FEEDBACK_ITEMS.length];
        if (!el || !item) return;
        el.scrollTo({
            left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2,
            behavior: reduced ? "auto" : "smooth",
        });
    }, [reduced]);

    useEffect(() => {
        if (!inView || reduced) return;
        const timer = setInterval(() => {
            if (!interacting.current) goTo(active + 1);
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(timer);
    }, [inView, reduced, active, goTo]);

    const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
        if (event.pointerType !== "mouse") return; // touch already swipes natively
        const el = scroller.current;
        if (!el) return;
        drag.current = { down: true, startX: event.clientX, startScroll: el.scrollLeft, moved: false };
        interacting.current = true;
        el.style.scrollSnapType = "none";
        el.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
        const el = scroller.current;
        if (!el || !drag.current.down) return;
        const dx = event.clientX - drag.current.startX;
        if (Math.abs(dx) > 4) drag.current.moved = true;
        el.scrollLeft = drag.current.startScroll - dx;
    };
    const endDrag = () => {
        const el = scroller.current;
        if (!el || !drag.current.down) return;
        drag.current.down = false;
        el.style.scrollSnapType = "";
        goTo(active);
    };

    return (
        <section className="relative py-24 sm:py-32" aria-label="Student feedback">
            <div className="mx-auto max-w-6xl px-6">
                <Reveal>
                    <SectionHeading kicker={FEEDBACK_COPY.kicker} title={FEEDBACK_COPY.headline} />
                </Reveal>
            </div>

            <div
                ref={viewRef}
                className="relative mt-14"
                onPointerEnter={() => (interacting.current = true)}
                onPointerLeave={() => (interacting.current = false)}
                onFocusCapture={() => (interacting.current = true)}
                onBlurCapture={() => (interacting.current = false)}
            >
                {/* The constellation line the stars sit on */}
                <div className="nl-hairline pointer-events-none absolute inset-x-0 top-[3.25rem] h-px opacity-60" aria-hidden="true" />

                <ul
                    ref={scroller}
                    tabIndex={0}
                    aria-label="Feedback from previous students"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowRight") goTo(active + 1);
                        if (event.key === "ArrowLeft") goTo(active - 1);
                    }}
                    className="nl-no-scrollbar flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1.5rem,calc(50%-14rem))] pb-4 outline-none select-none active:cursor-grabbing sm:gap-10"
                >
                    {FEEDBACK_ITEMS.map((item, i) => (
                        <li
                            key={item.id}
                            ref={(node) => {
                                items.current[i] = node;
                            }}
                            className="w-[min(82vw,28rem)] shrink-0 snap-center"
                            style={{
                                opacity: "calc(0.3 + var(--focus, 0.5) * 0.7)",
                                transform: "scale(calc(0.88 + var(--focus, 0.5) * 0.12))",
                                transition: "opacity 150ms linear, transform 150ms linear",
                            }}
                        >
                            <div className="flex justify-center">
                                <span
                                    className="flex size-9 items-center justify-center rounded-full bg-space-900 ring-1 ring-[color:var(--border-gold-subtle)]"
                                    style={{ boxShadow: "0 0 calc(var(--focus, 0) * 28px) rgb(var(--nl-gold-rgb) / 0.7)" }}
                                >
                                    <Star className="size-4 fill-gold-500 text-gold-500" aria-hidden="true" />
                                </span>
                            </div>
                            <figure className="mt-8 text-center">
                                <blockquote className="font-heading text-xl leading-snug font-bold text-balance text-starlight-100 sm:text-2xl">
                                    {item.quote}
                                </blockquote>
                                <figcaption className="mt-5 font-technical text-xs tracking-[0.18em] text-starlight-400 uppercase">
                                    {item.author} · {item.context}
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>

                <div className="mt-8 flex items-center justify-center gap-4">
                    <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous feedback"
                        className="flex size-10 items-center justify-center rounded-full border border-[color:var(--border-default)] text-starlight-200 transition-colors hover:border-gold-500 hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:outline-none">
                        <ChevronLeft className="size-5" />
                    </button>
                    <div className="flex gap-2" aria-hidden="true">
                        {FEEDBACK_ITEMS.map((item, i) => (
                            <span key={item.id} className={cn("h-1.5 rounded-full transition-all duration-300", i === active ? "w-6 bg-gold-500" : "w-1.5 bg-starlight-400/50")} />
                        ))}
                    </div>
                    <button type="button" onClick={() => goTo(active + 1)} aria-label="Next feedback"
                        className="flex size-10 items-center justify-center rounded-full border border-[color:var(--border-default)] text-starlight-200 transition-colors hover:border-gold-500 hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:outline-none">
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
