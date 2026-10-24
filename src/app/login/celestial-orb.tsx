"use client";

import { Compass, Sparkles } from "lucide-react";

/**
 * The Atmospheric Visual Celestial Centerpiece for the NST Login Universe.
 * Represents the northern stars, orbital mechanics, and structured learning foundation.
 */
export function CelestialOrb() {
    return (
        <div className="relative flex flex-col justify-between h-full max-w-xl mx-auto lg:mx-0 select-none">
            {/* Top Badge: System Status & Brand Tag */}
            {/* <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-gold-500/10 px-3 py-1 backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                        <span className="nst-beacon-ring absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                    </span>
                    <span className="font-technical text-[11px] font-semibold tracking-[0.2em] text-gold-400 uppercase">
                        NST Core // Gateway Active
                    </span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-technical tracking-wider text-starlight-400">
                    <Sparkles className="size-3 text-gold-400" />
                    <span>SECTOR 01</span>
                </div>
            </div> */}

            {/* Central Cosmic Visual Element */}
            <div className="relative my-8 sm:my-10 flex items-center justify-center">
                {/* Golden Nebula Glow Backdrop */}
                <div className="nst-animate-pulse-glow absolute size-72 sm:size-96 rounded-full bg-radial from-gold-500/20 via-gold-600/5 to-transparent blur-2xl pointer-events-none" />

                {/* Celestial Sphere and Orbit Rings */}
                <div className="relative size-64 sm:size-80 md:size-96 flex items-center justify-center">
                    <svg
                        viewBox="0 0 400 400"
                        className="w-full h-full overflow-visible"
                        aria-hidden="true"
                    >
                        <defs>
                            {/* Planet Atmosphere Gradients */}
                            <radialGradient id="celestial-body" cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#2A2416" />
                                <stop offset="45%" stopColor="#14151F" />
                                <stop offset="85%" stopColor="#08090D" />
                                <stop offset="100%" stopColor="#050507" />
                            </radialGradient>

                            <radialGradient id="atmosphere-glow" cx="28%" cy="25%" r="65%">
                                <stop offset="0%" stopColor="#F6D77A" stopOpacity="0.8" />
                                <stop offset="35%" stopColor="#E8B84A" stopOpacity="0.3" />
                                <stop offset="70%" stopColor="#D5A238" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>

                            <linearGradient id="orbit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F6D77A" stopOpacity="0.8" />
                                <stop offset="50%" stopColor="#E8B84A" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#716E68" stopOpacity="0.05" />
                            </linearGradient>

                            <filter id="celestial-glow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Outer Constellation Grid Lines */}
                        <circle
                            cx="200"
                            cy="200"
                            r="185"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="4 8"
                            className="text-gold-500/20 nst-animate-orbit-reverse"
                        />

                        {/* Primary Orbital Ring */}
                        <g transform="rotate(-24 200 200)">
                            <ellipse
                                cx="200"
                                cy="200"
                                rx="170"
                                ry="68"
                                fill="none"
                                stroke="url(#orbit-gradient)"
                                strokeWidth="1.5"
                                strokeDasharray="6 4"
                            />
                            {/* Traveling Celestial Satellite / Node */}
                            <g>
                                <animateMotion
                                    path="M 30,200 a 170,68 0 1,0 340,0 a 170,68 0 1,0 -340,0"
                                    dur="14s"
                                    repeatCount="indefinite"
                                />
                                <circle r="5" fill="#F6D77A" filter="url(#celestial-glow)" />
                                <circle r="2" fill="#FFFFFF" />
                            </g>
                        </g>

                        {/* Secondary Counter Orbital Ring */}
                        <g transform="rotate(38 200 200)">
                            <ellipse
                                cx="200"
                                cy="200"
                                rx="155"
                                ry="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeDasharray="3 7"
                                className="text-gold-500/30"
                            />
                        </g>

                        {/* Celestial Body Sphere */}
                        <circle
                            cx="200"
                            cy="200"
                            r="88"
                            fill="url(#celestial-body)"
                            stroke="rgba(232, 184, 74, 0.35)"
                            strokeWidth="1.5"
                        />

                        {/* Atmospheric Inner Glow */}
                        <circle
                            cx="200"
                            cy="200"
                            r="87"
                            fill="url(#atmosphere-glow)"
                            style={{ mixBlendMode: "screen" }}
                        />

                        {/* Latitude / Longitude Geometric Curvatures */}
                        <path
                            d="M 120 200 A 80 80 0 0 1 280 200"
                            fill="none"
                            stroke="rgba(232, 184, 74, 0.18)"
                            strokeWidth="1"
                        />
                        <path
                            d="M 132 165 A 88 50 0 0 1 268 165"
                            fill="none"
                            stroke="rgba(232, 184, 74, 0.12)"
                            strokeWidth="1"
                        />
                        <path
                            d="M 132 235 A 88 50 0 0 0 268 235"
                            fill="none"
                            stroke="rgba(232, 184, 74, 0.12)"
                            strokeWidth="1"
                        />
                        <ellipse
                            cx="200"
                            cy="200"
                            rx="38"
                            ry="88"
                            fill="none"
                            stroke="rgba(232, 184, 74, 0.15)"
                            strokeWidth="1"
                        />

                        {/* Northern Star Apex Focal Node */}
                        <g transform="translate(200, 112)">
                            {/* Star Glow Rays */}
                            <line x1="-12" y1="0" x2="12" y2="0" stroke="#F6D77A" strokeWidth="1.5" />
                            <line x1="0" y1="-12" x2="0" y2="12" stroke="#F6D77A" strokeWidth="1.5" />
                            <circle r="4" fill="#F6D77A" filter="url(#celestial-glow)" />
                            <circle r="1.5" fill="#FFFFFF" />
                        </g>

                        {/* Constellation Nodes & Connecting Rays */}
                        <g className="text-gold-400">
                            {/* Node 1: Foundations */}
                            <circle cx="95" cy="140" r="3.5" fill="#E8B84A" />
                            <circle cx="95" cy="140" r="8" fill="none" stroke="rgba(232, 184, 74, 0.3)" />

                            {/* Node 2: Challenges */}
                            <circle cx="310" cy="160" r="3" fill="#E8B84A" />

                            {/* Node 3: Mastery */}
                            <circle cx="280" cy="275" r="3.5" fill="#E8B84A" />

                            {/* Subtle Constellation Lines */}
                            <polyline
                                points="95,140 200,112 310,160 280,275"
                                fill="none"
                                stroke="rgba(232, 184, 74, 0.2)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        </g>
                    </svg>

                    {/* Central Brand Monogram Inlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-heading text-3xl sm:text-4xl font-extrabold tracking-widest nst-gold-gradient drop-shadow-[0_0_16px_rgba(232,184,74,0.4)]">
                            NST
                        </span>
                        <span className="font-technical text-[9px] tracking-[0.3em] text-starlight-300 uppercase mt-0.5">
                            UNIVERSE
                        </span>
                    </div>
                </div>
            </div>

            {/* Brand Statement & Guiding Mindset */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-starlight-100 leading-snug">
                        We Build the Mindset of a <span className="nst-gold-gradient">Programmer</span>.
                    </h1>
                    <p className="text-sm sm:text-base text-starlight-300 leading-relaxed max-w-lg">
                        Every great software engineer begins with the right foundation. Enter the portal, solve structured challenges, and navigate your trajectory from beginner to engineer.
                    </p>
                </div>

                {/* Telemetry Directive Card */}
                <div className="flex items-center gap-3.5 rounded-xl border border-gold-500/20 bg-space-900/60 p-3.5 backdrop-blur-md shadow-xs">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/25">
                        <Compass className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[11px] font-technical tracking-wider text-starlight-400 mb-0.5">
                            <span>CORE DIRECTIVE</span>
                            <span className="text-gold-400/80">31.20° N, 29.91° E</span>
                        </div>
                        <p className="font-medium text-xs sm:text-sm text-starlight-100 truncate">
                            &ldquo;Direction first. Code follows.&rdquo;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
