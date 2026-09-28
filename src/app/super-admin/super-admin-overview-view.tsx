// src/app/super-admin/super-admin-overview-view.tsx
"use client";

import { useState, useMemo } from "react";
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

export function SuperAdminOverviewView({ data }: { data: SuperAdminOverviewData }) {
    const [activeTab, setActiveTab] = useState<"students" | "instructors" | "create">("students");
    const [studentSearch, setStudentSearch] = useState("");
    const [studentTrackFilter, setStudentTrackFilter] = useState<"ALL" | "INTERMEDIATE" | "BEGINNER">("ALL");
    const [studentGroupFilter, setStudentGroupFilter] = useState<string>("ALL");
    const [instructorSearch, setInstructorSearch] = useState("");

    // Quick Stats
    const { stats, students, instructors, groups } = data;

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

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Top Banner / Hero */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/70 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/25">
                            <Crown className="size-3.5 text-gold-400" />
                            <span>Executive Control</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success-500/10 text-success-400 border border-success-500/20">
                            <span className="size-1.5 rounded-full bg-success-400 animate-pulse" />
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
                        }}
                        className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 hover:text-gold-200"
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
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-gold-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Enrolled Students
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-gold">
                            <Users className="size-4" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold tracking-tight text-starlight-100">
                            {stats.totalStudents}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-starlight-400">
                        <span className="text-gold-400 font-medium">
                            {stats.intermediateStudentsCount} Intermediate
                        </span>
                        <span>•</span>
                        <span className="text-violet-400 font-medium">
                            {stats.beginnerStudentsCount} Beginner
                        </span>
                    </div>
                </div>

                {/* Total Instructors */}
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-gold-500/30 transition-all duration-300">
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
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-gold-500/30 transition-all duration-300">
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
                        <span className="text-gold-400">{stats.intermediateGroupsCount} Levels track</span>
                        <span>•</span>
                        <span className="text-violet-400">{stats.beginnerGroupsCount} Weeks track</span>
                    </div>
                </div>

                {/* Active Levels */}
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-5 backdrop-blur-md shadow-2 hover:border-gold-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Active Levels
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-success-500/10 text-success-400 border border-success-500/20">
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
                        className="mt-2 inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 font-medium"
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
                                ${
                                    activeTab === "students"
                                        ? "bg-gold-500/15 text-gold-300 border border-gold-500/30 shadow-gold"
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
                                ${
                                    activeTab === "instructors"
                                        ? "bg-gold-500/15 text-gold-300 border border-gold-500/30 shadow-gold"
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
                            onClick={() => setActiveTab("create")}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                ${
                                    activeTab === "create"
                                        ? "bg-gold-500/15 text-gold-300 border border-gold-500/30 shadow-gold"
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
                                <select
                                    value={studentTrackFilter}
                                    onChange={(e) =>
                                        setStudentTrackFilter(
                                            e.target.value as "ALL" | "INTERMEDIATE" | "BEGINNER"
                                        )
                                    }
                                    className="h-10 rounded-xl border border-border/80 bg-space-900/90 px-3 text-xs font-medium text-starlight-200 focus:outline-hidden focus:border-gold-500/50"
                                >
                                    <option value="ALL">All Tracks</option>
                                    <option value="INTERMEDIATE">Intermediate Only</option>
                                    <option value="BEGINNER">Beginner Only</option>
                                </select>

                                <select
                                    value={studentGroupFilter}
                                    onChange={(e) => setStudentGroupFilter(e.target.value)}
                                    className="h-10 max-w-[200px] truncate rounded-xl border border-border/80 bg-space-900/90 px-3 text-xs font-medium text-starlight-200 focus:outline-hidden focus:border-gold-500/50"
                                >
                                    <option value="ALL">All Groups</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.batchName} — {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Students List */}
                        {filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-12 text-center backdrop-blur-md">
                                <Users className="size-10 text-starlight-400/60 mb-3" />
                                <h3 className="font-display text-base font-bold text-starlight-200">
                                    No students match your filter
                                </h3>
                                <p className="mt-1 text-xs text-starlight-400 max-w-sm">
                                    {students.length === 0
                                        ? "No students have been enrolled in the platform yet. Use the Create Account tab to add students."
                                        : "Try clearing search keywords or changing the track/group filters."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-border/80 bg-space-900/70 backdrop-blur-md shadow-2">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-border/70 bg-space-850/60 text-[11px] font-bold uppercase tracking-wider text-starlight-400">
                                            <tr>
                                                <th className="px-5 py-3.5">Student Code</th>
                                                <th className="px-5 py-3.5">Student</th>
                                                <th className="px-5 py-3.5">Cohort & Group</th>
                                                <th className="px-5 py-3.5">Track</th>
                                                <th className="px-5 py-3.5">ST Economy</th>
                                                <th className="px-5 py-3.5">Enrolled Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60 text-starlight-200">
                                            {filteredStudents.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="hover:bg-space-850/40 transition-colors"
                                                >
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <StudentCodeBadge code={s.id} />
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-starlight-100">
                                                                {s.name}
                                                            </span>
                                                            <span className="text-[11px] text-starlight-400 font-mono">
                                                                {s.email}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-starlight-200">
                                                                {s.groupName}
                                                            </span>
                                                            <span className="text-[10px] text-starlight-400">
                                                                {s.batchName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        {s.groupType === "BEGINNER" ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                                                Beginner Track
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gold-500/15 text-gold-300 border border-gold-500/30">
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
                        <div className="relative max-w-md">
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
                    <AccountCreationSection groups={groups} />
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
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Click to copy student code"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-space-850 border border-gold-500/25 text-gold-300 hover:border-gold-500/50 hover:bg-space-800 transition-all cursor-pointer"
        >
            <Hash className="size-3 text-gold-400" />
            <span>{code}</span>
            {copied ? (
                <Check className="size-3 text-success-400" />
            ) : (
                <Copy className="size-3 opacity-0 group-hover:opacity-100 text-starlight-400 transition-opacity" />
            )}
        </button>
    );
}

// ============================================
// ACCOUNT CREATION SECTION (Student & Instructor)
// ============================================

function AccountCreationSection({ groups }: { groups: GroupOption[] }) {
    const [accountType, setAccountType] = useState<"student" | "instructor">("student");

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
                                ${
                                    accountType === "student"
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
                                ${
                                    accountType === "instructor"
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
                    <ul className="text-xs text-starlight-400 space-y-2 list-disc list-inside mt-2">
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

            <div className="lg:col-span-8">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="student-name" className="text-xs text-starlight-300">
                                Full Name
                            </Label>
                            <Input
                                id="student-name"
                                type="text"
                                placeholder="e.g. Omar Tarek"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-space-950/70 border-border/80 text-starlight-100 focus-visible:border-gold-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="student-email" className="text-xs text-starlight-300">
                                Email Address
                            </Label>
                            <Input
                                id="student-email"
                                type="email"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-space-950/70 border-border/80 text-starlight-100 focus-visible:border-gold-500/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="student-id" className="text-xs text-starlight-300">
                                Student ID Code (NST-XXXX)
                            </Label>
                            <button
                                type="button"
                                onClick={handleSuggestId}
                                className="text-[11px] text-gold-400 hover:text-gold-300 hover:underline flex items-center gap-1"
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
                            className="bg-space-950/70 border-border/80 text-starlight-100 font-mono focus-visible:border-gold-500/50"
                        />
                        <p className="text-[11px] text-starlight-400">
                            This unique code will also serve as the student&apos;s initial password.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="student-group" className="text-xs text-starlight-300">
                            Assigned Group & Cohort
                        </Label>
                        <select
                            id="student-group"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            required
                            className="flex h-10 w-full rounded-xl border border-border/80 bg-space-950/90 px-3 py-2 text-xs font-medium text-starlight-200 outline-none focus-visible:border-gold-500/50 shadow-xs"
                        >
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.batchName} — {group.name} [{group.type ?? "INTERMEDIATE"}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="text-xs font-medium text-error-400 bg-error-500/10 border border-error-500/20 p-2.5 rounded-lg">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="instructor-name" className="text-xs text-starlight-300">
                            Instructor Full Name
                        </Label>
                        <Input
                            id="instructor-name"
                            type="text"
                            placeholder="e.g. Dr. Ahmed Samir"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-space-950/70 border-border/80 text-starlight-100 focus-visible:border-gold-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructor-email" className="text-xs text-starlight-300">
                            Email Address
                        </Label>
                        <Input
                            id="instructor-email"
                            type="email"
                            placeholder="instructor@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-space-950/70 border-border/80 text-starlight-100 focus-visible:border-gold-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="instructor-password" className="text-xs text-starlight-300">
                                Temporary Password
                            </Label>
                            <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="text-[11px] text-gold-400 hover:text-gold-300 hover:underline flex items-center gap-1"
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
                                className="bg-space-950/70 border-border/80 text-starlight-100 font-mono pr-10 focus-visible:border-gold-500/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-starlight-400 hover:text-starlight-200"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-[11px] text-starlight-400">
                            Minimum 6 characters. You will need to share this password with the instructor.
                        </p>
                    </div>

                    {error && (
                        <p className="text-xs font-medium text-error-400 bg-error-500/10 border border-error-500/20 p-2.5 rounded-lg">
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
