"use client";

import React, { useState } from "react";
import { Laptop, Server, Orbit, WifiOff, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopologyNode {
  id: string;
  name: string;
  role: string;
  status: "ok" | "lost";
  statusCode: string;
  latency: string;
  coordinates: string;
  protocol: string;
  details: string;
  icon: React.ElementType;
}

interface NetworkTopologyProps {
  currentPath?: string;
  className?: string;
}

export function NetworkTopology({ currentPath = "/unknown-route", className }: NetworkTopologyProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("destination");

  const nodes: TopologyNode[] = [
    {
      id: "client",
      name: "CLIENT_ORIGIN",
      role: "User Terminal",
      status: "ok",
      statusCode: "200 CONNECTED",
      latency: "1 ms",
      coordinates: "LOCAL_HOST // 127.0.0.1",
      protocol: "QUIC / HTTP3",
      details: "Client session initiated, secure TLS 1.3 handshake verified.",
      icon: Laptop,
    },
    {
      id: "gateway",
      name: "NST_EDGE_GATEWAY",
      role: "Anycast Proxy",
      status: "ok",
      statusCode: "200 RESOLVED",
      latency: "14 ms",
      coordinates: "SECTOR-EU-CENTRAL // EDGE_POP",
      protocol: "HTTPS / BGP_ANYCAST",
      details: "Request authenticated and forwarded to celestial cluster mesh.",
      icon: Server,
    },
    {
      id: "router",
      name: "CONSTELLATION_MESH",
      role: "Route Dispatcher",
      status: "ok",
      statusCode: "200 ROUTED",
      latency: "28 ms",
      coordinates: "ORION-NODE-07 // MESH_RELAY",
      protocol: "NEXT_APP_ROUTER",
      details: "Parsed URL tree against registered NST routes and static paths.",
      icon: Orbit,
    },
    {
      id: "destination",
      name: "TARGET_NODE",
      role: currentPath,
      status: "lost",
      statusCode: "404 UNRESOLVED",
      latency: "∞ TIMEOUT",
      coordinates: "DEEP_VOID // SECTOR-NULL",
      protocol: "PACKET_DROP",
      details: "No matching handler, page, or celestial vector found in repository.",
      icon: WifiOff,
    },
  ];

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || nodes[3];

  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--space-900)]/80 p-4 sm:p-6 backdrop-blur-md transition-all duration-300 shadow-[var(--shadow-2)]",
        className
      )}
    >
      {/* Topology Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-error animate-ping" />
          <p className="font-technical text-xs font-semibold tracking-wider uppercase text-starlight-200">
            Network Route Trace
          </p>
          <span className="rounded-md bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-medium text-destructive">
            SEVERED_AT_HOP_4
          </span>
        </div>
        <p className="hidden font-mono text-[11px] text-starlight-400 sm:block">
          PROTOCOL: HTTP/3.0 QUIC • 100% PACKET_LOSS
        </p>
      </div>

      {/* Interactive Topology Graph */}
      <div className="relative mt-6 mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
        {nodes.map((node, index) => {
          const isSelected = selectedNodeId === node.id;
          const isLost = node.status === "lost";
          const Icon = node.icon;

          return (
            <div key={node.id} className="relative flex flex-col items-center">
              {/* Connector line between steps (desktop only) */}
              {index < nodes.length - 1 && (
                <div
                  className="pointer-events-none absolute top-7 left-[50%] hidden h-[2px] w-full sm:block"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full w-full",
                      index === 2
                        ? "bg-gradient-to-r from-gold-500/60 via-destructive/50 to-destructive border-dashed border-t-2 border-destructive/60 bg-transparent"
                        : "bg-gradient-to-r from-gold-500/50 to-gold-400/70"
                    )}
                  />
                  {/* Flow indicator pip */}
                  {index < 2 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-gold-400 shadow-[0_0_8px_var(--color-gold-400)]"
                      style={{
                        animation: "shimmer-sweep 2s ease-in-out infinite",
                        left: "40%",
                      }}
                    />
                  )}
                </div>
              )}

              {/* Node Card Button */}
              <button
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "group relative z-10 flex w-full flex-col items-center rounded-xl p-3 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                  isSelected
                    ? isLost
                      ? "border border-destructive/60 bg-destructive/10 shadow-[0_0_16px_rgba(202,44,44,0.2)]"
                      : "border border-gold-500/60 bg-gold-500/10 shadow-[0_0_16px_rgba(232,184,74,0.18)]"
                    : "border border-[color:var(--border-subtle)] bg-[color:var(--space-850)]/60 hover:border-gold-500/40 hover:bg-[color:var(--space-800)]/80"
                )}
                aria-pressed={isSelected}
              >
                {/* Node Icon Avatar */}
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border transition-all duration-200",
                    isLost
                      ? "border-destructive/60 bg-destructive/20 text-destructive group-hover:scale-105"
                      : "border-gold-500/40 bg-gold-500/15 text-gold-400 group-hover:scale-105"
                  )}
                >
                  <Icon className="size-5" />
                </div>

                {/* Node Label */}
                <span className="mt-2.5 font-mono text-[11px] font-semibold text-starlight-100 truncate max-w-full">
                  {node.name}
                </span>
                <span className="font-mono text-[10px] text-starlight-400 truncate max-w-full">
                  {node.role}
                </span>

                {/* Status Badge */}
                <div
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-medium",
                    isLost
                      ? "bg-destructive/20 text-destructive"
                      : "bg-success/15 text-success"
                  )}
                >
                  {isLost ? (
                    <XCircle className="size-3" />
                  ) : (
                    <CheckCircle2 className="size-3" />
                  )}
                  <span>{node.statusCode}</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Node Telemetry Inspector */}
      <div className="mt-4 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--space-950)]/70 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                activeNode.status === "lost" ? "bg-destructive animate-pulse" : "bg-success"
              )}
            />
            <p className="font-mono text-xs font-semibold text-starlight-100">
              INSPECTING: {activeNode.name}
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-starlight-400">
            <span>PING: <strong className="text-starlight-200">{activeNode.latency}</strong></span>
            <span>PROTO: <strong className="text-starlight-200">{activeNode.protocol}</strong></span>
          </div>
        </div>

        <p className="mt-2 text-xs text-starlight-300">
          {activeNode.details}
        </p>

        <div className="mt-2.5 flex items-center gap-2 border-t border-[color:var(--border-subtle)] pt-2 font-mono text-[10.5px] text-starlight-400">
          <span className="text-gold-500 font-semibold">VECTOR_COORDINATES:</span>
          <code className="text-starlight-200">{activeNode.coordinates}</code>
        </div>
      </div>
    </div>
  );
}
