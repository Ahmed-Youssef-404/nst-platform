"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, Radio, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TelemetryConsoleProps {
  currentPath?: string;
  isRadarActive?: boolean;
  onTriggerRadar?: () => void;
  className?: string;
}

export function TelemetryConsole({
  currentPath = "/unknown-vector",
  isRadarActive = false,
  onTriggerRadar,
  className,
}: TelemetryConsoleProps) {
  const [copied, setCopied] = useState(false);
  const [userTab, setUserTab] = useState<"request" | "radar" | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const activeTab = userTab ?? (isRadarActive ? "radar" : "request");

  // Stream scan logs via async timers when radar is triggered
  useEffect(() => {
    if (!isRadarActive) return;

    const logMessages = [
      `[00.0s] INITIATING CELESTIAL SENSOR ARRAY SWEEP...`,
      `[00.4s] BEACON BROADCAST TO NST REGISTRY AT ANYCAST EDGE...`,
      `[00.8s] SCANNING REGISTERED REPOSITORY ROUTES (/student, /instructor, /login)...`,
      `[01.3s] PROBE RESULT: TARGET URI "${currentPath}" NOT FOUND IN ROUTE MAP.`,
      `[01.8s] DRIFT ASSESSMENT: PACKET TIMED OUT IN UNCHARTED SPACE (SECTOR-00).`,
      `[02.4s] SAFE HARBOR LOCATED: NORTHERN STARS TEAM HOMESTATION [ / ].`,
    ];

    const timers: NodeJS.Timeout[] = [];
    timers.push(
      setTimeout(() => {
        setScanLogs([logMessages[0]]);
      }, 50)
    );

    logMessages.slice(1).forEach((msg, idx) => {
      timers.push(
        setTimeout(() => {
          setScanLogs((prev) => [...prev, msg]);
        }, (idx + 1) * 450)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [isRadarActive, currentPath]);

  const copyDiagnostic = () => {
    const diagnosticPayload = `--- NST PLATFORM ROUTE EXCEPTION ---
URL: ${currentPath}
STATUS: 404 NOT_FOUND
VECTOR: SECTOR-00 // DEEP_VOID
PROTOCOL: HTTP/3.0 QUIC
TIMESTAMP: ${new Date().toISOString()}
PACKET_STATUS: DROPPED
CLIENT_USER_AGENT: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
------------------------------------`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(diagnosticPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--space-900)]/90 backdrop-blur-md shadow-[var(--shadow-3)] overflow-hidden transition-all duration-300",
        className
      )}
    >
      {/* Console Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border-subtle)] bg-[color:var(--space-950)]/70 px-4 py-3">
        {/* Left window control buttons */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-destructive/80" />
            <span className="size-2.5 rounded-full bg-warning/80" />
            <span className="size-2.5 rounded-full bg-success/80" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-semibold text-starlight-300">
            NST_TELEMETRY_LOGS.sh
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUserTab("request")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10.5px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gold-500",
              activeTab === "request"
                ? "bg-gold-500/20 text-gold-400 font-semibold"
                : "text-starlight-400 hover:text-starlight-200"
            )}
          >
            <Terminal className="size-3" />
            Request Telemetry
          </button>
          <button
            type="button"
            onClick={() => {
              setUserTab("radar");
              if (!isRadarActive && onTriggerRadar) onTriggerRadar();
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10.5px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gold-500",
              activeTab === "radar"
                ? "bg-gold-500/20 text-gold-400 font-semibold"
                : "text-starlight-400 hover:text-starlight-200"
            )}
          >
            <Radio className="size-3" />
            Radar Scanner
          </button>
          <button
            type="button"
            onClick={copyDiagnostic}
            className="ml-2 inline-flex items-center gap-1 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--space-850)]/70 px-2 py-1 font-mono text-[10px] text-starlight-300 transition-colors hover:border-gold-500/40 hover:text-gold-400"
            title="Copy diagnostic to clipboard"
          >
            {copied ? (
              <>
                <Check className="size-3 text-success" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy Log</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Console Content Window */}
      <div className="p-4 font-mono text-xs leading-relaxed text-starlight-200">
        {activeTab === "request" ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gold-400">GET</span>
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive">
                {currentPath}
              </span>
              <span className="text-starlight-400">HTTP/2.0</span>
            </div>

            <div className="pt-2 text-starlight-300 space-y-1">
              <p>
                <span className="text-starlight-400">→ Response:</span>{" "}
                <span className="text-destructive font-semibold">404 NOT_FOUND</span>{" "}
                <span className="text-starlight-400">[STREAM_RESET_ERR]</span>
              </p>
              <p>
                <span className="text-starlight-400">→ Sector:</span>{" "}
                <span>{"SECTOR-00 // DEEP_VOID (RA: 14h 29m / DEC: -62° 40')"}</span>
              </p>
              <p>
                <span className="text-starlight-400">→ Packet Status:</span>{" "}
                <span className="text-warning">100% LOSS // DRIFTED BEYOND CHARTED MESH</span>
              </p>
              <p>
                <span className="text-starlight-400">→ Diagnostic:</span>{" "}
                <span>Destination coordinate does not resolve to an active NST service.</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] pb-2 text-[11px] text-starlight-400">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gold-400 animate-pulse" />
                CELESTIAL RECON SCANNER // ACTIVE
              </span>
              {onTriggerRadar && (
                <button
                  type="button"
                  onClick={onTriggerRadar}
                  className="flex items-center gap-1 text-gold-400 hover:underline"
                >
                  <RotateCcw className="size-3" />
                  Re-ping
                </button>
              )}
            </div>

            <div className="pt-2 space-y-1 text-starlight-300 min-h-[90px]">
              {scanLogs.length === 0 ? (
                <p className="text-starlight-400 italic">
                  Press &ldquo;Recalculate Route&rdquo; to launch celestial radar ping...
                </p>
              ) : (
                scanLogs.map((log, index) => (
                  <p
                    key={index}
                    className={cn(
                      "animate-fade-in",
                      index === scanLogs.length - 1 && "text-gold-400 font-semibold"
                    )}
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
