// src/app/student/ranking/beginner-ranking-view.tsx
// Client Component - renders the "Ranking" page for BEGINNER students.
// Displays the group's full leaderboard with podium for top 3 and confetti celebration.

"use client";

import { useEffect, useRef } from "react";
import { Crown, Trophy, Sparkles, Medal, Award, Flame, User } from "lucide-react";
import confetti from "canvas-confetti";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { BeginnerStudentRankingView } from "@/lib/data/get-beginner-ranking";

function getInitials(name: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "S"
    );
}

// Visual left-to-right order on the podium: 2nd (left), 1st (center), 3rd (right)
const PODIUM_DISPLAY_ORDER = [2, 1, 3] as const;

export function BeginnerRankingView({
    ranking,
    currentStudentId,
}: {
    ranking: BeginnerStudentRankingView;
    currentStudentId: string;
}) {
    const firedRef = useRef(false);

    const isTop3 =
        ranking.currentStudentRank <= 3 && ranking.currentStudentRank > 0;
    const isFirst = ranking.currentStudentRank === 1;

    useEffect(() => {
        if (firedRef.current || !isTop3) return;
        firedRef.current = true;

        if (isFirst) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff"],
            });
        } else {
            confetti({
                particleCount: 50,
                spread: 55,
                origin: { y: 0.65 },
                colors: ["#94a3b8", "#cbd5e1", "#f59e0b"],
            });
        }
    }, [isTop3, isFirst]);

    const podiumStudents = ranking.students.filter((s) => s.rank <= 3);
    const restStudents = ranking.students.filter((s) => s.rank > 3);
    const currentStudent = ranking.students.find((s) => s.id === currentStudentId);

    return (
        <div className="space-y-6">
            {/* Top Status Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gold-500/25 bg-gradient-to-r from-space-900 via-space-900 to-space-950 p-5 shadow-gold">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-300 border border-gold-500/30">
                            <Sparkles className="size-3 text-gold-400" />
                            Beginner Track Standing
                        </span>
                        <span className="rounded-full bg-space-800 px-2 py-0.5 text-[11px] font-mono text-starlight-300">
                            {ranking.groupName}
                        </span>
                    </div>
                    <p className="text-sm text-starlight-300">
                        {isTop3 ? (
                            <span className="text-gold-300 font-semibold flex items-center gap-1.5 pt-1">
                                <Trophy className="size-4 text-gold-400" />
                                Outstanding! You are on the podium at Rank #{ranking.currentStudentRank}!
                            </span>
                        ) : (
                            <span>Keep solving missions and locking weekly deliverables to climb the ranks.</span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-border/60 bg-space-950 px-4 py-2 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-starlight-400 block">
                            Your Rank
                        </span>
                        <span className="font-mono text-base font-extrabold text-gold-400">
                            #{ranking.currentStudentRank > 0 ? ranking.currentStudentRank : "—"}
                        </span>
                    </div>

                    {currentStudent && (
                        <div className="rounded-xl border border-gold-500/30 bg-space-950 px-4 py-2 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 block">
                                Your ST
                            </span>
                            <span className="font-mono text-base font-extrabold text-gold-300">
                                {currentStudent.beginnerSt} ST
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Podium for Top 3 */}
            <BeginnerPodium
                students={podiumStudents}
                currentStudentId={currentStudentId}
                emptyMessage="No cadets have earned ST in this beginner cohort yet. Be the first to break the ice!"
            />

            {/* Rest of the Group Roster */}
            {restStudents.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400 px-1">
                        Cadet Standings ({ranking.students.length} Cadets)
                    </h4>
                    <div className="rounded-2xl border border-border/70 bg-space-900/60 overflow-hidden divide-y divide-border/60">
                        {restStudents.map((student) => (
                            <BeginnerRankingRow
                                key={student.id}
                                student={student}
                                isCurrentStudent={student.id === currentStudentId}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function BeginnerPodium({
    students,
    currentStudentId,
    emptyMessage,
}: {
    students: BeginnerStudentRankingView["students"];
    currentStudentId: string;
    emptyMessage: string;
}) {
    const byRank = (rank: number) => students.filter((s) => s.rank === rank);

    if (students.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/70 bg-space-950/40 py-12 text-center">
                <Trophy className="size-10 mx-auto text-starlight-400/60 mb-2" />
                <p className="text-sm text-starlight-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-6 px-4 pt-10 pb-4">
            {PODIUM_DISPLAY_ORDER.flatMap((rank) =>
                byRank(rank).map((student) => (
                    <BeginnerPodiumSpot
                        key={student.id}
                        student={student}
                        isCurrentStudent={student.id === currentStudentId}
                    />
                ))
            )}
        </div>
    );
}

const PODIUM_CONFIG: Record<
    number,
    {
        height: string;
        avatarSize: "default" | "lg";
        baseClassName: string;
        medalBadge: string;
        medalColor: string;
        ringClassName: string;
    }
> = {
    1: {
        height: "h-36 sm:h-44",
        avatarSize: "lg",
        baseClassName:
            "bg-gradient-to-t from-gold-500/30 via-gold-500/10 to-transparent border-t-2 border-gold-400 shadow-gold",
        medalBadge: "1st Place",
        medalColor: "text-gold-300",
        ringClassName: "ring-2 ring-gold-400 ring-offset-2 ring-offset-space-950",
    },
    2: {
        height: "h-28 sm:h-32",
        avatarSize: "default",
        baseClassName:
            "bg-gradient-to-t from-slate-400/20 via-slate-400/5 to-transparent border-t-2 border-slate-300",
        medalBadge: "2nd Place",
        medalColor: "text-slate-300",
        ringClassName: "ring-2 ring-slate-300 ring-offset-2 ring-offset-space-950",
    },
    3: {
        height: "h-24 sm:h-28",
        avatarSize: "default",
        baseClassName:
            "bg-gradient-to-t from-amber-700/20 via-amber-700/5 to-transparent border-t-2 border-amber-600",
        medalBadge: "3rd Place",
        medalColor: "text-amber-500",
        ringClassName: "ring-2 ring-amber-600 ring-offset-2 ring-offset-space-950",
    },
};

function BeginnerPodiumSpot({
    student,
    isCurrentStudent,
}: {
    student: BeginnerStudentRankingView["students"][number];
    isCurrentStudent: boolean;
}) {
    const config = PODIUM_CONFIG[student.rank];
    if (!config) return null;

    const isFirst = student.rank === 1;

    return (
        <div className="flex flex-col items-center">
            {/* Crown for #1 */}
            {isFirst && (
                <div className="mb-2 animate-bounce">
                    <Crown className="size-6 text-gold-400 fill-gold-400/30" />
                </div>
            )}

            {/* Avatar */}
            <div className="relative mb-2">
                <Avatar
                    className={`
                        ${config.avatarSize === "lg" ? "size-16 sm:size-20" : "size-12 sm:size-14"}
                        border-2 border-space-900 bg-space-850 ${config.ringClassName}
                    `}
                >
                    <AvatarFallback
                        className={`font-display font-bold ${
                            config.avatarSize === "lg" ? "text-base sm:text-lg" : "text-xs sm:text-sm"
                        } text-starlight-100 bg-space-800`}
                    >
                        {getInitials(student.name)}
                    </AvatarFallback>
                </Avatar>

                {isCurrentStudent && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-1.5 py-0.2 text-[9px] font-bold text-space-950 uppercase tracking-wider">
                        You
                    </span>
                )}
            </div>

            {/* Name & ST Score */}
            <div className="text-center mb-3">
                <p
                    className={`font-semibold max-w-[100px] sm:max-w-[120px] truncate ${
                        isFirst ? "text-sm sm:text-base text-starlight-100" : "text-xs text-starlight-200"
                    }`}
                >
                    {student.name}
                </p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="font-mono text-xs sm:text-sm font-bold text-gold-300">
                        {student.beginnerSt}
                    </span>
                    <span className="text-[10px] text-starlight-400 uppercase font-semibold">
                        ST
                    </span>
                </div>
            </div>

            {/* Pedestal Block */}
            <div
                className={`
                    w-20 sm:w-28 ${config.height} rounded-t-xl flex flex-col items-center justify-start pt-3
                    ${config.baseClassName}
                `}
            >
                <span className={`font-display text-xl sm:text-2xl font-black ${config.medalColor}`}>
                    #{student.rank}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-starlight-400 mt-0.5">
                    {config.medalBadge}
                </span>
            </div>
        </div>
    );
}

function BeginnerRankingRow({
    student,
    isCurrentStudent,
}: {
    student: BeginnerStudentRankingView["students"][number];
    isCurrentStudent: boolean;
}) {
    return (
        <div
            className={`
                flex items-center justify-between px-4 py-3 text-xs transition-colors
                ${
                    isCurrentStudent
                        ? "bg-gold-500/10 hover:bg-gold-500/15"
                        : "hover:bg-space-850/60"
                }
            `}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span
                    className={`font-mono font-bold w-7 text-center shrink-0 ${
                        isCurrentStudent ? "text-gold-400" : "text-starlight-400"
                    }`}
                >
                    #{student.rank}
                </span>

                <Avatar className="size-8 bg-space-800 border border-border/60 shrink-0">
                    <AvatarFallback className="text-[11px] font-bold text-starlight-200 bg-space-850">
                        {getInitials(student.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`font-medium truncate ${
                                isCurrentStudent ? "text-gold-300 font-semibold" : "text-starlight-200"
                            }`}
                        >
                            {student.name}
                        </span>
                        {isCurrentStudent && (
                            <span className="rounded-full bg-gold-500/20 px-1.5 py-0.2 text-[9px] font-bold text-gold-300 uppercase">
                                You
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-right shrink-0">
                <span className="font-mono text-sm font-bold text-gold-300">
                    {student.beginnerSt}
                </span>
                <span className="text-[10px] text-starlight-400 uppercase ml-1 font-semibold">
                    ST
                </span>
            </div>
        </div>
    );
}
