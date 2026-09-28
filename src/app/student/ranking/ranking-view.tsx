// src/app/student/ranking/ranking-view.tsx
// Client Component - renders the "Ranking" page as tabs: one "Total ST"
// tab plus one tab per Level. Highlights the logged-in Student and fires
// celebration confetti if in the top 3 of the active level.

"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Trophy, Sparkles, Medal, Award, Flame, User } from "lucide-react";
import confetti from "canvas-confetti";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
    RankedStudentByLevel,
    RankedStudentByAvg,
    StudentRankingView as StudentRankingData,
} from "@/lib/data/get-student-ranking";

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

type RankedStudent = RankedStudentByLevel | RankedStudentByAvg;

function stValueOf(student: RankedStudent): number {
    return "levelSt" in student ? student.levelSt : student.avgSt;
}

export function StudentRankingView({
    ranking,
    currentStudentId,
}: {
    ranking: StudentRankingData;
    currentStudentId: string;
}) {
    const activeLevel = ranking.levels.find((l) => l.isActive);
    const defaultTab = activeLevel?.levelId ?? "total";

    const [activeTab, setActiveTab] = useState(defaultTab);
    const firedRef = useRef(false);

    const activeLevelIsTop3 =
        !!activeLevel &&
        activeLevel.currentStudentRank <= 3 &&
        activeLevel.currentStudentRank > 0;
    const activeLevelIsFirst = activeLevel?.currentStudentRank === 1;

    useEffect(() => {
        if (firedRef.current || !activeLevelIsTop3) return;
        firedRef.current = true;

        const duration = activeLevelIsFirst ? 2200 : 1400;
        const end = Date.now() + duration;
        const colors = activeLevelIsFirst
            ? ["#E8B84A", "#F6D77A", "#FFFFFF", "#F2C866"]
            : ["#E8B84A", "#F6D77A", "#AAA69D"];

        (function frame() {
            confetti({
                particleCount: activeLevelIsFirst ? 6 : 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.6 },
                colors,
            });
            confetti({
                particleCount: activeLevelIsFirst ? 6 : 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.6 },
                colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();

        if (activeLevelIsFirst) {
            confetti({
                particleCount: 130,
                spread: 100,
                startVelocity: 45,
                origin: { x: 0.5, y: 0.4 },
                colors,
            });
        }
    }, [activeLevelIsFirst, activeLevelIsTop3]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Celebration Banner if #1 */}
            {activeLevelIsFirst && (
                <div className="relative overflow-hidden rounded-2xl border border-gold-500/50 bg-gradient-to-r from-gold-500/25 via-space-900 to-space-950 p-5 shadow-gold">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-gold">
                            <Crown className="size-6 text-gold-300 animate-bounce" />
                        </div>
                        <div>
                            <p className="text-base font-extrabold text-gold-200">
                                Stellar Champion! You&apos;re #1 in {ranking.groupName}
                            </p>
                            <p className="text-xs text-starlight-300">
                                You are leading the current level tournament. Keep completing missions to maintain your rank.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as string)}
                className="space-y-6"
            >
                <div className="flex items-center justify-between overflow-x-auto pb-1">
                    <TabsList className="h-11 bg-space-900/90 border border-border/80 p-1 rounded-xl">
                        <TabsTrigger
                            value="total"
                            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-500/40 data-[state=active]:shadow-gold transition-all"
                        >
                            <Trophy className="size-3.5 mr-1.5 text-gold-400" />
                            Total ST Podium
                        </TabsTrigger>

                        {ranking.levels.map((level) => (
                            <TabsTrigger
                                key={level.levelId}
                                value={level.levelId}
                                className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-500/40 data-[state=active]:shadow-gold transition-all"
                            >
                                Level {level.levelNumber}
                                {level.isActive && (
                                    <span className="ml-1.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Total ST Tab Content */}
                <TabsContent value="total" className="space-y-6 mt-0">
                    <TotalStTab
                        overall={ranking.overall}
                        groupName={ranking.groupName}
                        currentStudentId={currentStudentId}
                    />
                </TabsContent>

                {/* Level Tabs */}
                {ranking.levels.map((level) => (
                    <TabsContent key={level.levelId} value={level.levelId} className="space-y-6 mt-0">
                        <LevelTab level={level} currentStudentId={currentStudentId} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

// ============================================
// TOTAL ST TAB
// ============================================

function TotalStTab({
    overall,
    groupName,
    currentStudentId,
}: {
    overall: StudentRankingData["overall"];
    groupName: string;
    currentStudentId: string;
}) {
    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-br from-space-900 via-space-900 to-space-950 p-6 text-center space-y-1">
                <h3 className="font-display text-base font-bold text-starlight-100 flex items-center justify-center gap-2">
                    <Award className="size-4 text-gold-400" />
                    All-Time Hall of Fame — {groupName}
                </h3>
                <p className="text-xs text-starlight-400 max-w-lg mx-auto">
                    Ranked by average Star Tokens maintained across all active and archived levels. The top 3 performers earn a spot on the grand podium.
                </p>
            </div>

            <Podium
                students={overall.students}
                currentStudentId={currentStudentId}
                emptyMessage="No cadets have earned ST yet. Start completing tasks to ascend the leaderboard!"
            />

            {overall.currentStudentRank > 3 && (
                <div className="rounded-xl border border-border/70 bg-space-900/60 p-4 text-center">
                    <p className="text-xs text-starlight-300">
                        You are currently positioned at <span className="font-bold text-gold-400">Rank #{overall.currentStudentRank}</span> overall. Keep completing missions to reach the podium!
                    </p>
                </div>
            )}
        </div>
    );
}

// ============================================
// LEVEL TAB
// ============================================

function LevelTab({
    level,
    currentStudentId,
}: {
    level: StudentRankingData["levels"][number];
    currentStudentId: string;
}) {
    const podiumStudents = level.students.filter((s) => s.rank <= 3);
    const restStudents = level.students.filter((s) => s.rank > 3);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-space-900/60 p-4 px-6">
                <div>
                    <h3 className="text-sm font-bold text-starlight-100 flex items-center gap-2">
                        <span>Level {level.levelNumber} Leaderboard</span>
                        {level.isActive ? (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                                Live Cohort
                            </span>
                        ) : (
                            <span className="rounded-full bg-space-800 px-2 py-0.5 text-[10px] font-medium text-starlight-400 border border-border/60">
                                Archived
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-starlight-400 mt-0.5">
                        {level.isActive
                            ? "Rankings update in real-time as tasks are submitted and evaluated."
                            : "This level has officially ended — these rankings are permanently preserved."}
                    </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-space-950 px-3.5 py-1.5 text-center">
                    <span className="text-[10px] font-medium text-starlight-400 uppercase tracking-wider block">
                        Your Rank
                    </span>
                    <span className="font-mono text-sm font-bold text-gold-400">
                        #{level.currentStudentRank > 0 ? level.currentStudentRank : "—"}
                    </span>
                </div>
            </div>

            <Podium
                students={podiumStudents}
                currentStudentId={currentStudentId}
                emptyMessage="No cadets have earned ST in this level yet. Be the first to break the ice!"
            />

            {restStudents.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400 px-1">
                        Group Roster & Standings
                    </h4>
                    <div className="rounded-2xl border border-border/70 bg-space-900/60 overflow-hidden divide-y divide-border/60">
                        {restStudents.map((student) => (
                            <RankingRow
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

// ============================================
// PODIUM COMPONENT
// ============================================

function Podium({
    students,
    currentStudentId,
    emptyMessage,
}: {
    students: RankedStudent[];
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
                    <PodiumSpot
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
        height: "h-20 sm:h-24",
        avatarSize: "default",
        baseClassName:
            "bg-gradient-to-t from-amber-700/20 via-amber-700/5 to-transparent border-t-2 border-amber-500/60",
        medalBadge: "3rd Place",
        medalColor: "text-amber-400",
        ringClassName: "ring-2 ring-amber-500 ring-offset-2 ring-offset-space-950",
    },
};

function PodiumSpot({
    student,
    isCurrentStudent,
}: {
    student: RankedStudent;
    isCurrentStudent: boolean;
}) {
    const config = PODIUM_CONFIG[student.rank] ?? PODIUM_CONFIG[3];

    return (
        <div className="flex w-28 sm:w-36 flex-col items-center gap-2.5">
            {/* "That's You!" Indicator */}
            {isCurrentStudent && (
                <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-extrabold text-space-950 shadow-gold animate-bounce">
                    That&apos;s you!
                </span>
            )}

            {/* Avatar & Crown */}
            <div className="relative">
                {student.rank === 1 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <Crown className="size-6 text-gold-300 fill-gold-400/40 drop-shadow-[0_0_8px_rgba(232,184,74,0.6)] animate-pulse" />
                    </div>
                )}
                <Avatar
                    size={config.avatarSize}
                    className={`border border-border/80 ${config.ringClassName}`}
                >
                    <AvatarFallback className="font-bold text-starlight-100 bg-space-850">
                        {getInitials(student.name)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Student Info */}
            <div className="text-center space-y-0.5 max-w-full">
                <p className="truncate text-xs font-bold text-starlight-100 px-1">
                    {student.name}
                </p>
                <p className="font-mono text-xs font-extrabold text-gold-300">
                    {stValueOf(student)} ST
                </p>
            </div>

            {/* Pedestal Block */}
            <div
                className={`flex w-full items-start justify-center rounded-t-2xl border border-b-0 border-border/70 ${config.height} ${config.baseClassName}`}
            >
                <span className={`mt-3 text-xs font-black uppercase tracking-wider ${config.medalColor}`}>
                    {config.medalBadge}
                </span>
            </div>
        </div>
    );
}

// ============================================
// RANKING ROW COMPONENT
// ============================================

function RankingRow({
    student,
    isCurrentStudent,
}: {
    student: RankedStudent;
    isCurrentStudent: boolean;
}) {
    return (
        <div
            className={`
                flex items-center justify-between gap-4 px-5 py-3.5 transition-colors
                ${
                    isCurrentStudent
                        ? "bg-gold-500/15 text-gold-200 border-l-4 border-gold-500"
                        : "hover:bg-space-850/60 text-starlight-200"
                }
            `}
        >
            <div className="flex min-w-0 items-center gap-3.5">
                <span
                    className={`
                        w-7 shrink-0 text-center font-mono text-xs font-bold
                        ${isCurrentStudent ? "text-gold-300" : "text-starlight-400"}
                    `}
                >
                    #{student.rank}
                </span>

                <Avatar
                    size="sm"
                    className={`border border-border/60 ${isCurrentStudent ? "ring-2 ring-gold-500/50" : ""}`}
                >
                    <AvatarFallback className="text-xs font-bold bg-space-850 text-starlight-200">
                        {getInitials(student.name)}
                    </AvatarFallback>
                </Avatar>

                <p className="truncate text-sm font-semibold">
                    {student.name}
                    {isCurrentStudent && (
                        <span className="ml-2 rounded-md bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-300 border border-gold-500/40">
                            YOU
                        </span>
                    )}
                </p>
            </div>

            <span className="shrink-0 font-mono text-sm font-extrabold text-gold-300">
                {stValueOf(student)} ST
            </span>
        </div>
    );
}