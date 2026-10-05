"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  Radio,
  Sparkles,
  Satellite,
  X,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import StarsBackground from "@/components/StarsBackground";
import { Celestial404Hero } from "./celestial-404-hero";
import { NetworkTopology } from "./network-topology";
import { TelemetryConsole } from "./telemetry-console";

export function NotFoundView() {
  const router = useRouter();
  const rawPathname = usePathname();
  const currentPath =
    rawPathname && rawPathname !== "/"
      ? rawPathname
      : typeof window !== "undefined" && window.location.pathname
        ? window.location.pathname
        : "/unknown-route";
  const [isRadarActive, setIsRadarActive] = useState(false);
  const [easterEggOpen, setEasterEggOpen] = useState(false);

  // Trigger cosmic radar ping
  const triggerRadar = useCallback(() => {
    setIsRadarActive(true);
    const timer = setTimeout(() => {
      setIsRadarActive(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "h" || e.key === "H") {
        router.push("/");
      } else if (e.key === "b" || e.key === "B") {
        if (typeof window !== "undefined" && window.history.length > 1) {
          window.history.back();
        } else {
          router.push("/");
        }
      } else if (e.key === "r" || e.key === "R") {
        triggerRadar();
      } else if (e.key === "Escape") {
        setEasterEggOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, triggerRadar]);

  return (
    <div className="nst-404 relative flex min-h-screen flex-col overflow-x-hidden bg-[color:var(--space-950)] text-foreground selection:bg-gold-500/30 selection:text-gold-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. ATMOSPHERIC BACKDROP LAYERS                                */}
      {/* ------------------------------------------------------------- */}
      {/* Dynamic Starfield Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85 dark:opacity-100">
        <StarsBackground />
      </div>

      {/* Coordinate Grid Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none nf-grid-pattern opacity-40 dark:opacity-30" />

      {/* Deep Space Ambient Nebulas */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 25%, rgba(232, 184, 74, 0.08), transparent 70%), radial-gradient(50% 50% at 85% 75%, rgba(121, 191, 255, 0.05), transparent 60%), radial-gradient(40% 40% at 15% 85%, rgba(169, 139, 255, 0.04), transparent 60%)",
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. FLOATING NAVIGATION BAR                                     */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-20 w-full px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--space-950)]/75 px-4 py-2.5 shadow-[var(--shadow-2)] backdrop-blur-xl transition-all">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label="NST Platform Home"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-gold-500 font-technical text-sm font-bold text-space-950 shadow-[var(--shadow-gold)] transition-transform hover:scale-105">
              N
            </span>
            <div className="flex flex-col">
              <span className="font-heading text-base font-extrabold tracking-tight text-starlight-100">
                NST
              </span>
            </div>
          </Link>

          {/* Central Telemetry Breadcrumb Pill */}
          <div className="hidden items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--space-900)]/80 px-3.5 py-1 font-mono text-[11px] text-starlight-300 md:flex">
            <span className="size-2 rounded-full bg-error animate-ping" />
            <span className="font-semibold text-starlight-200">SECTOR_00</span>
            <span className="text-starlight-400">/</span>
            <span className="text-error font-medium">ERR_ROUTE_DRIFT</span>
          </div>

          {/* Controls: ThemeToggle + Home CTA */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button
              size="sm"
              className="h-8 rounded-full bg-gold-500 px-4 font-semibold text-space-950 hover:bg-gold-400 shadow-[var(--shadow-gold)] transition-all"
              onClick={() => router.push("/")}
            >
              <Compass className="mr-1.5 size-3.5" />
              <span>Base Station</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN HERO CONTENT                                          */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          {/* Top Status Capsule */}
          {/* <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1 text-xs font-mono text-gold-400 shadow-[var(--shadow-gold)]">
              <Sparkles className="size-3.5 text-gold-400" />
              <span>{"// COSMIC_NAVIGATION_ANOMALY_404"}</span>
            </div>
          </div> */}

          {/* The Hero Visual: Celestial 404 Centerpiece */}
          <div className="mt-4 sm:mt-6">
            <Celestial404Hero
              isRadarActive={isRadarActive}
              onProbeClick={() => setEasterEggOpen(true)}
            />
          </div>

          {/* Main Headline & Narrative Copy */}
          <div className="mx-auto mt-6 max-w-2xl text-center sm:mt-8">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-starlight-100 sm:text-5xl lg:text-6xl">
              This route drifted into{" "}
              <span className="nl-gold-text">uncharted space.</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-starlight-300 sm:text-base">
              The coordinates you requested couldn&apos;t be resolved in the NST star chart.
              The signal packet may have timed out or decayed along an unmapped celestial vector.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-11 rounded-full bg-gold-500 px-6 font-semibold text-space-950 hover:bg-gold-400 shadow-[var(--shadow-gold-strong)] transition-all hover:scale-[1.02]"
                onClick={() => router.push("/")}
              >
                <Compass className="mr-2 size-4" />
                Return to Home Base
                <span className="ml-2 rounded bg-space-950/20 px-1.5 py-0.5 font-mono text-[10px] text-space-950/80">
                  H
                </span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-[color:var(--border-default)] bg-[color:var(--space-900)]/80 px-5 text-starlight-100 hover:border-gold-500/50 hover:bg-[color:var(--space-850)] transition-all"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    window.history.back();
                  } else {
                    router.push("/");
                  }
                }}
              >
                <ArrowLeft className="mr-2 size-4 text-starlight-300" />
                Previous Orbit
                <span className="ml-2 rounded border border-[color:var(--border-subtle)] bg-[color:var(--space-800)]/60 px-1.5 py-0.5 font-mono text-[10px] text-starlight-400">
                  B
                </span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-11 rounded-full border-[color:var(--border-default)] bg-[color:var(--space-900)]/80 px-5 transition-all",
                  isRadarActive
                    ? "border-gold-500 bg-gold-500/15 text-gold-400 shadow-[0_0_16px_rgba(232,184,74,0.3)]"
                    : "text-starlight-200 hover:border-gold-500/50 hover:text-gold-400"
                )}
                onClick={triggerRadar}
                disabled={isRadarActive}
              >
                <Radio
                  className={cn(
                    "mr-2 size-4",
                    isRadarActive && "animate-spin text-gold-400"
                  )}
                />
                {isRadarActive ? "Scanning Sector..." : "Recalculate Route"}
                <span className="ml-2 rounded border border-[color:var(--border-subtle)] bg-[color:var(--space-800)]/60 px-1.5 py-0.5 font-mono text-[10px] text-starlight-400">
                  R
                </span>
              </Button>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* 4. TECHNICAL RECON & NETWORK ROUTE INSPECTION                */}
          {/* ----------------------------------------------------------- */}
          <div className="mt-12 grid gap-6 lg:grid-cols-2 sm:mt-16">
            {/* Left: Network Route Topology */}
            <div className="space-y-2">
              <NetworkTopology currentPath={currentPath} />
            </div>

            {/* Right: Telemetry Console & Radar Output */}
            <div className="space-y-2">
              <TelemetryConsole
                currentPath={currentPath}
                isRadarActive={isRadarActive}
                onTriggerRadar={triggerRadar}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 5. MINIMALIST HUD FOOTER                                      */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-20 mt-auto border-t border-[color:var(--border-subtle)] bg-[color:var(--space-950)]/85 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-starlight-400">
          {/* Telemetry Status Ticker */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive animate-pulse" />
              STATUS: <strong className="text-destructive font-semibold">404 NOT_FOUND</strong>
            </span>
            <span className="hidden sm:inline text-starlight-400/50">•</span>
            <span className="hidden sm:inline">
              SIGNAL: <strong className="text-starlight-300">0 dB (LOST)</strong>
            </span>
            <span className="hidden md:inline text-starlight-400/50">•</span>
            <span className="hidden md:inline">
              PROTOCOL: <strong className="text-starlight-300">NST/3.0-QUIC</strong>
            </span>
          </div>

          {/* Keyboard Shortcuts Hint & Voyager Easter Egg */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEasterEggOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10.5px] text-gold-400 transition-colors hover:border-gold-500/60 hover:bg-gold-500/20"
            >
              <Satellite className="size-3" />
              <span>VOYAGER_BEACON: ONLINE</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 text-[10px] text-starlight-400">
              <Keyboard className="size-3" />
              <span>Shortcuts: [H] Home • [B] Back • [R] Radar</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 6. EASTER EGG TRANSMISSION MODAL                               */}
      {/* ------------------------------------------------------------- */}
      {easterEggOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="easter-egg-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-gold-500/40 bg-[color:var(--space-900)] p-6 shadow-[var(--shadow-gold-strong)]">
            <button
              type="button"
              onClick={() => setEasterEggOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-starlight-400 hover:bg-muted hover:text-starlight-100"
              aria-label="Close transmission"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gold-500/20 text-gold-400">
                <Satellite className="size-5" />
              </div>
              <div>
                <h3 id="easter-egg-title" className="font-heading font-bold text-starlight-100">
                  Incoming Deep-Space Transmission
                </h3>
                <p className="font-mono text-[10.5px] text-gold-400">
                  ORIGIN: NST_VOYAGER_PROBE // 0x4E5354
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--space-950)]/70 p-4 font-mono text-xs leading-relaxed text-starlight-200">
              <p className="text-gold-300 font-semibold mb-2">
                &ldquo;Even the brightest stars sometimes drift beyond charted space.&rdquo;
              </p>
              <p className="text-starlight-300">
                You haven&apos;t failed; you just discovered an unmapped coordinate in the NST universe.
                Every great programmer learns as much from the 404s as from the 200s.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                size="sm"
                className="rounded-full bg-gold-500 px-4 font-semibold text-space-950 hover:bg-gold-400"
                onClick={() => setEasterEggOpen(false)}
              >
                Acknowledge & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
