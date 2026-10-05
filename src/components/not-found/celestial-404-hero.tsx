"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface Celestial404HeroProps {
  isRadarActive?: boolean;
  onProbeClick?: () => void;
  className?: string;
}

/**
 * Celestial404Hero
 * The centerpiece visual of the NST 404 experience:
 * A high-precision vector composition marrying space navigation with networking topology.
 *
 * - Left "4": Origin Relay Gateway with active transmitter beacon.
 * - Center "0": A deep-space gravitational anomaly / black hole singularity
 *   with rotating accretion rings, drifting research probe, and packet decay.
 * - Right "4": Terminated node with fragmented circuit traces and 404 lost signal.
 * - Coordinate grid reticle, quadrant markers, and dynamic radar sweep when activated.
 */
export function Celestial404Hero({
  isRadarActive = false,
  onProbeClick,
  className,
}: Celestial404HeroProps) {
  const [probeHovered, setProbeHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl select-none px-2 sm:px-4",
        className
      )}
      aria-label="Celestial 404 Navigation Anomaly Visual"
      role="img"
    >
      <svg
        viewBox="0 0 920 380"
        className="w-full h-auto overflow-visible filter drop-shadow-[0_12px_36px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_16px_48px_rgba(232,184,74,0.12)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Luminous Gradients */}
          <linearGradient id="gold-grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-gold-300, #F6D77A)" />
            <stop offset="50%" stopColor="var(--color-gold-500, #E8B84A)" />
            <stop offset="100%" stopColor="var(--color-gold-700, #B98227)" />
          </linearGradient>

          <linearGradient id="gold-grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-gold-400, #F2C866)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-gold-600, #D5A238)" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="starlight-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-starlight-100, #F7F4ED)" />
            <stop offset="100%" stopColor="var(--color-starlight-300, #AAA69D)" />
          </linearGradient>

          <linearGradient id="danger-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-error-400, #FF8585)" />
            <stop offset="100%" stopColor="var(--color-error-600, #AD3E3E)" />
          </linearGradient>

          {/* Accretion Radial Glows */}
          <radialGradient id="singularity-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#050507" stopOpacity="1" />
            <stop offset="55%" stopColor="var(--color-space-950, #08090D)" stopOpacity="0.95" />
            <stop offset="78%" stopColor="var(--color-gold-500, #E8B84A)" stopOpacity="0.45" />
            <stop offset="92%" stopColor="var(--color-gold-400, #F2C866)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="event-horizon-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-gold-400, #F2C866)" stopOpacity="0.6" />
            <stop offset="40%" stopColor="var(--color-gold-600, #D5A238)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-gold-400, #F2C866)" stopOpacity="0.35" />
            <stop offset="60%" stopColor="var(--color-gold-500, #E8B84A)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* SVG Glow Filter */}
          <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="subtle-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 1: ASTRONOMICAL COORDINATE GRID & RETICLES              */}
        {/* ------------------------------------------------------------- */}
        <g opacity="0.35" className="dark:opacity-40">
          {/* Main Axis Lines */}
          <line
            x1="80"
            y1="190"
            x2="840"
            y2="190"
            stroke="var(--color-border-subtle)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <line
            x1="460"
            y1="20"
            x2="460"
            y2="360"
            stroke="var(--color-border-subtle)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />

          {/* Concentric Range Rings centered at (460, 190) */}
          <circle
            cx="460"
            cy="190"
            r="110"
            stroke="var(--color-border-subtle)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />
          <circle
            cx="460"
            cy="190"
            r="165"
            stroke="var(--color-border-subtle)"
            strokeWidth="0.75"
            strokeDasharray="3 6"
          />
          <circle
            cx="460"
            cy="190"
            r="220"
            stroke="var(--color-border-subtle)"
            strokeWidth="0.5"
            strokeDasharray="2 8"
          />

          {/* Reticle Tick Marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 460 + Math.cos(rad) * 160;
            const y1 = 190 + Math.sin(rad) * 160;
            const x2 = 460 + Math.cos(rad) * 170;
            const y2 = 190 + Math.sin(rad) * 170;
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-border-subtle)"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Technical Telemetry Markers */}
          <text
            x="465"
            y="35"
            fill="var(--color-starlight-400)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.15em"
          >
            {"N 00°00'00\" [SECTOR-00]"}
          </text>
          <text
            x="465"
            y="352"
            fill="var(--color-starlight-400)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.15em"
          >
            {"S 180°00'00\" [DEEP_VOID]"}
          </text>
          <text
            x="88"
            y="184"
            fill="var(--color-starlight-400)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.12em"
          >
            AZ 270° [GATEWAY]
          </text>
          <text
            x="765"
            y="184"
            fill="var(--color-starlight-400)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.12em"
          >
            AZ 090° [UNREACHABLE]
          </text>
        </g>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 2: RADAR SWEEP EFFECT (ACTIVATED ON DEMAND)             */}
        {/* ------------------------------------------------------------- */}
        {isRadarActive && (
          <g className="transition-opacity duration-500">
            {/* Sonar Expanding Waves */}
            <circle
              cx="460"
              cy="190"
              r="70"
              className="nf-ripple-active"
              fill="none"
              stroke="var(--color-gold-400)"
              strokeWidth="2"
            />
            <circle
              cx="460"
              cy="190"
              r="70"
              className="nf-ripple-active"
              style={{ animationDelay: "1.2s" }}
              fill="none"
              stroke="var(--color-gold-500)"
              strokeWidth="1.5"
            />

            {/* Rotating Radar Cone */}
            <g className="nf-radar-active">
              <path
                d="M 460 190 L 660 190 A 200 200 0 0 0 601 49 Z"
                fill="url(#radar-gradient)"
              />
              <line
                x1="460"
                y1="190"
                x2="660"
                y2="190"
                stroke="var(--color-gold-400)"
                strokeWidth="1.8"
                filter="url(#soft-glow)"
              />
            </g>
          </g>
        )}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 3: CONSTELLATION CONNECTION LINES & DATA VECTORS         */}
        {/* ------------------------------------------------------------- */}
        <g>
          {/* Main transmission curve: Left Node -> Singularity Center */}
          <path
            d="M 230 190 C 290 190, 350 160, 420 180"
            stroke="var(--color-gold-500)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            fill="none"
          />
          {/* Data packet flowing towards the anomaly */}
          <path
            d="M 230 190 C 290 190, 350 160, 420 180"
            stroke="var(--color-gold-300)"
            strokeWidth="2.5"
            strokeDasharray="8 24"
            className="nf-dash-flow"
            fill="none"
            filter="url(#soft-glow)"
          />

          {/* Severed / Broken connection curve: Singularity -> Right 4 */}
          <path
            d="M 500 200 C 560 215, 620 190, 680 190"
            stroke="var(--color-error-500)"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="4 8"
            fill="none"
          />
          {/* Dying packet fragments */}
          <path
            d="M 500 200 C 530 207, 560 210, 580 205"
            stroke="var(--color-error-400)"
            strokeWidth="2"
            strokeDasharray="4 14"
            className="nf-dash-flow-fast nf-broken-glitch"
            fill="none"
          />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 4: THE FIRST "4" (ORIGIN RELAY GATEWAY)                 */}
        {/* ------------------------------------------------------------- */}
        <g id="origin-relay-4" className="transition-all duration-300">
          {/* Subtle Outer Silhouette / Backdrop */}
          <path
            d="M 250 85 L 140 250 L 250 250 Z M 250 250 L 250 295 M 250 220 L 290 220"
            stroke="var(--color-gold-500)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.08"
            fill="none"
          />

          {/* Primary High-Precision Glyph */}
          {/* Diagonal Stem */}
          <path
            d="M 245 95 L 145 240 L 285 240"
            stroke="url(#gold-grad-core)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Vertical Downward Leg */}
          <path
            d="M 245 95 L 245 285"
            stroke="url(#gold-grad-core)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Inner Accent Hairline */}
          <path
            d="M 245 110 L 160 235 L 275 235"
            stroke="var(--color-starlight-100)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            fill="none"
          />

          {/* Origin Gateway Node Badge */}
          <g transform="translate(145, 240)">
            <circle
              r="12"
              fill="var(--color-space-950)"
              stroke="var(--color-gold-500)"
              strokeWidth="2"
            />
            <circle
              r="6"
              fill="var(--color-gold-400)"
              className="animate-pulse"
            />
            {/* Beacon Ripple */}
            <circle
              r="18"
              fill="none"
              stroke="var(--color-gold-400)"
              strokeWidth="1"
              strokeOpacity="0.5"
              className="nf-ripple-active"
            />
          </g>

          {/* Relay Metadata Labels */}
          <g transform="translate(110, 275)">
            <text
              fill="var(--color-gold-400)"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              NODE: ORIGIN_GATEWAY
            </text>
            <text
              y="14"
              fill="var(--color-starlight-300)"
              fontSize="8.5"
              fontFamily="var(--font-mono)"
              letterSpacing="0.05em"
            >
              TX: 200_OK // SYNCED
            </text>
          </g>
        </g>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 5: THE CENTER "0" (CELESTIAL ANOMALY & ORBITS)          */}
        {/* ------------------------------------------------------------- */}
        <g id="singularity-0" transform="translate(460, 190)">
          {/* Ambient Accretion Glow */}
          <circle
            r="105"
            fill="url(#event-horizon-halo)"
            className="nf-glow-breathe"
          />

          {/* Primary Orbital Ellipse (Tilted Clockwise) */}
          <g transform="rotate(-28)">
            <ellipse
              rx="115"
              ry="42"
              stroke="var(--color-gold-500)"
              strokeWidth="1.5"
              strokeOpacity="0.45"
              fill="none"
            />
            <ellipse
              rx="115"
              ry="42"
              stroke="var(--color-gold-300)"
              strokeWidth="2"
              strokeDasharray="14 36"
              className="nf-dash-flow nf-spin-orbit"
              fill="none"
              filter="url(#soft-glow)"
            />
          </g>

          {/* Counter Orbital Ellipse (Tilted Counter-Clockwise) */}
          <g transform="rotate(38)">
            <ellipse
              rx="98"
              ry="34"
              stroke="var(--color-starlight-300)"
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="4 8"
              fill="none"
            />
            <ellipse
              rx="98"
              ry="34"
              stroke="var(--color-gold-400)"
              strokeWidth="1.8"
              strokeDasharray="18 42"
              className="nf-dash-flow-fast nf-spin-orbit-reverse"
              fill="none"
            />
          </g>

          {/* Anomaly Core / Event Horizon Sphere */}
          <circle
            r="62"
            fill="url(#singularity-glow)"
            stroke="var(--color-gold-500)"
            strokeWidth="2.5"
            strokeOpacity="0.8"
            className="shadow-[0_0_24px_rgba(232,184,74,0.3)]"
          />

          {/* Concentric Singularity Reticle */}
          <circle
            r="44"
            fill="none"
            stroke="var(--color-gold-400)"
            strokeWidth="0.8"
            strokeOpacity="0.4"
            strokeDasharray="3 5"
          />
          <circle
            r="26"
            fill="none"
            stroke="var(--color-starlight-100)"
            strokeWidth="0.75"
            strokeOpacity="0.5"
          />
          <circle
            r="6"
            fill="var(--color-gold-400)"
            className="animate-ping"
            opacity="0.75"
          />
          <circle
            r="3"
            fill="var(--color-starlight-100)"
          />

          {/* Little Orbiting Research Probe (Interactive Easter Egg) */}
          <g
            className="cursor-pointer nf-probe-float transition-transform duration-300"
            onClick={onProbeClick}
            onMouseEnter={() => setProbeHovered(true)}
            onMouseLeave={() => setProbeHovered(false)}
            transform="translate(86, -42)"
          >
            {/* Probe Solar Wings */}
            <rect
              x="-14"
              y="-3"
              width="28"
              height="6"
              rx="1.5"
              fill="var(--color-space-850)"
              stroke="var(--color-gold-400)"
              strokeWidth="1"
            />
            {/* Probe Core Body */}
            <circle
              r="4.5"
              fill="var(--color-gold-500)"
            />
            {/* Communication Antenna */}
            <line
              x1="0"
              y1="-4"
              x2="0"
              y2="-9"
              stroke="var(--color-starlight-100)"
              strokeWidth="1"
            />
            <circle
              cx="0"
              cy="-9"
              r="1.5"
              fill="var(--color-error-400)"
              className="animate-pulse"
            />

            {/* Probe Hover Tooltip Hint */}
            {probeHovered && (
              <g transform="translate(18, -12)">
                <rect
                  x="0"
                  y="-14"
                  width="112"
                  height="22"
                  rx="4"
                  fill="var(--color-space-900)"
                  stroke="var(--color-gold-400)"
                  strokeWidth="1"
                />
                <text
                  x="8"
                  y="1"
                  fill="var(--color-gold-300)"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                >
                  📡 NST-VOYAGER: PING
                </text>
              </g>
            )}
          </g>

          {/* Core Labels */}
          <text
            y="78"
            textAnchor="middle"
            fill="var(--color-gold-400)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.16em"
          >
            GRAVITATIONAL_NULL_VOID
          </text>
          <text
            y="91"
            textAnchor="middle"
            fill="var(--color-starlight-400)"
            fontSize="8"
            fontFamily="var(--font-mono)"
            letterSpacing="0.1em"
          >
            COORD: 0x00_UNDEFINED
          </text>
        </g>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 6: THE SECOND "4" (SEVERED DESTINATION NODE)            */}
        {/* ------------------------------------------------------------- */}
        <g id="destination-terminal-4" className="nf-broken-glitch">
          {/* Subtle Outer Silhouette / Backdrop */}
          <path
            d="M 775 85 L 665 250 L 775 250 Z M 775 250 L 775 295 M 775 220 L 815 220"
            stroke="var(--color-error-500)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.07"
            fill="none"
          />

          {/* Diagonal Stem (Fragmented / Dashed at junction) */}
          <path
            d="M 770 95 L 720 170"
            stroke="url(#danger-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 710 185 L 670 240 L 810 240"
            stroke="url(#danger-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="14 6"
            fill="none"
          />

          {/* Vertical Downward Leg with Gap */}
          <path
            d="M 770 95 L 770 215"
            stroke="url(#danger-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 770 230 L 770 285"
            stroke="url(#danger-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* Inner Accent Line */}
          <path
            d="M 770 110 L 685 235 L 800 235"
            stroke="var(--color-error-400)"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            strokeDasharray="4 8"
            fill="none"
          />

          {/* Severed Connection Crosshair Node ✕ */}
          <g transform="translate(670, 240)">
            <circle
              r="12"
              fill="var(--color-space-950)"
              stroke="var(--color-error-500)"
              strokeWidth="2"
            />
            <line
              x1="-5"
              y1="-5"
              x2="5"
              y2="5"
              stroke="var(--color-error-400)"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="-5"
              x2="-5"
              y2="5"
              stroke="var(--color-error-400)"
              strokeWidth="2"
            />
            {/* Distress Pulse */}
            <circle
              r="18"
              fill="none"
              stroke="var(--color-error-500)"
              strokeWidth="1"
              strokeOpacity="0.4"
              className="nf-ripple-active"
              style={{ animationDuration: "1.8s" }}
            />
          </g>

          {/* Severed Metadata Labels */}
          <g transform="translate(680, 275)">
            <text
              fill="var(--color-error-400)"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              DEST: UNREACHABLE
            </text>
            <text
              y="14"
              fill="var(--color-starlight-300)"
              fontSize="8.5"
              fontFamily="var(--font-mono)"
              letterSpacing="0.05em"
            >
              ERR: 404_PACKET_DROPPED
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
