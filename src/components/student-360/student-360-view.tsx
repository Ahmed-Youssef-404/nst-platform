// src/components/student-360/student-360-view.tsx
"use client";

import { useState } from "react";
import type { Student360ProfileData } from "@/lib/data/get-student-360";
import { Student360Header } from "./student-360-header";
import { StudentSTTransactionsTable } from "./student-st-transactions-table";
import { StudentInstructorAdjustments } from "./student-instructor-adjustments";
import { StudentAcademicProgress } from "./student-academic-progress";
import { StudentAttendanceSection } from "./student-attendance-section";
import { StudentActivityTimeline } from "./student-activity-timeline";
import { StudentLeaderboardCard } from "./student-leaderboard-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Coins,
    SlidersHorizontal,
    GraduationCap,
    Clock,
    Activity,
    Trophy,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/format-date";

export function Student360View({
    data,
    role = "super_admin",
}: {
    data: Student360ProfileData;
    role?: "super_admin" | "instructor";
}) {
    const [activeTab, setActiveTab] = useState<string>("overview");
    const { overview, transactions, instructorAdjustments, taskProgress, weekResources, attendanceRecords, timeline, storePurchases } = data;
    const isBeginner = overview.group.type === "BEGINNER";
    const isSuperAdmin = role === "super_admin";

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. Comprehensive Header */}
            <Student360Header overview={overview} role={role} />

            {/* 2. Structured Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-space-900/90 border border-border/80 p-1 rounded-xl flex-wrap h-auto gap-1">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                    >
                        <Sparkles className="size-3.5 mr-1.5" />
                        Overview
                    </TabsTrigger>

                    <TabsTrigger
                        value="transactions"
                        className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                    >
                        <Coins className="size-3.5 mr-1.5" />
                        ST History ({transactions.length})
                    </TabsTrigger>

                    <TabsTrigger
                        value="adjustments"
                        className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                    >
                        <SlidersHorizontal className="size-3.5 mr-1.5" />
                        Instructor Adjustments ({instructorAdjustments.length})
                    </TabsTrigger>

                    <TabsTrigger
                        value="academic"
                        className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                    >
                        <GraduationCap className="size-3.5 mr-1.5" />
                        Academic & Grading ({taskProgress.length})
                    </TabsTrigger>

                    <TabsTrigger
                        value="attendance"
                        className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                    >
                        <Clock className="size-3.5 mr-1.5" />
                        Attendance & Feedback {!isBeginner && `(${attendanceRecords.length})`}
                    </TabsTrigger>

                    <TabsTrigger
                        value="timeline"
                        className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                    >
                        <Activity className="size-3.5 mr-1.5" />
                        Timeline ({timeline.length})
                    </TabsTrigger>

                    {isSuperAdmin && storePurchases.length > 0 && (
                        <TabsTrigger
                            value="store"
                            className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300 font-semibold text-xs rounded-lg py-2 px-3"
                        >
                            <ShoppingBag className="size-3.5 mr-1.5" />
                            Store Items ({storePurchases.length})
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Leaderboard Standing & Recent Transactions Preview */}
                        <div className="lg:col-span-2 space-y-6">
                            <StudentLeaderboardCard
                                ranking={overview.ranking}
                                studentId={overview.id}
                                track={overview.group.type}
                            />

                            {/* Recent ST Activity Preview */}
                            <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-starlight-200 flex items-center gap-2">
                                        <Coins className="size-4 text-gold-400" />
                                        Recent ST Transactions
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("transactions")}
                                        className="text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
                                    >
                                        View All ({transactions.length}) →
                                    </button>
                                </div>

                                {transactions.length === 0 ? (
                                    <p className="text-xs text-starlight-400 italic py-4 text-center">
                                        No transactions recorded yet.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border/60">
                                        {transactions.slice(0, 4).map((tx) => {
                                            const isReward = tx.type === "REWARD";
                                            return (
                                                <div
                                                    key={tx.id}
                                                    className="py-2.5 flex items-center justify-between text-xs"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="font-semibold text-starlight-100 truncate">
                                                            {tx.reason.replace(/_/g, " ")}
                                                        </p>
                                                        <p className="text-[10px] text-starlight-400 font-mono">
                                                            {formatDate(tx.createdAt)}
                                                            {tx.actorName && ` · by ${tx.actorName}`}
                                                            {tx.relatedEntityName && ` · ${tx.relatedEntityName}`}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`font-mono font-bold shrink-0 ${
                                                            isReward ? "text-success-400" : "text-destructive"
                                                        }`}
                                                    >
                                                        {isReward ? `+${tx.amount}` : `-${tx.amount}`} ST
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Col: Academic Progress Summary & Context */}
                        <div className="space-y-6">
                            {/* Academic Highlights Card */}
                            <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 space-y-4">
                                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-starlight-200 flex items-center gap-2">
                                    <GraduationCap className="size-4 text-gold-400" />
                                    Academic Highlights
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/60 border border-border/60">
                                        <span className="text-starlight-400">Track Type</span>
                                        <span className="font-semibold text-starlight-100">
                                            {isBeginner ? "Beginner (Self-paced)" : "Intermediate (Level-based)"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/60 border border-border/60">
                                        <span className="text-starlight-400">Total Curriculum Tasks</span>
                                        <span className="font-bold text-starlight-100">
                                            {overview.progressSummary.totalTasksAvailable}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/60 border border-border/60">
                                        <span className="text-starlight-400">Tasks Submitted</span>
                                        <span className="font-bold text-success-400">
                                            {overview.progressSummary.totalTasksSubmitted}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/60 border border-border/60">
                                        <span className="text-starlight-400">Evaluations Finalized</span>
                                        <span className="font-bold text-gold-300">
                                            {overview.progressSummary.totalTasksGraded}
                                        </span>
                                    </div>

                                    {!isBeginner && (
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/60 border border-border/60">
                                            <span className="text-starlight-400">Attendance Rate</span>
                                            <span className="font-bold text-violet-300">
                                                {overview.attendanceSummary.attendancePercentage}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("academic")}
                                    className="w-full text-center text-xs font-semibold text-gold-400 hover:text-gold-300 pt-1 transition-colors block"
                                >
                                    Inspect Full Curriculum & Rubrics →
                                </button>
                            </div>

                            {/* Instructor Adjustments Teaser */}
                            {instructorAdjustments.length > 0 && (
                                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-starlight-200 flex items-center gap-2">
                                            <SlidersHorizontal className="size-4 text-violet-400" />
                                            Manual Adjustments
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("adjustments")}
                                            className="text-xs font-semibold text-gold-400 hover:text-gold-300"
                                        >
                                            Audit ({instructorAdjustments.length}) →
                                        </button>
                                    </div>

                                    <p className="text-xs text-starlight-300">
                                        {instructorAdjustments.length} manual instructor adjustment(s) recorded for this student.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: ST TRANSACTIONS */}
                <TabsContent value="transactions">
                    <StudentSTTransactionsTable
                        transactions={transactions}
                        isBeginner={isBeginner}
                    />
                </TabsContent>

                {/* TAB 3: INSTRUCTOR ADJUSTMENTS */}
                <TabsContent value="adjustments">
                    <StudentInstructorAdjustments
                        adjustments={instructorAdjustments}
                        studentName={overview.name}
                        onViewAllTransactions={() => setActiveTab("transactions")}
                    />
                </TabsContent>

                {/* TAB 4: ACADEMIC & GRADING */}
                <TabsContent value="academic">
                    <StudentAcademicProgress
                        tasks={taskProgress}
                        weekResources={weekResources}
                        isTrackBeginner={isBeginner}
                    />
                </TabsContent>

                {/* TAB 5: ATTENDANCE & FEEDBACK */}
                <TabsContent value="attendance">
                    <StudentAttendanceSection
                        records={attendanceRecords}
                        supported={overview.attendanceSummary.supported}
                    />
                </TabsContent>

                {/* TAB 6: ACTIVITY TIMELINE */}
                <TabsContent value="timeline">
                    <StudentActivityTimeline events={timeline} />
                </TabsContent>

                {/* TAB 7: STORE PURCHASES (Super Admin) */}
                {isSuperAdmin && storePurchases.length > 0 && (
                    <TabsContent value="store" className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {storePurchases.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-xl border border-border/80 bg-space-900/70 flex items-center justify-between gap-3"
                                >
                                    <div className="space-y-1 min-w-0">
                                        <p className="font-semibold text-sm text-starlight-100 truncate">
                                            {item.itemName}
                                        </p>
                                        <p className="text-[10px] text-starlight-400 font-mono">
                                            Purchased: {formatDate(item.purchasedAt)}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="font-mono font-bold text-xs text-gold-300 block">
                                            {item.cost} ST
                                        </span>
                                        {item.isEquipped && (
                                            <Badge className="bg-gold-500/15 text-gold-300 border-gold-500/30 text-[9px] px-1.5 py-0 mt-0.5">
                                                Equipped
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
