// src/app/student/ranking/ranking-view.tsx
// Client Component - renders the "Ranking" page as tabs: one "Total ST"
// tab (top-3 podium only, ranked by avgSt - see get-student-ranking.ts for
// why it's capped at top 3) plus one tab per Level the Group has ever had
// (oldest first, full group roster, ranked by that Level's LevelStBalance).
//
// Highlights the logged-in Student wherever they appear, and fires
// confetti once on mount if that Student is in the top 3 of the
// *currently active Level's* tab specifically (not Total ST, not a frozen
// Level - the confetti is meant to celebrate "how you're doing right now",
// and firing it for every tab on load would be more annoying than festive).
//
// No data fetching here - the full ranking payload comes in as a prop from
// the Server Component (page.tsx), same pattern as STBalanceCard/
// StudentSTHistoryView. Each tab's list is small (one Group's roster) so
// there's no pagination.

"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
    RankedStudentByLevel,
    RankedStudentByAvg,
    StudentRankingView as StudentRankingData,
} from "@/lib/data/get-student-ranking";

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "S";
}

// Visual left-to-right order on the podium (classic sports layout):
// 2nd on the left, 1st in the center (tallest), 3rd on the right.
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
            ? ["#bdae1f", "#e09d32", "#ffffff"]
            : ["#bdae1f", "#e09d32"];

        (function frame() {
            confetti({
                particleCount: activeLevelIsFirst ? 5 : 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.6 },
                colors,
            });
            confetti({
                particleCount: activeLevelIsFirst ? 5 : 3,
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
            // Extra celebratory center burst just for the #1 spot.
            confetti({
                particleCount: 120,
                spread: 100,
                startVelocity: 45,
                origin: { x: 0.5, y: 0.4 },
                colors,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6 backdrop-blur-md">
            {activeLevelIsFirst && (
                <div className="flex items-center gap-2 rounded-lg border border-coin bg-coin-bg px-4 py-3 text-coin">
                    <Crown className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-semibold">
                        You&apos;re #1 in {ranking.groupName} this Level. Keep it up!
                    </p>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)}>
                <TabsList className="flex w-full flex-wrap gap-1">
                    <TabsTrigger value="total">Total ST</TabsTrigger>
                    {ranking.levels.map((level) => (
                        <TabsTrigger key={level.levelId} value={level.levelId}>
                            {level.levelName}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="total">
                    <TotalStTab
                        overall={ranking.overall}
                        groupName={ranking.groupName}
                        currentStudentId={currentStudentId}
                    />
                </TabsContent>

                {ranking.levels.map((level) => (
                    <TabsContent key={level.levelId} value={level.levelId}>
                        <LevelTab level={level} currentStudentId={currentStudentId} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

// --- "Total ST" tab: premium, top-3-only podium, ranked by avgSt ---

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
        <div className="space-y-4">
            <div className="rounded-lg border border-coin/40 bg-gradient-to-b from-coin/10 to-transparent p-4">
                <p className="text-center text-xs text-muted-foreground">
                    Top performers in {groupName}, ranked by average ST across every Level.
                </p>
            </div>
            <Podium students={overall.students} currentStudentId={currentStudentId} emptyMessage="No one has earned ST yet." />
            {overall.currentStudentRank > 3 && (
                <p className="text-center text-xs text-muted-foreground">
                    You&apos;re currently rank #{overall.currentStudentRank} overall - keep going to reach the podium!
                </p>
            )}
        </div>
    );
}

// --- Per-Level tab: full roster, ranked by that Level's LevelStBalance ---

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
            {!level.isActive && (
                <p className="text-center text-xs text-muted-foreground">
                    This Level has ended - these results are final.
                </p>
            )}

            <Podium
                students={podiumStudents}
                currentStudentId={currentStudentId}
                emptyMessage="No one has earned ST yet this Level. Be the first!"
            />

            {restStudents.length > 0 && (
                <div className="rounded-lg border border-border">
                    {restStudents.map((student) => (
                        <RankingRow
                            key={student.id}
                            student={student}
                            isCurrentStudent={student.id === currentStudentId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Shared podium + row components (used by both tab kinds) ---

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
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-6 px-2 pt-6">
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

const PODIUM_STYLES: Record<
    number,
    { height: string; avatarSize: "default" | "lg"; base: string; label: string }
> = {
    1: {
        height: "h-28",
        avatarSize: "lg",
        base: "bg-gradient-to-t from-coin/40 to-coin/10 border-coin",
        label: "1st",
    },
    2: {
        height: "h-20",
        avatarSize: "default",
        base: "bg-muted/60 border-border",
        label: "2nd",
    },
    3: {
        height: "h-14",
        avatarSize: "default",
        base: "bg-muted/40 border-border",
        label: "3rd",
    },
};

function PodiumSpot({
    student,
    isCurrentStudent,
}: {
    student: RankedStudent;
    isCurrentStudent: boolean;
}) {
    const style = PODIUM_STYLES[student.rank] ?? PODIUM_STYLES[3];

    return (
        <div className="flex w-24 flex-col items-center gap-2">
            {isCurrentStudent && (
                <span className={`rounded-full bg-primary px-2 py-0.5 relative text-[10px] font-semibold text-primary-foreground ${student.rank === 1 && "bottom-4"}`}>
                    That&apos;s you!
                </span>
            )}

            <div className="relative">
                {student.rank === 1 && (
                    <Crown className="absolute left-[8px] rotate-[336deg] -top-4 h-5 w-5 -translate-x-1/2 text-coin"/>
                )}
                <Avatar
                    size={style.avatarSize}
                    className={
                        isCurrentStudent
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : undefined
                    }
                >
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
            </div>

            <div className="text-center">
                <p className="max-w-24 truncate text-xs font-medium">{student.name}</p>
                <p className="text-xs font-semibold tabular-nums text-coin">
                    {stValueOf(student)} ST
                </p>
            </div>

            <div
                className={`flex w-full items-start justify-center rounded-t-lg border ${style.height} ${style.base}`}
            >
                <span className="mt-2 text-sm font-bold text-muted-foreground">
                    {style.label}
                </span>
            </div>
        </div>
    );
}

function RankingRow({
    student,
    isCurrentStudent,
}: {
    student: RankedStudent;
    isCurrentStudent: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-between backdrop-blur-2xl gap-4 border-b border-border px-4 py-3.5 last:border-b-0 ${isCurrentStudent && "bg-primary/10"}`}>
            <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                    {student.rank}
                </span>
                <Avatar
                    size="sm"
                    className={isCurrentStudent ? "ring-2 ring-primary" : undefined}
                >
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <p className="truncate text-sm font-medium">
                    {student.name}
                    {isCurrentStudent && (
                        <span className="ml-2 text-xs font-semibold text-primary">
                            (You)
                        </span>
                    )}
                </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-coin">
                {stValueOf(student)} ST
            </span>
        </div>
    );
}