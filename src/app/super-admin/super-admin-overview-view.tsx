// src/app/super-admin/super-admin-overview-view.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Users,
    GraduationCap,
    UserPlus,
    Search,
    Filter,
    Copy,
    Check,
    Crown,
    Shield,
    Coins,
    Eye,
    EyeOff,
    Sparkles,
    Layers,
    ChevronRight,
    Calendar,
    ArrowUpRight,
    RefreshCw,
    Award,
    Hash,
    Mail,
    Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createInstructorAction,
    createStudentAction,
} from "@/lib/actions/user-management";
import type {
    SuperAdminOverviewData,
    SuperAdminStudentSummary,
    SuperAdminInstructorSummary,
} from "@/lib/data/get-super-admin-overview";
import type { GroupOption } from "@/lib/data/get-groups";
import { formatDate } from "@/lib/format-date";
import { showToast } from "@/components/ui/toast";

export function SuperAdminOverviewView({ data }: { data: SuperAdminOverviewData }) {
    const [activeTab, setActiveTab] = useState<"students" | "instructors" | "create">("students");
    const [highlightTrigger, setHighlightTrigger] = useState(0);
    const [studentSearch, setStudentSearch] = useState("");
    const [studentTrackFilter, setStudentTrackFilter] = useState<"ALL" | "INTERMEDIATE" | "BEGINNER">("ALL");
    const [studentGroupFilter, setStudentGroupFilter] = useState<string>("ALL");
    const [instructorSearch, setInstructorSearch] = useState("");

    // Quick Stats
    const { stats, students, instructors, groups } = data;

    const trackFilterItems = useMemo(
        () => [
            { value: "ALL", label: "All Tracks" },
            { value: "INTERMEDIATE", label: "Intermediate Only" },
            { value: "BEGINNER", label: "Beginner Only" },
        ],
        []
    );

    const groupFilterItems = useMemo(
        () => [
            { value: "ALL", label: "All Groups" },
            ...groups.map((g) => ({
                value: g.id,
                label: `${g.batchName} — ${g.name}`,
            })),
        ],
        [groups]
    );

    // Filtered Students
    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const matchesSearch =
                studentSearch.trim() === "" ||
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.id.toLowerCase().includes(studentSearch.toLowerCase());

            const matchesTrack =
                studentTrackFilter === "ALL" || s.groupType === studentTrackFilter;

            const matchesGroup =
                studentGroupFilter === "ALL" || s.groupId === studentGroupFilter;

            return matchesSearch && matchesTrack && matchesGroup;
        });
    }, [students, studentSearch, studentTrackFilter, studentGroupFilter]);

    // Filtered Instructors
    const filteredInstructors = useMemo(() => {
        return instructors.filter((ins) => {
            return (
                instructorSearch.trim() === "" ||
                ins.name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
                ins.email.toLowerCase().includes(instructorSearch.toLowerCase())
            );
        });
    }, [instructors, instructorSearch]);


    const longestGroupLabel =
        groupFilterItems.reduce(
            (longest, item) =>
                item.label.length > longest.length ? item.label : longest,
            ""
        );

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Top Banner / Hero */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/70 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-700 dark:text-gold-400 border border-gold-500/25">
                            <Crown className="size-3.5 text-gold-600 dark:text-gold-400" />
                            <span>Executive Control</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success-500/10 text-success-700 dark:text-success-400 border border-success-500/20">
                            <span className="size-1.5 rounded-full bg-success-500 animate-pulse" />
                            <span>System Operational</span>
                        </span>
                    </div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-starlight-100 mt-2">
                        Super Admin Command Deck
                    </h1>
                    <p className="mt-1 text-sm text-starlight-300">
                        Global control center for students, instructors, cohorts, and academic tracks.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setActiveTab("create");
                            setHighlightTrigger((prev) => prev + 1);
                        }}
                        className="border-gold-500/40 text-gold-700 dark:text-gold-300 hover:bg-gold-500/10 hover:text-gold-800 dark:hover:text-gold-200"
                    >
                        <UserPlus className="size-4 mr-2" />
                        Enroll Account
                    </Button>
                    <Button
                        size="sm"
                        render={<Link href="/super-admin/batches" />}
                        className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold"
                    >
                        <Layers className="size-4 mr-2" />
                        Manage Batches
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Students */}
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-gold-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Enrolled Students
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20 shadow-gold">
                            <Users className="size-4" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold tracking-tight text-starlight-100">
                            {stats.totalStudents}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-starlight-400">
                        <span className="text-gold-700 dark:text-gold-400 font-medium">
                            {stats.intermediateStudentsCount} Intermediate
                        </span>
                        <span>•</span>
                        <span className="text-violet-700 dark:text-violet-400 font-medium">
                            {stats.beginnerStudentsCount} Beginner
                        </span>
                    </div>
                </div>

                {/* Total Instructors */}
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-violet-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Active Instructors
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <GraduationCap className="size-4" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold tracking-tight text-starlight-100">
                            {stats.totalInstructors}
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-starlight-400">
                        Mentoring across all cohorts
                    </p>
                </div>

                {/* Batches & Groups */}
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-amber-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Batches & Groups
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Layers className="size-4" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold tracking-tight text-starlight-100">
                            {stats.totalBatches}
                        </span>
                        <span className="text-sm text-starlight-300 font-medium">
                            Batches / {stats.totalGroups} Groups
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-starlight-400">
                        <span className="text-gold-700 dark:text-gold-400 font-medium">{stats.intermediateGroupsCount} Levels track</span>
                        <span>•</span>
                        <span className="text-violet-700 dark:text-violet-400 font-medium">{stats.beginnerGroupsCount} Weeks track</span>
                    </div>
                </div>

                {/* Active Levels */}
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-success-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Active Levels
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-success-500/10 text-success-600 dark:text-success-400 border border-success-500/20">
                            <Sparkles className="size-4" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold tracking-tight text-starlight-100">
                            {stats.activeLevelsCount}
                        </span>
                        <span className="text-sm text-starlight-300 font-medium">
                            in progress
                        </span>
                    </div>
                    <Link
                        href="/super-admin/levels"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-gold-700 dark:text-gold-400 hover:text-gold-800 dark:hover:text-gold-300 font-medium"
                    >
                        <span>View progression</span>
                        <ArrowUpRight className="size-3" />
                    </Link>
                </div>
            </div>

            {/* Main Tabs Hub */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("students")}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                ${activeTab === "students"
                                    ? "bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/30 shadow-gold"
                                    : "text-starlight-300 hover:bg-space-850 hover:text-starlight-100 border border-transparent"
                                }
                            `}
                        >
                            <Users className="size-4" />
                            <span>Students Directory</span>
                            <Badge
                                variant="secondary"
                                className="ml-1 px-1.5 py-0.2 text-[10px] bg-space-800 text-starlight-200"
                            >
                                {students.length}
                            </Badge>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("instructors")}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                ${activeTab === "instructors"
                                    ? "bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/30 shadow-gold"
                                    : "text-starlight-300 hover:bg-space-850 hover:text-starlight-100 border border-transparent"
                                }
                            `}
                        >
                            <GraduationCap className="size-4" />
                            <span>Instructors</span>
                            <Badge
                                variant="secondary"
                                className="ml-1 px-1.5 py-0.2 text-[10px] bg-space-800 text-starlight-200"
                            >
                                {instructors.length}
                            </Badge>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("create")
                                setHighlightTrigger((prev) => prev + 1);
                            }}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                ${activeTab === "create"
                                    ? "bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/30 shadow-gold"
                                    : "text-starlight-300 hover:bg-space-850 hover:text-starlight-100 border border-transparent"
                                }
                            `}
                        >
                            <UserPlus className="size-4" />
                            <span>Account Creation Hub</span>
                        </button>
                    </div>
                </div>

                {/* TAB 1: STUDENTS DIRECTORY */}
                {activeTab === "students" && (
                    <div className="space-y-4">
                        {/* Filters & Search */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                                <Input
                                    placeholder="Search student by name, email, or code (e.g. NST-1001)..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="pl-9 bg-space-900/60 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50"
                                />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Select
                                    items={trackFilterItems}
                                    value={studentTrackFilter}
                                    onValueChange={(val) =>
                                        setStudentTrackFilter(
                                            (val ?? "ALL") as "ALL" | "INTERMEDIATE" | "BEGINNER"
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "h-10 min-w-[130px] rounded-xl px-3 text-xs font-medium transition-all duration-200 focus-visible:border-gold-500/50",
                                            studentTrackFilter !== "ALL"
                                                ? "border-gold-500/60 bg-gold-500/15 text-gold-700 dark:text-gold-300 shadow-gold font-semibold ring-1 ring-gold-500/30 [&_svg]:text-gold-400"
                                                : "border-border/80 bg-space-900/90 text-starlight-200 hover:border-border"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {studentTrackFilter !== "ALL" && (
                                                <span className="size-1.5 rounded-full bg-gold-400 shrink-0 shadow-xs" />
                                            )}
                                            <SelectValue placeholder="All Tracks" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-space-900 border-border/80 text-starlight-100">
                                        {trackFilterItems.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    items={groupFilterItems}
                                    value={studentGroupFilter ?? "ALL"}
                                    onValueChange={(val) => setStudentGroupFilter(val ?? "ALL")}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "h-10 min-w-[140px] rounded-xl px-3 text-xs font-medium transition-all duration-200 focus-visible:border-gold-500/50",
                                            studentGroupFilter !== "ALL"
                                                ? "border-gold-500/60 bg-gold-500/15 text-gold-700 dark:text-gold-300 shadow-gold font-semibold ring-1 ring-gold-500/30 [&_svg]:text-gold-400"
                                                : "border-border/80 bg-space-900/90 text-starlight-200 hover:border-border"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {studentGroupFilter !== "ALL" && (
                                                <span className="size-1.5 rounded-full bg-gold-400 shrink-0 shadow-xs" />
                                            )}
                                            <div className="relative">
                                                {/* Determines the width */}
                                                <span className="invisible whitespace-nowrap">
                                                    {longestGroupLabel}
                                                </span>

                                                {/* Actual selected value */}
                                                <span className="absolute inset-0 flex items-center">
                                                    <SelectValue placeholder="All Groups" />
                                                </span>
                                            </div>
                                        </div>
                                    </SelectTrigger>

                                    <SelectContent className="bg-space-900 border-border/80 text-starlight-100">
                                        {groupFilterItems.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Students List */}
                        {filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 dark:bg-space-900/40 p-12 text-center backdrop-blur-md">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted dark:bg-space-850 text-muted-foreground dark:text-starlight-400 border border-border/70 mb-3">
                                    <Users className="size-6" />
                                </div>
                                <h3 className="font-display text-base font-bold text-foreground dark:text-starlight-200">
                                    {(studentSearch.trim() !== "" || studentTrackFilter !== "ALL" || studentGroupFilter !== "ALL")
                                        ? "No students match your active filters"
                                        : "No students enrolled yet"}
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground dark:text-starlight-400 max-w-sm">
                                    {(studentSearch.trim() !== "" || studentTrackFilter !== "ALL" || studentGroupFilter !== "ALL")
                                        ? "Your active search query or track/group filters returned zero results. Reset your filters to view the full directory."
                                        : "No students have been enrolled in the platform yet. Use the Account Creation Hub to add students."}
                                </p>
                                {(studentSearch.trim() !== "" || studentTrackFilter !== "ALL" || studentGroupFilter !== "ALL") && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setStudentSearch("");
                                            setStudentTrackFilter("ALL");
                                            setStudentGroupFilter("ALL");
                                        }}
                                        className="mt-4 rounded-xl border-gold-500/40 text-gold-700 dark:text-gold-300 hover:bg-gold-500/10 text-xs font-semibold shadow-xs"
                                    >
                                        <RefreshCw className="size-3 mr-1.5" />
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 dark:bg-space-900/70 backdrop-blur-md shadow-2">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-border/70 bg-muted/60 dark:bg-space-850/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-starlight-400">
                                            <tr>
                                                <th className="px-5 py-3.5">Student Code</th>
                                                <th className="px-5 py-3.5">Student</th>
                                                <th className="px-5 py-3.5">Cohort & Group</th>
                                                <th className="px-5 py-3.5">Track</th>
                                                <th className="px-5 py-3.5">ST Economy</th>
                                                <th className="px-5 py-3.5">Enrolled Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60 text-foreground dark:text-starlight-200">
                                            {filteredStudents.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="hover:bg-muted/40 dark:hover:bg-space-850/40 transition-colors"
                                                >
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <StudentCodeBadge code={s.id} />
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-foreground dark:text-starlight-100">
                                                                {s.name}
                                                            </span>
                                                            <CopyableEmail email={s.email} />
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground/90 dark:text-starlight-200">
                                                                {s.groupName}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground dark:text-starlight-400">
                                                                {s.batchName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        {s.groupType === "BEGINNER" ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                                                                Beginner Track
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/30">
                                                                Intermediate Track
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Coins className="size-3.5 text-gold-400" />
                                                            <span className="font-mono font-bold text-starlight-100">
                                                                {s.groupType === "BEGINNER"
                                                                    ? s.beginnerSt ?? 0
                                                                    : s.avgSt}
                                                            </span>
                                                            <span className="text-[10px] text-starlight-400">
                                                                {s.groupType === "BEGINNER"
                                                                    ? "ST total"
                                                                    : "avg ST"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-starlight-400 text-[11px]">
                                                        {formatDate(s.createdAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: INSTRUCTORS DIRECTORY */}
                {activeTab === "instructors" && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                            <Input
                                placeholder="Search instructor by name or email..."
                                value={instructorSearch}
                                onChange={(e) => setInstructorSearch(e.target.value)}
                                className="pl-9 bg-space-900/60 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50"
                            />
                        </div>

                        {filteredInstructors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-12 text-center backdrop-blur-md">
                                <GraduationCap className="size-10 text-starlight-400/60 mb-3" />
                                <h3 className="font-display text-base font-bold text-starlight-200">
                                    No instructors found
                                </h3>
                                <p className="mt-1 text-xs text-starlight-400 max-w-sm">
                                    {instructors.length === 0
                                        ? "No instructor accounts have been created yet. Use the Create Account tab to add instructors."
                                        : "Try searching with different terms."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredInstructors.map((ins) => {
                                    const initials =
                                        ins.name
                                            .trim()
                                            .split(/\s+/)
                                            .slice(0, 2)
                                            .map((part) => part[0]?.toUpperCase())
                                            .join("") || "IN";

                                    return (
                                        <div
                                            key={ins.id}
                                            className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-gold-500/30 transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <Avatar size="default" className="border border-gold-500/30 bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/20">
                                                        <AvatarFallback className="font-bold text-xs text-gold-400 bg-space-850">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-sm text-starlight-100 truncate">
                                                            {ins.name}
                                                        </h4>
                                                        <p className="text-[11px] text-starlight-400 font-mono truncate">
                                                            {ins.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-border/70 space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-starlight-400 font-medium">
                                                            Assigned Groups
                                                        </span>
                                                        <span className="font-bold text-starlight-200">
                                                            {ins.assignedGroups.length}
                                                        </span>
                                                    </div>

                                                    {ins.assignedGroups.length === 0 ? (
                                                        <p className="text-[11px] text-starlight-400/70 italic">
                                                            No groups assigned yet. Assign groups via the Batches tab.
                                                        </p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {ins.assignedGroups.map((g) => (
                                                                <span
                                                                    key={g.id}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-space-800 text-starlight-200 border border-border/70"
                                                                >
                                                                    <span className="text-starlight-400 font-normal">
                                                                        {g.batchName}:
                                                                    </span>
                                                                    <span>{g.name}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-starlight-400">
                                                <span>Joined {formatDate(ins.createdAt)}</span>
                                                <Link
                                                    href="/super-admin/batches"
                                                    className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 font-medium"
                                                >
                                                    <span>Assign</span>
                                                    <ArrowUpRight className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: ACCOUNT CREATION HUB */}
                {activeTab === "create" && (
                    <AccountCreationSection groups={groups} highlightTrigger={highlightTrigger} />
                )}
            </div>
        </div>
    );
}

// ============================================
// STUDENT CODE BADGE (with 1-click copy)
// ============================================

function StudentCodeBadge({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        showToast({
            title: "Copied to clipboard",
            description: `Student Code: ${code}`,
            type: "success",
        });
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Click to copy student code"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-card dark:bg-space-850 border border-gold-500/30 text-gold-700 dark:text-gold-300 hover:border-gold-500/60 hover:bg-muted dark:hover:bg-space-800 transition-all cursor-pointer shadow-xs"
        >
            <Hash className="size-3 text-gold-600 dark:text-gold-400" />
            <span>{code}</span>
            {copied ? (
                <Check className="size-3 text-emerald-500" />
            ) : (
                <Copy className="size-3 opacity-0 group-hover:opacity-100 text-muted-foreground dark:text-starlight-400 transition-opacity" />
            )}
        </button>
    );
}

function CopyableEmail({ email }: { email: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(email);
        setCopied(true);
        showToast({
            title: "Copied to clipboard",
            description: `Email: ${email}`,
            type: "success",
        });
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Click to copy student email"
            className="group inline-flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-starlight-400 font-mono hover:text-foreground dark:hover:text-starlight-200 transition-colors text-left cursor-pointer"
        >
            <Mail className="size-3 text-muted-foreground dark:text-starlight-400 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors shrink-0" />
            <span className="truncate max-w-[190px]">{email}</span>
            {copied ? (
                <Check className="size-3 text-emerald-500 shrink-0" />
            ) : (
                <Copy className="size-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground dark:text-starlight-400 shrink-0 transition-opacity" />
            )}
        </button>
    );
}

// ============================================
// ACCOUNT CREATION SECTION (Student & Instructor)
// ============================================

function AccountCreationSection({
    groups,
    highlightTrigger = 0,
}: {
    groups: GroupOption[];
    highlightTrigger?: number;
}) {
    const [accountType, setAccountType] = useState<"student" | "instructor">("student");
    const [isHighlighted, setIsHighlighted] = useState(false);
    const formBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (highlightTrigger > 0) {
            setIsHighlighted(true);

            // Give the browser and React a tick to mount or switch before scrolling
            const scrollTimer = setTimeout(() => {
                if (formBoxRef.current) {
                    formBoxRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });

                    // Focus the first available input field to streamline data entry
                    const firstInput = formBoxRef.current.querySelector<HTMLInputElement>(
                        "input:not([disabled]):not([type='hidden'])"
                    );
                    if (firstInput) {
                        firstInput.focus({ preventScroll: true });
                    }
                }
            }, 100);

            // Keep the highlight striking for 3.5s then fade out smoothly
            const highlightTimer = setTimeout(() => {
                setIsHighlighted(false);
            }, 3500);

            return () => {
                clearTimeout(scrollTimer);
                clearTimeout(highlightTimer);
            };
        }
    }, [highlightTrigger]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-4">
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-6 backdrop-blur-md shadow-2">
                    <h3 className="font-display text-base font-bold text-starlight-100 flex items-center gap-2">
                        <UserPlus className="size-4 text-gold-400" />
                        <span>Account Provisioning</span>
                    </h3>
                    <p className="mt-1 text-xs text-starlight-300 leading-relaxed">
                        Select the role you wish to create. Student accounts are identified by an NST code (which also serves as their initial password). Instructor accounts are provisioned with secure email credentials.
                    </p>

                    <div className="mt-6 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => setAccountType("student")}
                            className={`
                                flex items-center justify-between p-3.5 rounded-xl border text-left transition-all
                                ${accountType === "student"
                                    ? "bg-gold-500/10 border-gold-500/40 text-starlight-100 shadow-gold"
                                    : "bg-space-850/50 border-border/70 text-starlight-300 hover:border-border hover:bg-space-850"
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`size-8 rounded-lg flex items-center justify-center ${accountType === "student" ? "bg-gold-500/20 text-gold-400" : "bg-space-800 text-starlight-400"}`}>
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold">New Student</span>
                                    <span className="block text-[10px] text-starlight-400">Assigned to batch & group</span>
                                </div>
                            </div>
                            <ChevronRight className="size-4 text-starlight-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setAccountType("instructor")}
                            className={`
                                flex items-center justify-between p-3.5 rounded-xl border text-left transition-all
                                ${accountType === "instructor"
                                    ? "bg-gold-500/10 border-gold-500/40 text-starlight-100 shadow-gold"
                                    : "bg-space-850/50 border-border/70 text-starlight-300 hover:border-border hover:bg-space-850"
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`size-8 rounded-lg flex items-center justify-center ${accountType === "instructor" ? "bg-gold-500/20 text-gold-400" : "bg-space-800 text-starlight-400"}`}>
                                    <GraduationCap className="size-4" />
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold">New Instructor</span>
                                    <span className="block text-[10px] text-starlight-400">Platform mentor & grader</span>
                                </div>
                            </div>
                            <ChevronRight className="size-4 text-starlight-400" />
                        </button>
                    </div>
                </div>

                {/* Helpful Guidelines Card */}
                <div className="rounded-2xl border border-border/70 bg-space-900/40 p-5 backdrop-blur-md">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 block mb-1">
                        NST Authentication Notice
                    </span>

                    {/* غيرنا list-inside لـ list-outside وضفنا pl-5 */}
                    <ul className="text-xs text-starlight-400 space-y-2 list-disc list-outside pl-5 mt-2">
                        <li>
                            Student ID codes (e.g. <code className="text-gold-300">NST-1001</code>) are permanent and used for student login.
                        </li>
                        <li>
                            Intermediate students receive initial 50 ST balance per active Level.
                        </li>
                        <li>
                            Beginner students participate in weekly missions and playlists.
                        </li>
                    </ul>
                </div>
            </div>

            <div
                ref={formBoxRef}
                id="user-creation-form-box"
                className={`
                    lg:col-span-8 relative rounded-2xl transition-all duration-700 scroll-mt-24
                    ${isHighlighted
                        ? "ring-4 ring-gold-400/90 shadow-[0_0_50px_rgba(232,184,74,0.45)] scale-[1.01]"
                        : ""
                    }
                `}
            >
                {/* Glowing cosmic backdrop when highlighted */}
                {isHighlighted && (
                    <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-gold-500/40 via-amber-400/50 to-gold-500/40 blur-md -z-10 animate-pulse pointer-events-none" />
                )}

                {/* Prominent floating attention badge */}
                {isHighlighted && (
                    <div className="absolute -top-3.5 right-6 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-gold-400 to-amber-500 text-space-950 font-bold text-xs shadow-gold animate-bounce">
                        <Sparkles className="size-3.5 fill-current" />
                        <span>Add New User Here</span>
                    </div>
                )}

                {accountType === "student" ? (
                    <StudentCreationForm groups={groups} />
                ) : (
                    <InstructorCreationForm />
                )}
            </div>
        </div>
    );
}

// ============================================
// CREATE STUDENT FORM
// ============================================

function StudentCreationForm({ groups }: { groups: GroupOption[] }) {
    const groupSelectItems = useMemo(
        () =>
            groups.map((group) => ({
                value: group.id,
                label: `${group.batchName} — ${group.name} [${group.type ?? "INTERMEDIATE"}]`,
            })),
        [groups]
    );

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [id, setId] = useState("");
    const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdStudent, setCreatedStudent] = useState<{
        id: string;
        name: string;
        email: string;
        groupName: string;
    } | null>(null);
    const [copiedCredentials, setCopiedCredentials] = useState(false);

    // Auto-suggest next student code button
    function handleSuggestId() {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        setId(`NST-${randomDigits}`);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setCreatedStudent(null);
        setCopiedCredentials(false);

        if (!groupId) {
            setError("Please select a valid group.");
            return;
        }

        const trimmedId = id.trim();
        if (!/^NST-\d+$/.test(trimmedId)) {
            setError('Student ID must follow format "NST-1001" (NST- followed by numbers).');
            return;
        }

        setIsSubmitting(true);

        const result = await createStudentAction({
            id: trimmedId,
            name: name.trim(),
            email: email.trim(),
            groupId,
        });

        if (result.success && result.data) {
            const selectedGroup = groups.find((g) => g.id === groupId);
            setCreatedStudent({
                id: result.data.id,
                name: result.data.name,
                email: result.data.email,
                groupName: selectedGroup
                    ? `${selectedGroup.batchName} — ${selectedGroup.name}`
                    : "Assigned Group",
            });
            setName("");
            setEmail("");
            setId("");
        } else {
            setError(result.error ?? "Failed to create student account.");
        }

        setIsSubmitting(false);
    }

    function handleCopyCredentials() {
        if (!createdStudent) return;
        const text = `NST Student Login Credentials:\n• Name: ${createdStudent.name}\n• Email: ${createdStudent.email}\n• Student Code / Password: ${createdStudent.id}\n• Group: ${createdStudent.groupName}`;
        navigator.clipboard.writeText(text);
        setCopiedCredentials(true);
        setTimeout(() => setCopiedCredentials(false), 2500);
    }

    if (groups.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-8 text-center backdrop-blur-md">
                <Layers className="size-8 text-gold-400 mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-starlight-100">
                    No Cohorts or Groups Exist Yet
                </h3>
                <p className="mt-1 text-xs text-starlight-400 max-w-sm mx-auto">
                    Before enrolling students, create at least one Batch and Group in the Batches tab.
                </p>
                <Button
                    size="sm"
                    render={<Link href="/super-admin/batches" />}
                    className="mt-4 bg-gold-500 text-space-950 font-semibold"
                >
                    Create Batch & Group
                </Button>
            </div>
        );
    }

    return (
        <Card className="border-border/80 bg-space-900/70 backdrop-blur-md shadow-2">
            <CardHeader className="border-b border-border/70 pb-4">
                <CardTitle className="font-display text-lg text-starlight-100">
                    Enroll New Student
                </CardTitle>
                <CardDescription className="text-xs text-starlight-300">
                    Generate student identity, assign to a cohort group, and provision platform access.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Success Card with 1-click Copy */}
                {createdStudent && (
                    <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Check className="size-4 text-success-400" />
                                <span className="font-semibold text-xs text-success-300">
                                    Student Enrolled Successfully
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopyCredentials}
                                className="h-7 text-xs border-success-500/40 text-success-300 hover:bg-success-500/20"
                            >
                                {copiedCredentials ? (
                                    <>
                                        <Check className="size-3 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3 mr-1" />
                                        Copy Credentials
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-success-500/20">
                            <div>
                                <span className="text-starlight-400 block text-[10px]">Name:</span>
                                <span className="font-semibold text-starlight-100">{createdStudent.name}</span>
                            </div>
                            <div>
                                <span className="text-starlight-400 block text-[10px]">Login Code / Password:</span>
                                <span className="font-mono font-bold text-gold-400">{createdStudent.id}</span>
                            </div>
                            <div>
                                <span className="text-starlight-400 block text-[10px]">Email:</span>
                                <span className="font-mono text-starlight-200">{createdStudent.email}</span>
                            </div>
                            <div>
                                <span className="text-starlight-400 block text-[10px]">Group:</span>
                                <span className="text-starlight-200">{createdStudent.groupName}</span>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Visual Container for Account Entry (Requirement 17) */}
                    <div className="rounded-xl border border-border/90 bg-muted/30 dark:bg-space-950/60 p-5 space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                            <UserPlus className="size-4 text-gold-500 shrink-0" />
                            <div>
                                <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
                                    New Student Account Details
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                    Provide full name, student email, code ID, and cohort assignment
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <Label htmlFor="student-name" className="text-xs text-foreground/90 font-medium">
                                    Full Name
                                </Label>
                                <Input
                                    id="student-name"
                                    type="text"
                                    placeholder="e.g. Omar Youssef"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-background dark:bg-space-950/70 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="student-email" className="text-xs text-foreground/90 font-medium">
                                    Email Address
                                </Label>
                                <Input
                                    id="student-email"
                                    type="email"
                                    placeholder="student@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background dark:bg-space-950/70 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="student-id" className="text-xs text-foreground/90 font-medium">
                                    Student ID Code (NST-XXXX)
                                </Label>
                                <button
                                    type="button"
                                    onClick={handleSuggestId}
                                    className="text-[11px] text-gold-500 hover:text-gold-400 dark:text-gold-400 dark:hover:text-gold-300 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <RefreshCw className="size-2.5" />
                                    <span>Generate ID</span>
                                </button>
                            </div>
                            <Input
                                id="student-id"
                                type="text"
                                placeholder="NST-1001"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                required
                                className="bg-background dark:bg-space-950/70 border-border text-foreground dark:text-starlight-100 font-mono focus-visible:border-gold-500/50"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                This unique code will also serve as the student&apos;s initial password.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="student-group" className="text-xs text-foreground/90 font-medium">
                                Assigned Group & Cohort
                            </Label>
                            <Select
                                items={groupSelectItems}
                                value={groupId}
                                onValueChange={(val) => setGroupId(val ?? "")}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger
                                    id="student-group"
                                    className="flex h-10 w-full rounded-xl border-border bg-background dark:bg-space-950/90 px-3 py-2 text-xs font-medium text-foreground dark:text-starlight-200 focus-visible:border-gold-500/50 shadow-xs"
                                >
                                    <SelectValue placeholder="Select group & cohort" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {groupSelectItems.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold h-10"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Enrolling Student..." : "Enroll Student"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ============================================
// CREATE INSTRUCTOR FORM
// ============================================

function InstructorCreationForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdInstructor, setCreatedInstructor] = useState<{
        name: string;
        email: string;
        temporaryPassword?: string;
    } | null>(null);
    const [copiedCredentials, setCopiedCredentials] = useState(false);

    function handleGeneratePassword() {
        const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setCreatedInstructor(null);
        setCopiedCredentials(false);
        setIsSubmitting(true);

        const currentPassword = password;
        const result = await createInstructorAction({
            name: name.trim(),
            email: email.trim(),
            password,
        });

        if (result.success && result.data) {
            setCreatedInstructor({
                name: result.data.name,
                email: result.data.email,
                temporaryPassword: currentPassword,
            });
            setName("");
            setEmail("");
            setPassword("");
        } else {
            setError(result.error ?? "Failed to create instructor account.");
        }

        setIsSubmitting(false);
    }

    function handleCopyCredentials() {
        if (!createdInstructor) return;
        const text = `NST Instructor Credentials:\n• Name: ${createdInstructor.name}\n• Email: ${createdInstructor.email}\n• Password: ${createdInstructor.temporaryPassword}\n• Login: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);
        setCopiedCredentials(true);
        setTimeout(() => setCopiedCredentials(false), 2500);
    }

    return (
        <Card className="border-border/80 bg-space-900/70 backdrop-blur-md shadow-2">
            <CardHeader className="border-b border-border/70 pb-4">
                <CardTitle className="font-display text-lg text-starlight-100">
                    Create Instructor Account
                </CardTitle>
                <CardDescription className="text-xs text-starlight-300">
                    Instructors manage curriculum, grade task submissions, and guide student cohorts.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Success Card with 1-click Copy */}
                {createdInstructor && (
                    <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Check className="size-4 text-success-400" />
                                <span className="font-semibold text-xs text-success-300">
                                    Instructor Account Created
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopyCredentials}
                                className="h-7 text-xs border-success-500/40 text-success-300 hover:bg-success-500/20"
                            >
                                {copiedCredentials ? (
                                    <>
                                        <Check className="size-3 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3 mr-1" />
                                        Copy Credentials
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-success-500/20">
                            <div>
                                <span className="text-starlight-400 block text-[10px]">Name:</span>
                                <span className="font-semibold text-starlight-100">{createdInstructor.name}</span>
                            </div>
                            <div>
                                <span className="text-starlight-400 block text-[10px]">Email:</span>
                                <span className="font-mono text-starlight-100">{createdInstructor.email}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-starlight-400 block text-[10px]">Temporary Password:</span>
                                <span className="font-mono font-bold text-gold-400">{createdInstructor.temporaryPassword}</span>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Visual Container for Account Entry (Requirement 17) */}
                    <div className="rounded-xl border border-border/90 bg-muted/30 dark:bg-space-950/60 p-5 space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                            <GraduationCap className="size-4 text-gold-500 shrink-0" />
                            <div>
                                <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
                                    New Instructor Account Details
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                    Set up the instructor identity, email, and temporary credentials
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <Label htmlFor="instructor-name" className="text-xs text-foreground/90 font-medium">
                                    Instructor Full Name
                                </Label>
                                <Input
                                    id="instructor-name"
                                    type="text"
                                    placeholder="e.g. Dr. Ahmed Samir"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-background dark:bg-space-950/70 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instructor-email" className="text-xs text-foreground/90 font-medium">
                                    Email Address
                                </Label>
                                <Input
                                    id="instructor-email"
                                    type="email"
                                    placeholder="instructor@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background dark:bg-space-950/70 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="instructor-password" className="text-xs text-foreground/90 font-medium">
                                    Temporary Password
                                </Label>
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="text-[11px] text-gold-500 hover:text-gold-400 dark:text-gold-400 dark:hover:text-gold-300 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <RefreshCw className="size-2.5" />
                                    <span>Generate Password</span>
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="instructor-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-background dark:bg-space-950/70 border-border text-foreground dark:text-starlight-100 font-mono pr-10 focus-visible:border-gold-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Minimum 6 characters. You will need to share this password with the instructor.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold h-10"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating Instructor..." : "Create Instructor"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
