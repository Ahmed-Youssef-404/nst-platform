// src/components/student-360/student-leaderboard-card.tsx
"use client";

import type { Student360Overview } from "@/lib/data/get-student-360";
import { StudentAvatar } from "@/components/avatar/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Users, Coins, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentLeaderboardCard({
    ranking,
    studentId,
    track,
}: {
    ranking: Student360Overview["ranking"];
    studentId: string;
    track: "BEGINNER" | "INTERMEDIATE";
}) {
    return (
        <div className="space-y-4">
            {/* Scope explanation & ranking summary */}
            <div className="p-4 rounded-xl border border-border/80 bg-space-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Trophy className="size-4 text-gold-400" />
                        <span className="font-bold text-sm text-starlight-100">
                            {ranking.rankingScope}
                        </span>
                    </div>
                    <p className="text-xs text-starlight-400">
                        Dense-ranked across enrolled peers in this cohort group. Metric:{" "}
                        <span className="font-semibold text-gold-300">{ranking.metricLabel}</span>.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-starlight-400 block">
                            Current Standing
                        </span>
                        <span className="font-display text-2xl font-extrabold text-gold-300">
                            Rank #{ranking.currentRank}
                        </span>
                        <span className="text-xs text-starlight-400 block -mt-1">
                            of {ranking.totalPeers} cadets
                        </span>
                    </div>
                </div>
            </div>

            {/* Peer leaderboard preview */}
            <div className="rounded-xl border border-border/80 bg-space-900/70 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/70 bg-space-950/60 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-starlight-300">
                        Top Group Competitors
                    </span>
                    <span className="text-[11px] text-starlight-400 font-mono">
                        Dense Rank Ordering
                    </span>
                </div>

                <div className="divide-y divide-border/60">
                    {ranking.peers.map((peer) => {
                        const isMe = peer.isCurrentStudent;

                        return (
                            <div
                                key={peer.id}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 transition-colors",
                                    isMe
                                        ? "bg-gold-500/10 border-l-2 border-l-gold-400"
                                        : "hover:bg-space-850/50"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className={cn(
                                            "flex size-7 items-center justify-center rounded-lg font-mono font-bold text-xs shrink-0",
                                            peer.rank === 1
                                                ? "bg-gold-500/20 text-gold-300 border border-gold-500/40"
                                                : peer.rank === 2
                                                  ? "bg-starlight-200/15 text-starlight-200 border border-border"
                                                  : peer.rank === 3
                                                    ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                                    : "bg-space-850 text-starlight-400 border border-border/70"
                                        )}
                                    >
                                        #{peer.rank}
                                    </div>

                                    <StudentAvatar
                                        avatarConfig={peer.avatarConfig}
                                        name={peer.name}
                                        size="sm"
                                        className="size-7 shrink-0"
                                    />

                                    <div className="min-w-0">
                                        <p
                                            className={cn(
                                                "text-xs font-semibold truncate",
                                                isMe ? "text-gold-300" : "text-starlight-100"
                                            )}
                                        >
                                            {peer.name} {isMe && "(This Cadet)"}
                                        </p>
                                        <p className="text-[10px] text-starlight-400 font-mono">
                                            {peer.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-gold-300 shrink-0">
                                    <Coins className="size-3.5 text-gold-400" />
                                    <span>{peer.score}</span>
                                    <span className="text-[10px] text-starlight-400 font-normal">ST</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
