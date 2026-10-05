// src/app/super-admin/levels/level-management-view.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
    Sparkles, Layers, Plus, AlertTriangle, Calendar,
    Search, BookOpen, Compass, Users, GraduationCap, ChevronRight,
    ChevronDown, FileText, X, ArrowLeft, Coins, Hash, Mail, Target,
    Activity, Globe, Filter, SortAsc, SortDesc, Eye, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { showToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLevelAction } from "@/lib/actions/level-management";
import type { BatchWithGroupsAndLevels } from "@/types/types";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type {
    LevelsIntelligenceData, LevelsIntelligenceGroupRow,
    LevelsIntelligenceStudentRow, LevelsIntelligenceInstructorRow,
    LevelsIntelligenceBatchRow, LevelsIntelligenceLevelRow,
} from "@/lib/data/get-levels-intelligence";

// ── MAIN VIEW ────────────────────────────────────────────────────────────────

export function LevelManagementView({
    batches, intelligence,
}: {
    batches: BatchWithGroupsAndLevels[];
    intelligence: LevelsIntelligenceData;
}) {
    type ViewMode = "overview" | "group" | "student" | "instructor";
    const [viewMode, setViewMode] = useState<ViewMode>("overview");
    const [selectedGroup, setSelectedGroup] = useState<LevelsIntelligenceGroupRow | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<LevelsIntelligenceStudentRow | null>(null);
    const [selectedInstructor, setSelectedInstructor] = useState<LevelsIntelligenceInstructorRow | null>(null);
    const [showCreateLevel, setShowCreateLevel] = useState(false);
    const [globalSearch, setGlobalSearch] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [groupTypeFilter, setGroupTypeFilter] = useState<"ALL" | "INTERMEDIATE" | "BEGINNER">("ALL");
    const [studentSortBy, setStudentSortBy] = useState<"name" | "avgSt" | "submissions" | "tasks">("name");
    const [studentSortDir, setStudentSortDir] = useState<"asc" | "desc">("asc");

    const { globalStats, batches: batchRows, allInstructors } = intelligence;

    const allGroups = useMemo(() => batchRows.flatMap((b) => b.groups), [batchRows]);

    const filteredBatches = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        return batchRows
            .map((batch) => ({
                ...batch,
                groups: batch.groups.filter((g) => {
                    const matchType = groupTypeFilter === "ALL" || g.type === groupTypeFilter;
                    const matchSearch = !q || g.name.toLowerCase().includes(q) ||
                        g.batchName.toLowerCase().includes(q) ||
                        g.instructors.some((i) => i.name.toLowerCase().includes(q));
                    return matchType && matchSearch;
                }),
            }))
            .filter((b) => b.groups.length > 0);
    }, [batchRows, globalSearch, groupTypeFilter]);

    const filteredStudents = useMemo(() => {
        if (!selectedGroup) return [];
        const q = studentSearch.trim().toLowerCase();
        let list = selectedGroup.students.filter(
            (s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
        );
        list = [...list].sort((a, b) => {
            let aVal: number | string = 0, bVal: number | string = 0;
            if (studentSortBy === "name") { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
            else if (studentSortBy === "avgSt") { aVal = a.avgSt; bVal = b.avgSt; }
            else if (studentSortBy === "submissions") { aVal = a.totalSubmissions; bVal = b.totalSubmissions; }
            else { aVal = a.tasksSubmitted; bVal = b.tasksSubmitted; }
            if (aVal < bVal) return studentSortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return studentSortDir === "asc" ? 1 : -1;
            return 0;
        });
        return list;
    }, [selectedGroup, studentSearch, studentSortBy, studentSortDir]);

    // Sync component view state from the current URL hash
    const syncFromHash = useCallback(() => {
        if (typeof window === "undefined") return;
        const rawHash = window.location.hash.replace(/^#/, "");
        if (!rawHash || rawHash === "overview") {
            setViewMode("overview");
            setSelectedGroup(null);
            setSelectedStudent(null);
            setSelectedInstructor(null);
            return;
        }

        const params = new URLSearchParams(rawHash);
        let groupId = params.get("group");
        let studentId = params.get("student");
        let instructorId = params.get("instructor");

        // Flexible fallback if someone entered e.g. #group-xyz, #student-xyz, or direct ID/name
        if (!groupId && !studentId && !instructorId) {
            if (rawHash.startsWith("group/")) groupId = rawHash.slice(6);
            else if (rawHash.startsWith("group-")) groupId = rawHash.slice(6);
            else if (rawHash.startsWith("student/")) studentId = rawHash.slice(8);
            else if (rawHash.startsWith("student-")) studentId = rawHash.slice(8);
            else if (rawHash.startsWith("instructor/")) instructorId = rawHash.slice(11);
            else if (rawHash.startsWith("instructor-")) instructorId = rawHash.slice(11);
            else {
                const directGroup = allGroups.find(
                    (g) => g.id === rawHash || g.name.toLowerCase() === decodeURIComponent(rawHash).toLowerCase()
                );
                if (directGroup) groupId = directGroup.id;
            }
        }

        if (groupId) {
            const grp = allGroups.find(
                (g) => g.id === groupId || g.name.toLowerCase() === decodeURIComponent(groupId!).toLowerCase()
            );
            if (grp) {
                setSelectedGroup(grp);
                if (studentId) {
                    const std = grp.students.find(
                        (s) => s.id === studentId || s.name.toLowerCase() === decodeURIComponent(studentId!).toLowerCase()
                    );
                    if (std) {
                        setSelectedStudent(std);
                        setSelectedInstructor(null);
                        setViewMode("student");
                        return;
                    }
                }
                if (instructorId) {
                    const ins = allInstructors.find(
                        (i) => i.id === instructorId || i.name.toLowerCase() === decodeURIComponent(instructorId!).toLowerCase()
                    ) ?? grp.instructors.find(
                        (i) => i.id === instructorId || i.name.toLowerCase() === decodeURIComponent(instructorId!).toLowerCase()
                    );
                    if (ins) {
                        setSelectedInstructor(ins);
                        setSelectedStudent(null);
                        setViewMode("instructor");
                        return;
                    }
                }
                setSelectedStudent(null);
                setSelectedInstructor(null);
                setViewMode("group");
                return;
            }
        }

        if (studentId) {
            for (const g of allGroups) {
                const std = g.students.find(
                    (s) => s.id === studentId || s.name.toLowerCase() === decodeURIComponent(studentId!).toLowerCase()
                );
                if (std) {
                    setSelectedGroup(g);
                    setSelectedStudent(std);
                    setSelectedInstructor(null);
                    setViewMode("student");
                    return;
                }
            }
        }

        if (instructorId) {
            const ins = allInstructors.find(
                (i) => i.id === instructorId || i.name.toLowerCase() === decodeURIComponent(instructorId!).toLowerCase()
            );
            if (ins) {
                setSelectedInstructor(ins);
                setSelectedStudent(null);
                setSelectedGroup(null);
                setViewMode("instructor");
                return;
            }
        }

        setViewMode("overview");
        setSelectedGroup(null);
        setSelectedStudent(null);
        setSelectedInstructor(null);
    }, [allGroups, allInstructors]);

    // Listen to hash and popstate changes (browser Back / Forward buttons)
    useEffect(() => {
        syncFromHash();

        const onPopState = () => {
            syncFromHash();
        };

        window.addEventListener("popstate", onPopState);
        window.addEventListener("hashchange", onPopState);

        return () => {
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("hashchange", onPopState);
        };
    }, [syncFromHash]);

    const goToGroup = useCallback((group: LevelsIntelligenceGroupRow) => {
        setSelectedGroup(group);
        setSelectedStudent(null);
        setSelectedInstructor(null);
        setStudentSearch("");
        setViewMode("group");
        if (typeof window !== "undefined") {
            window.history.pushState(null, "", `#group=${encodeURIComponent(group.id)}`);
        }
    }, []);

    const goToStudent = useCallback((student: LevelsIntelligenceStudentRow) => {
        setSelectedStudent(student);
        setSelectedInstructor(null);
        setViewMode("student");
        if (typeof window !== "undefined") {
            const hash = selectedGroup
                ? `#group=${encodeURIComponent(selectedGroup.id)}&student=${encodeURIComponent(student.id)}`
                : `#student=${encodeURIComponent(student.id)}`;
            window.history.pushState(null, "", hash);
        }
    }, [selectedGroup]);

    const goToInstructor = useCallback((instructor: LevelsIntelligenceInstructorRow) => {
        const enriched = allInstructors.find((i) => i.id === instructor.id) ?? instructor;
        setSelectedInstructor(enriched);
        setSelectedStudent(null);
        setViewMode("instructor");
        if (typeof window !== "undefined") {
            const hash = selectedGroup
                ? `#group=${encodeURIComponent(selectedGroup.id)}&instructor=${encodeURIComponent(enriched.id)}`
                : `#instructor=${encodeURIComponent(enriched.id)}`;
            window.history.pushState(null, "", hash);
        }
    }, [allInstructors, selectedGroup]);

    const goBack = useCallback(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            window.history.back();
        } else {
            if (viewMode === "student" || viewMode === "instructor") {
                if (selectedGroup) {
                    if (typeof window !== "undefined") {
                        window.history.pushState(null, "", `#group=${encodeURIComponent(selectedGroup.id)}`);
                    }
                    setSelectedStudent(null);
                    setSelectedInstructor(null);
                    setViewMode("group");
                } else {
                    if (typeof window !== "undefined") {
                        window.history.pushState(null, "", window.location.pathname);
                    }
                    setSelectedStudent(null);
                    setSelectedInstructor(null);
                    setViewMode("overview");
                }
            } else {
                if (typeof window !== "undefined") {
                    window.history.pushState(null, "", window.location.pathname);
                }
                setSelectedGroup(null);
                setViewMode("overview");
            }
        }
    }, [viewMode, selectedGroup]);

    const allGroupsForForm = useMemo(() =>
        batches.flatMap((batch) => batch.groups.map((group) => ({ ...group, batchName: batch.name }))),
        [batches]
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/70 pb-6">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/25">
                            <Sparkles className="size-3.5 text-gold-400" />
                            <span>Intelligence Center</span>
                        </span>
                        {viewMode !== "overview" && (
                            <button type="button" onClick={goBack}
                                className="inline-flex items-center gap-1 text-xs text-starlight-400 hover:text-starlight-100 transition-colors">
                                <ArrowLeft className="size-3.5" /><span>Back</span>
                            </button>
                        )}
                    </div>
                    {/* Breadcrumb */}
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-starlight-400">
                        <button type="button"
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    window.history.pushState(null, "", window.location.pathname);
                                }
                                setViewMode("overview");
                                setSelectedGroup(null);
                                setSelectedStudent(null);
                                setSelectedInstructor(null);
                            }}
                            className={cn("hover:text-starlight-100 transition-colors", viewMode === "overview" && "text-gold-400 font-semibold")}>
                            Levels & Groups
                        </button>
                        {selectedGroup && (<><ChevronRight className="size-3.5" />
                            <button type="button"
                                onClick={() => {
                                    if (selectedGroup && typeof window !== "undefined") {
                                        window.history.pushState(null, "", `#group=${encodeURIComponent(selectedGroup.id)}`);
                                    }
                                    setViewMode("group");
                                    setSelectedStudent(null);
                                    setSelectedInstructor(null);
                                }}
                                className={cn("hover:text-starlight-100 transition-colors", viewMode === "group" && "text-gold-400 font-semibold")}>
                                {selectedGroup.name}
                            </button></>)}
                        {selectedStudent && (<><ChevronRight className="size-3.5" /><span className="text-starlight-200 font-semibold">{selectedStudent.name}</span></>)}
                        {selectedInstructor && (<><ChevronRight className="size-3.5" /><span className="text-starlight-200 font-semibold">{selectedInstructor.name}</span></>)}
                    </div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-starlight-100 mt-2">
                        {viewMode === "overview" && "Level & Group Intelligence Center"}
                        {viewMode === "group" && selectedGroup?.name}
                        {viewMode === "student" && selectedStudent?.name}
                        {viewMode === "instructor" && selectedInstructor?.name}
                    </h1>
                    <p className="mt-1 text-sm text-starlight-300">
                        {viewMode === "overview" && "Complete visibility into every level, group, student, and instructor across NST."}
                        {viewMode === "group" && `${selectedGroup?.batchName} · ${selectedGroup?.type === "INTERMEDIATE" ? "Intermediate Track" : "Beginner Track"}`}
                        {viewMode === "student" && `Student in ${selectedGroup?.name} · ${selectedGroup?.batchName}`}
                        {viewMode === "instructor" && "Instructor profile and teaching overview"}
                    </p>
                </div>
                <Button size="sm" onClick={() => setShowCreateLevel(true)} className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold">
                    <Plus className="size-4 mr-1.5" /><span>Create Level</span>
                </Button>
            </div>

            {/* CREATE LEVEL DIALOG */}
            <Dialog open={showCreateLevel} onOpenChange={setShowCreateLevel}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-gold-500/10 text-gold-500 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="font-display text-base text-foreground dark:text-starlight-100">Create Level & Advance Cohorts</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">Define the level title, sequence number, and select intermediate cohorts to progress.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <CreateLevelForm groups={allGroupsForForm} onCreated={() => setShowCreateLevel(false)} onCancel={() => setShowCreateLevel(false)} />
                </DialogContent>
            </Dialog>

            {/* GLOBAL STATS BAR */}
            <GlobalStatsBar stats={globalStats} />

            {/* MAIN CONTENT SWITCHING */}
            {viewMode === "overview" && (
                <OverviewView filteredBatches={filteredBatches} allBatches={batchRows}
                    globalSearch={globalSearch} setGlobalSearch={setGlobalSearch}
                    groupTypeFilter={groupTypeFilter} setGroupTypeFilter={setGroupTypeFilter}
                    onSelectGroup={goToGroup} />
            )}
            {viewMode === "group" && selectedGroup && (
                <GroupDetailView group={selectedGroup} filteredStudents={filteredStudents}
                    studentSearch={studentSearch} setStudentSearch={setStudentSearch}
                    studentSortBy={studentSortBy} setStudentSortBy={setStudentSortBy}
                    studentSortDir={studentSortDir} setStudentSortDir={setStudentSortDir}
                    onSelectStudent={goToStudent} onSelectInstructor={goToInstructor} />
            )}
            {viewMode === "student" && selectedStudent && selectedGroup && (
                <StudentDetailView student={selectedStudent} group={selectedGroup} />
            )}
            {viewMode === "instructor" && selectedInstructor && (
                <InstructorDetailView instructor={selectedInstructor} allGroups={allGroups} onSelectGroup={goToGroup} />
            )}
        </div>
    );
}

// ── GLOBAL STATS BAR ─────────────────────────────────────────────────────────

function GlobalStatsBar({ stats }: { stats: LevelsIntelligenceData["globalStats"] }) {
    const cards = [
        { label: "Total Students", value: stats.totalStudents, sub: `${stats.intermediateGroups} Level groups · ${stats.beginnerGroups} Week groups`, icon: Users, color: "text-gold-400", bg: "bg-gold-500/10 border-gold-500/20", boreder: "hover:border-gold-500/60" },
        { label: "Active Levels", value: stats.totalActiveLevels, sub: `${stats.totalLevelsEver} ever created`, icon: Sparkles, color: "text-success-400", bg: "bg-success-500/10 border-success-500/20", boreder: "hover:border-success-500/60" },
        { label: "Instructors", value: stats.totalInstructors, sub: `Across ${stats.totalGroups} groups`, icon: GraduationCap, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", boreder: "hover:border-violet-500/60" },
        { label: "Sessions", value: stats.totalSessions, sub: `${stats.totalTasks} tasks defined`, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", boreder: "hover:border-blue-500/60" },
        { label: "Submissions", value: stats.totalSubmissions, sub: `${stats.gradedSubmissions} graded`, icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", boreder: "hover:border-amber-500/60" },
        { label: "Avg ST Score", value: stats.avgStudentSt !== null ? `${stats.avgStudentSt}` : "—", sub: "Across all students", icon: Coins, color: "text-gold-400", bg: "bg-gold-500/10 border-gold-500/20", boreder: "hover:border-gold-500/60" },
    ];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map((card) => (
                <div key={card.label} className={`rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md transition-all duration-200 ${card.boreder}`}>
                    <div className={cn("size-8 rounded-xl flex items-center justify-center border mb-3", card.bg)}>
                        <card.icon className={cn("size-4", card.color)} />
                    </div>
                    <p className="font-display text-2xl font-bold text-starlight-100">{card.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-starlight-400 mt-0.5">{card.label}</p>
                    <p className="text-[11px] text-starlight-400/80 mt-1">{card.sub}</p>
                </div>
            ))}
        </div>
    );
}

// ── OVERVIEW VIEW ─────────────────────────────────────────────────────────────

function OverviewView({
    filteredBatches, allBatches, globalSearch, setGlobalSearch,
    groupTypeFilter, setGroupTypeFilter, onSelectGroup,
}: {
    filteredBatches: LevelsIntelligenceBatchRow[];
    allBatches: LevelsIntelligenceBatchRow[];
    globalSearch: string;
    setGlobalSearch: (v: string) => void;
    groupTypeFilter: "ALL" | "INTERMEDIATE" | "BEGINNER";
    setGroupTypeFilter: (v: "ALL" | "INTERMEDIATE" | "BEGINNER") => void;
    onSelectGroup: (g: LevelsIntelligenceGroupRow) => void;
}) {
    const totalGroups = allBatches.reduce((acc, b) => acc + b.groups.length, 0);
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                    <Input placeholder="Search batches, groups, or instructors..."
                        value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)}
                        className="pl-9 bg-space-900/60 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50" />
                    {globalSearch && (
                        <button type="button" onClick={() => setGlobalSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-starlight-400 hover:text-starlight-100">
                            <X className="size-4" />
                        </button>
                    )}
                </div>
                <Select value={groupTypeFilter} onValueChange={(v) => setGroupTypeFilter(v as typeof groupTypeFilter)}>
                    <SelectTrigger className="w-full sm:w-44 bg-space-900/60 border-border/80 text-starlight-100">
                        <Filter className="size-3.5 mr-2 text-starlight-400" />
                        <SelectValue placeholder="Track" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Tracks</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-starlight-300">Batches & Groups</h2>
                <span className="text-xs text-starlight-400 font-mono">{totalGroups} groups total</span>
            </div>
            {filteredBatches.length === 0 ? (
                <EmptyState icon={Layers} title="No groups found"
                    description={globalSearch ? "No results match your search." : "No batches or groups exist yet."} />
            ) : (
                <div className="space-y-8">
                    {filteredBatches.map((batch) => (
                        <BatchSection key={batch.id} batch={batch} onSelectGroup={onSelectGroup} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── BATCH SECTION ─────────────────────────────────────────────────────────────

function BatchSection({ batch, onSelectGroup }: { batch: LevelsIntelligenceBatchRow; onSelectGroup: (g: LevelsIntelligenceGroupRow) => void }) {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div className="space-y-3">
            <button type="button" onClick={() => setCollapsed((c) => !c)}
                className="w-full flex items-center justify-between rounded-xl border border-border/70 bg-space-900/60 px-4 py-3 hover:border-gold-500/30 transition-all">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center">
                        <Layers className="size-4" />
                    </div>
                    <div className="text-left">
                        <p className="font-display text-sm font-bold text-starlight-100">{batch.name}</p>
                        <p className="text-[11px] text-starlight-400">{batch.groupCount} groups · {batch.studentCount} students</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        {batch.intermediateGroupCount > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30">
                                {batch.intermediateGroupCount} Intermediate
                            </span>
                        )}
                        {batch.beginnerGroupCount > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                {batch.beginnerGroupCount} Beginner
                            </span>
                        )}
                    </div>
                    {collapsed ? <ChevronRight className="size-4 text-starlight-400" /> : <ChevronDown className="size-4 text-starlight-400" />}
                </div>
            </button>
            {!collapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pl-2">
                    {batch.groups.map((group) => (
                        <GroupCard key={group.id} group={group} onSelect={() => onSelectGroup(group)} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── GROUP CARD ────────────────────────────────────────────────────────────────

function GroupCard({ group, onSelect }: { group: LevelsIntelligenceGroupRow; onSelect: () => void }) {
    const isIntermediate = group.type === "INTERMEDIATE";
    const hasActiveLevel = !!group.activeLevel;
    const completionRate = group.stats.totalTasks > 0
        ? Math.round((group.stats.totalSubmissions / group.stats.totalTasks) * 100)
        : null;

    return (
        <button type="button" onClick={onSelect}
            className={`w-full text-left rounded-2xl border border-border/70 bg-space-950/60 p-4 space-y-3 transition-all duration-200 group ${isIntermediate ? "hover:border-gold-500/30" : "hover:border-violet-500/30"}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("size-8 shrink-0 rounded-xl flex items-center justify-center border",
                        isIntermediate ? "bg-gold-500/10 border-gold-500/30 text-gold-400" : "bg-violet-500/10 border-violet-500/30 text-violet-400")}>
                        {isIntermediate ? <Layers className="size-4" /> : <Compass className="size-4" />}
                    </div>
                    <div className="min-w-0">
                        <p className={`font-semibold text-sm text-starlight-100 truncate transition-colors ${isIntermediate ? "group-hover:text-gold-300" : "group-hover:text-violet-300"}`}>{group.name}</p>
                        <p className="text-[10px] text-starlight-400">{group.batchName}</p>
                    </div>
                </div>
                <span className={cn("shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    isIntermediate ? "bg-gold-500/15 text-gold-300 border-gold-500/30" : "bg-violet-500/15 text-violet-300 border-violet-500/30")}>
                    {isIntermediate ? "Intermediate" : "Beginner"}
                </span>
            </div>
            {isIntermediate ? (
                <div className={cn("rounded-lg p-2.5 text-xs",
                    hasActiveLevel ? "bg-gold-500/10 border border-gold-500/25" : "bg-space-900/60 border border-dashed border-amber-500/30")}>
                    {hasActiveLevel ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-gold-400 shrink-0" />
                                <span className="font-semibold text-gold-300">Level {group.activeLevel!.levelNumber}</span>
                                <span className="text-starlight-300 truncate max-w-[120px]">{group.activeLevel!.name}</span>
                            </div>
                            <span className="text-[10px] text-starlight-400 shrink-0">{group.stats.completedLevels} prev</span>
                        </div>
                    ) : (
                        <span className="text-amber-300 flex items-center gap-1.5"><AlertTriangle className="size-3.5 shrink-0" />No Active Level</span>
                    )}
                </div>
            ) : (
                <div className="rounded-lg p-2.5 text-xs bg-violet-500/10 border border-violet-500/20">
                    <span className="text-violet-300 flex items-center gap-1.5"><Globe className="size-3.5 shrink-0" />Managed via Weekly Missions</span>
                </div>
            )}
            <div className="grid grid-cols-3 gap-2">
                <StatPill icon={Users} value={group.studentCount} label="Students" />
                <StatPill icon={GraduationCap} value={group.instructors.length} label="Instructors" />
                {isIntermediate
                    ? <StatPill icon={BookOpen} value={group.stats.totalLevels} label="Levels" />
                    : <StatPill icon={Activity} value={group.stats.totalTasks} label="Tasks" />}
            </div>
            {completionRate !== null && group.stats.totalTasks > 0 && (
                <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-[10px] text-starlight-400 mb-1">
                        <span>Submissions</span><span>{completionRate}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-space-800 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                            completionRate >= 75 ? "bg-success-400" : completionRate >= 40 ? "bg-gold-400" : "bg-amber-500")}
                            style={{ width: `${Math.min(100, completionRate)}%` }} />
                    </div>
                </div>
            )}
            {isIntermediate && group.stats.avgStudentSt !== null && (
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-starlight-400">Avg ST Score</span>
                    <span className="font-semibold text-gold-300">{group.stats.avgStudentSt} ST</span>
                </div>
            )}
            <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="text-starlight-400 truncate max-w-[180px]">
                    {group.instructors.length > 0 ? group.instructors.map((i) => i.name).join(", ") : "No instructors assigned"}
                </span>
                <span className="text-gold-400 font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all shrink-0">
                    View <ChevronRight className="size-3.5" />
                </span>
            </div>
        </button>
    );
}

// ── GROUP DETAIL VIEW ─────────────────────────────────────────────────────────

function GroupDetailView({
    group, filteredStudents, studentSearch, setStudentSearch,
    studentSortBy, setStudentSortBy, studentSortDir, setStudentSortDir,
    onSelectStudent, onSelectInstructor,
}: {
    group: LevelsIntelligenceGroupRow;
    filteredStudents: LevelsIntelligenceStudentRow[];
    studentSearch: string;
    setStudentSearch: (v: string) => void;
    studentSortBy: "name" | "avgSt" | "submissions" | "tasks";
    setStudentSortBy: (v: "name" | "avgSt" | "submissions" | "tasks") => void;
    studentSortDir: "asc" | "desc";
    setStudentSortDir: (v: "asc" | "desc") => void;
    onSelectStudent: (s: LevelsIntelligenceStudentRow) => void;
    onSelectInstructor: (i: LevelsIntelligenceInstructorRow) => void;
}) {
    const isIntermediate = group.type === "INTERMEDIATE";
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Students" value={group.studentCount} icon={Users} color="gold" />
                <StatCard label="Instructors" value={group.instructors.length} icon={GraduationCap} color="violet" />
                {isIntermediate ? (
                    <>
                        <StatCard label="Levels (Total)" value={group.stats.totalLevels} icon={Layers} color="blue" />
                        <StatCard label="Avg ST Score" value={group.stats.avgStudentSt !== null ? `${group.stats.avgStudentSt}` : "—"} icon={Coins} color="gold" />
                    </>
                ) : (
                    <>
                        <StatCard label="Total Tasks" value={group.stats.totalTasks} icon={Target} color="blue" />
                        <StatCard label="Submissions" value={group.stats.totalSubmissions} icon={FileText} color="amber" />
                    </>
                )}
            </div>
            {isIntermediate && group.allLevels.length > 0 && <LevelsHistorySection levels={group.allLevels} />}
            <Tabs defaultValue="students" className="space-y-4">
                <TabsList className="bg-space-900/80 border border-border/70">
                    <TabsTrigger value="students" className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300">
                        <Users className="size-3.5 mr-1.5" />Students ({group.studentCount})
                    </TabsTrigger>
                    <TabsTrigger value="instructors" className="data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-300">
                        <GraduationCap className="size-3.5 mr-1.5" />Instructors ({group.instructors.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                            <Input placeholder="Search by name, email, or student code..."
                                value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                                className="pl-9 bg-space-900/60 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50" />
                            {studentSearch && (
                                <button type="button" onClick={() => setStudentSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-starlight-400 hover:text-starlight-100">
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Select value={studentSortBy} onValueChange={(v) => setStudentSortBy(v as typeof studentSortBy)}>
                                <SelectTrigger className="w-36 bg-space-900/60 border-border/80 text-starlight-100">
                                    <SortAsc className="size-3.5 mr-1 text-starlight-400" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="avgSt">Avg ST</SelectItem>
                                    <SelectItem value="submissions">Submissions</SelectItem>
                                    <SelectItem value="tasks">Tasks Done</SelectItem>
                                </SelectContent>
                            </Select>
                            <button type="button"
                                onClick={() => setStudentSortDir(studentSortDir === "asc" ? "desc" : "asc")}
                                className="flex items-center justify-center size-10 rounded-lg border border-border/80 bg-space-900/60 text-starlight-400 hover:text-starlight-100 hover:border-gold-500/40 transition-all">
                                {studentSortDir === "asc" ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
                            </button>
                        </div>
                    </div>
                    {filteredStudents.length === 0 ? (
                        <EmptyState icon={Users} title="No students found"
                            description={studentSearch ? "No students match your search." : "This group has no students yet."} />
                    ) : (
                        <div className="rounded-2xl border border-border/70 bg-space-900/60 overflow-hidden">
                            <div className="hidden md:grid grid-cols-[1fr_180px_100px_100px_40px] gap-4 px-4 py-2.5 border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-starlight-400">
                                <span>Student</span><span>Progress</span><span>ST Score</span><span>Submissions</span><span></span>
                            </div>
                            <div className="divide-y divide-border/50">
                                {filteredStudents.map((student) => (
                                    <StudentRow key={student.id} student={student} isIntermediate={isIntermediate} onSelect={() => onSelectStudent(student)} />
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="instructors" className="space-y-3">
                    {group.instructors.length === 0 ? (
                        <EmptyState icon={GraduationCap} title="No instructors assigned" description="Assign instructors to this group from the Batches page." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.instructors.map((instructor) => (
                                <InstructorCard key={instructor.id} instructor={instructor} onSelect={() => onSelectInstructor(instructor)} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ── LEVELS HISTORY ────────────────────────────────────────────────────────────

function LevelsHistorySection({ levels }: { levels: LevelsIntelligenceLevelRow[] }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-starlight-300 border-b border-border/60 pb-2">Level History</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {levels.map((level) => (
                    <div key={level.id} className={cn("rounded-xl border p-4 space-y-3",
                        level.isActive ? "border-gold-500/40 bg-gold-500/5" : "border-border/60 bg-space-950/50")}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border",
                                    level.isActive ? "bg-gold-500/20 text-gold-300 border-gold-500/40" : "bg-space-800 text-starlight-400 border-border/60")}>
                                    Level {level.levelNumber}
                                </span>
                                {level.isActive && (
                                    <span className="text-[10px] font-semibold text-success-400 flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-success-400 animate-pulse" />Active
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-starlight-400">{formatDate(level.startDate)}</span>
                        </div>
                        <p className="text-sm font-semibold text-starlight-100 line-clamp-1">{level.name}</p>
                        {level.description && <p className="text-[11px] text-starlight-400 line-clamp-2">{level.description}</p>}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
                            <div className="text-center">
                                <p className="text-sm font-bold text-starlight-100">{level.sessionsCount}</p>
                                <p className="text-[9px] text-starlight-400">Sessions</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-starlight-100">{level.tasksCount}</p>
                                <p className="text-[9px] text-starlight-400">Tasks</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-starlight-100">{level.avgBalance !== null ? `${level.avgBalance}` : "—"}</p>
                                <p className="text-[9px] text-starlight-400">Avg ST</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── STUDENT ROW ───────────────────────────────────────────────────────────────

function StudentRow({ student, isIntermediate, onSelect }: {
    student: LevelsIntelligenceStudentRow; isIntermediate: boolean; onSelect: () => void;
}) {
    const progressPct = student.tasksAvailable > 0
        ? Math.round((student.tasksSubmitted / student.tasksAvailable) * 100)
        : null;
    const initials = student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <button type="button" onClick={onSelect}
            className="w-full text-left px-4 py-3 hover:bg-space-900/80 transition-colors group">
            {/* Mobile */}
            <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                            <AvatarFallback className="bg-gold-500/15 text-gold-300 text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-starlight-100 group-hover:text-gold-300 transition-colors">{student.name}</p>
                            <p className="text-[10px] text-starlight-400 font-mono">{student.id}</p>
                        </div>
                    </div>
                    <ChevronRight className="size-4 text-starlight-400 group-hover:text-gold-400 transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-starlight-400">
                    {isIntermediate && student.currentLevelSt !== null && <span className="text-gold-300 font-semibold">{student.currentLevelSt} ST</span>}
                    <span>{student.totalSubmissions} subs</span>
                    {progressPct !== null && <span>{progressPct}% tasks</span>}
                </div>
            </div>
            {/* Desktop */}
            <div className="hidden md:grid grid-cols-[1fr_180px_100px_100px_40px] gap-4 items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-gold-500/15 text-gold-300 text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-starlight-100 group-hover:text-gold-300 transition-colors truncate">{student.name}</p>
                        <p className="text-[10px] text-starlight-400 font-mono truncate">{student.email}</p>
                    </div>
                </div>
                <div className="space-y-1">
                    {progressPct !== null ? (
                        <>
                            <div className="flex items-center justify-between text-[10px] text-starlight-400">
                                <span>{student.tasksSubmitted}/{student.tasksAvailable} tasks</span>
                                <span>{progressPct}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-space-800 overflow-hidden">
                                <div className={cn("h-full rounded-full",
                                    progressPct >= 75 ? "bg-success-400" : progressPct >= 40 ? "bg-gold-400" : "bg-amber-500")}
                                    style={{ width: `${Math.min(100, progressPct)}%` }} />
                            </div>
                        </>
                    ) : <span className="text-[11px] text-starlight-400/60">—</span>}
                </div>
                <div>
                    {isIntermediate ? (
                        <><p className="text-sm font-bold text-gold-300">{student.currentLevelSt !== null ? `${student.currentLevelSt}` : "—"}</p>
                            <p className="text-[10px] text-starlight-400">avg {student.avgSt}</p></>
                    ) : (
                        <><p className="text-sm font-bold text-violet-300">{student.beginnerSt !== null ? `${student.beginnerSt}` : "—"}</p>
                            <p className="text-[10px] text-starlight-400">beginner</p></>
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold text-starlight-100">{student.totalSubmissions}</p>
                    <p className="text-[10px] text-starlight-400">{student.gradedSubmissions} graded</p>
                </div>
                <div className="flex justify-end">
                    <Eye className="size-4 text-starlight-400 group-hover:text-gold-400 transition-colors" />
                </div>
            </div>
        </button>
    );
}

// ── INSTRUCTOR CARD ───────────────────────────────────────────────────────────

function InstructorCard({ instructor, onSelect }: { instructor: LevelsIntelligenceInstructorRow; onSelect: () => void }) {
    const initials = instructor.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    return (
        <button type="button" onClick={onSelect}
            className="w-full text-left rounded-xl border border-border/70 bg-space-950/60 p-4 hover:border-violet-500/40 hover:bg-space-900/80 transition-all group">
            <div className="flex items-start gap-3">
                <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-violet-500/15 text-violet-300 text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-starlight-100 group-hover:text-violet-300 transition-colors truncate">{instructor.name}</p>
                        <ChevronRight className="size-4 text-starlight-400 group-hover:text-violet-400 transition-colors shrink-0" />
                    </div>
                    <p className="text-[11px] text-starlight-400 truncate">{instructor.email}</p>
                    <p className="text-[10px] text-starlight-400/70 mt-1">Since {formatDate(instructor.createdAt)}</p>
                </div>
            </div>
        </button>
    );
}

// ── STUDENT DETAIL VIEW ───────────────────────────────────────────────────────

function StudentDetailView({ student, group }: { student: LevelsIntelligenceStudentRow; group: LevelsIntelligenceGroupRow }) {
    const isIntermediate = group.type === "INTERMEDIATE";
    const progressPct = student.tasksAvailable > 0
        ? Math.round((student.tasksSubmitted / student.tasksAvailable) * 100)
        : null;
    const initials = student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <div className="space-y-6">
            <Card className="border-border/70 bg-space-900/70">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                        <Avatar className="size-16 shrink-0">
                            <AvatarFallback className="bg-gold-500/15 text-gold-300 text-2xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h2 className="font-display text-xl font-bold text-starlight-100">{student.name}</h2>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-starlight-400">
                                        <Hash className="size-3.5 shrink-0" /><span className="font-mono">{student.id}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-starlight-400">
                                        <Mail className="size-3.5 shrink-0" /><span>{student.email}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <DetailStatCard label="Group" value={group.name} sub={group.batchName} />
                                <DetailStatCard label="Track" value={isIntermediate ? "Intermediate" : "Beginner"} sub={isIntermediate ? "Level-based" : "Weekly"} />
                                <DetailStatCard label="Enrolled Since" value={formatDate(student.createdAt)} sub="Join date" />
                                {isIntermediate
                                    ? <DetailStatCard label="Avg ST" value={`${student.avgSt}`} sub="All levels" highlight />
                                    : <DetailStatCard label="Beginner ST" value={student.beginnerSt !== null ? `${student.beginnerSt}` : "—"} sub="Running total" highlight />}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {isIntermediate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-border/70 bg-space-900/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-starlight-300 flex items-center gap-2">
                                <Sparkles className="size-4 text-gold-400" />Current Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {group.activeLevel ? (
                                <>
                                    <div>
                                        <p className="font-display text-lg font-bold text-starlight-100">Level {group.activeLevel.levelNumber}</p>
                                        <p className="text-sm text-starlight-300">{group.activeLevel.name}</p>
                                        <p className="text-[11px] text-starlight-400 mt-1">Since {formatDate(group.activeLevel.startDate)}</p>
                                    </div>
                                    {student.currentLevelSt !== null && (
                                        <div className="rounded-lg bg-gold-500/10 border border-gold-500/25 p-3 flex items-center justify-between">
                                            <span className="text-xs text-starlight-400">Level ST Balance</span>
                                            <span className="font-display text-xl font-bold text-gold-300">{student.currentLevelSt} ST</span>
                                        </div>
                                    )}
                                </>
                            ) : <EmptyState icon={AlertTriangle} title="No active level" description="This group has no active level yet." compact />}
                        </CardContent>
                    </Card>
                    <Card className="border-border/70 bg-space-900/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-starlight-300 flex items-center gap-2">
                                <Activity className="size-4 text-blue-400" />Learning Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {progressPct !== null ? (
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-starlight-400">Task Progress</span>
                                        <span className="font-bold text-starlight-100">{progressPct}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-space-800 overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all",
                                            progressPct >= 75 ? "bg-success-400" : progressPct >= 40 ? "bg-gold-400" : "bg-amber-500")}
                                            style={{ width: `${Math.min(100, progressPct)}%` }} />
                                    </div>
                                    <p className="text-[11px] text-starlight-400 mt-2">{student.tasksSubmitted} of {student.tasksAvailable} tasks submitted</p>
                                </div>
                            ) : <p className="text-sm text-starlight-400">No task data available for active level</p>}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                <div className="text-center p-2 rounded-lg bg-space-950/60 border border-border/50">
                                    <p className="text-lg font-bold text-starlight-100">{student.totalSubmissions}</p>
                                    <p className="text-[10px] text-starlight-400">Total Subs</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-space-950/60 border border-border/50">
                                    <p className="text-lg font-bold text-success-400">{student.gradedSubmissions}</p>
                                    <p className="text-[10px] text-starlight-400">Graded</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {!isIntermediate && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard label="Beginner ST" value={student.beginnerSt !== null ? `${student.beginnerSt}` : "—"} icon={Coins} color="gold" />
                    <StatCard label="Submissions" value={student.totalSubmissions} icon={FileText} color="blue" />
                    <StatCard label="Graded" value={student.gradedSubmissions} icon={CheckCircle2} color="success" />
                </div>
            )}
            {group.instructors.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-starlight-300">Group Instructors</h3>
                    <div className="flex flex-wrap gap-2">
                        {group.instructors.map((instructor) => (
                            <div key={instructor.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs text-violet-300">
                                <GraduationCap className="size-3.5" /><span className="font-medium">{instructor.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── INSTRUCTOR DETAIL VIEW ────────────────────────────────────────────────────

function InstructorDetailView({
    instructor, allGroups, onSelectGroup,
}: {
    instructor: LevelsIntelligenceInstructorRow;
    allGroups: LevelsIntelligenceGroupRow[];
    onSelectGroup?: (g: LevelsIntelligenceGroupRow) => void;
}) {
    const assignedGroups = allGroups.filter((g) => instructor.assignedGroupIds.includes(g.id));
    const initials = instructor.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    const totalStudents = assignedGroups.reduce((acc, g) => acc + g.studentCount, 0);
    const activeGroups = assignedGroups.filter((g) => g.type === "INTERMEDIATE" ? g.activeLevel !== null : true);

    return (
        <div className="space-y-6">
            <Card className="border-border/70 bg-space-900/70">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                        <Avatar className="size-16 shrink-0">
                            <AvatarFallback className="bg-violet-500/15 text-violet-300 text-2xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="font-display text-xl font-bold text-starlight-100">{instructor.name}</h2>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">Instructor</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] text-starlight-400 mt-1">
                                    <Mail className="size-3.5 shrink-0" /><span>{instructor.email}</span>
                                </span>
                                <p className="text-[11px] text-starlight-400 mt-1">Joined {formatDate(instructor.createdAt)}</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <DetailStatCard label="Groups" value={`${assignedGroups.length}`} sub="Assigned" />
                                <DetailStatCard label="Students" value={`${totalStudents}`} sub="Supervised" highlight />
                                <DetailStatCard label="Active Groups" value={`${activeGroups.length}`} sub="With active level" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-starlight-300 border-b border-border/60 pb-2">Assigned Groups ({assignedGroups.length})</h3>
                {assignedGroups.length === 0 ? (
                    <EmptyState icon={Layers} title="No groups assigned" description="This instructor is not assigned to any groups yet." />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assignedGroups.map((group) => (
                            <div key={group.id}
                                onClick={() => onSelectGroup?.(group)}
                                className={cn(
                                    "rounded-xl border border-border/70 bg-space-950/60 p-4 space-y-3 transition-all",
                                    onSelectGroup && "cursor-pointer hover:border-gold-500/40 hover:bg-space-900/60"
                                )}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm text-starlight-100">{group.name}</p>
                                        <p className="text-[10px] text-starlight-400">{group.batchName}</p>
                                    </div>
                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                        group.type === "INTERMEDIATE" ? "bg-gold-500/15 text-gold-300 border-gold-500/30" : "bg-violet-500/15 text-violet-300 border-violet-500/30")}>
                                        {group.type === "INTERMEDIATE" ? "Intermediate" : "Beginner"}
                                    </span>
                                </div>
                                {group.type === "INTERMEDIATE" && group.activeLevel && (
                                    <div className="text-xs rounded-lg bg-gold-500/10 border border-gold-500/25 p-2.5 flex items-center gap-2">
                                        <Sparkles className="size-3.5 text-gold-400 shrink-0" />
                                        <span className="text-gold-300 font-semibold">Level {group.activeLevel.levelNumber}</span>
                                        <span className="text-starlight-300 truncate">{group.activeLevel.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-starlight-400 pt-1 border-t border-border/40">
                                    <span className="flex items-center gap-1"><Users className="size-3.5" /> {group.studentCount}</span>
                                    {group.type === "INTERMEDIATE" && <span className="flex items-center gap-1"><Layers className="size-3.5" /> {group.stats.totalLevels} levels</span>}
                                    {group.stats.avgStudentSt !== null && <span className="flex items-center gap-1 text-gold-400"><Coins className="size-3.5" /> avg {group.stats.avgStudentSt} ST</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── UTILITY COMPONENTS ────────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: number | string; label: string }) {
    return (
        <div className="rounded-lg bg-space-900/60 border border-border/50 p-2 text-center">
            <Icon className="size-3.5 text-starlight-400 mx-auto mb-0.5" />
            <p className="text-xs font-bold text-starlight-100">{value}</p>
            <p className="text-[9px] text-starlight-400">{label}</p>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: "gold" | "violet" | "blue" | "amber" | "success" }) {
    const colorMap = {
        gold: { bg: "bg-gold-500/10 border-gold-500/20", text: "text-gold-400" },
        violet: { bg: "bg-violet-500/10 border-violet-500/20", text: "text-violet-400" },
        blue: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400" },
        amber: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" },
        success: { bg: "bg-success-500/10 border-success-500/20", text: "text-success-400" },
    };
    const { bg, text } = colorMap[color];
    return (
        <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
            <div className={cn("size-8 rounded-xl flex items-center justify-center border mb-3", bg)}>
                <Icon className={cn("size-4", text)} />
            </div>
            <p className="font-display text-2xl font-bold text-starlight-100">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-starlight-400 mt-1">{label}</p>
        </div>
    );
}

function DetailStatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
    return (
        <div className="rounded-xl border border-border/60 bg-space-950/60 p-3 text-center">
            <p className={cn("font-display text-lg font-bold", highlight ? "text-gold-300" : "text-starlight-100")}>{value}</p>
            <p className="text-[11px] font-semibold text-starlight-400">{label}</p>
            <p className="text-[10px] text-starlight-400/70">{sub}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, title, description, compact }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; compact?: boolean }) {
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/50 text-center", compact ? "p-6" : "p-12")}>
            <Icon className={cn("text-starlight-400/60 mb-3", compact ? "size-7" : "size-10")} />
            <h3 className="font-display text-sm font-bold text-starlight-200">{title}</h3>
            <p className="mt-1 text-xs text-starlight-400 max-w-xs">{description}</p>
        </div>
    );
}

// ── CREATE LEVEL FORM (preserved from original) ───────────────────────────────

interface GroupForSelection {
    id: string; name: string; batchName: string;
    type?: "BEGINNER" | "INTERMEDIATE";
    activeLevel: { name: string; levelNumber: number } | null;
}

function CreateLevelForm({ groups, onCreated, onCancel }: { groups: GroupForSelection[]; onCreated?: () => void; onCancel?: () => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [levelNumber, setLevelNumber] = useState("1");
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intermediateGroups = useMemo(() => groups.filter((g) => g.type !== "BEGINNER"), [groups]);

    function toggleGroup(groupId: string) {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
            return next;
        });
    }
    function selectAllBatch(batchGroups: GroupForSelection[]) {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            const allSelected = batchGroups.every((g) => next.has(g.id));
            if (allSelected) batchGroups.forEach((g) => next.delete(g.id)); else batchGroups.forEach((g) => next.add(g.id));
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const levelNumberValue = Number(levelNumber);
        if (!Number.isInteger(levelNumberValue) || levelNumberValue <= 0) { setError("Level number must be a positive whole number."); return; }
        if (selectedGroupIds.size === 0) { setError("Select at least one Intermediate Group for this Level."); return; }
        setIsSubmitting(true);
        const result = await createLevelAction({ name: name.trim(), description: description.trim() ? description.trim() : null, levelNumber: levelNumberValue, groupIds: Array.from(selectedGroupIds) });
        setIsSubmitting(false);
        if (result.success && result.data) {
            showToast({ title: "Level Created & Launched", description: `Level "${name.trim()}" successfully activated for ${result.data.length} Group${result.data.length === 1 ? "" : "s"}.`, type: "success" });
            setName(""); setDescription(""); setLevelNumber("1"); setSelectedGroupIds(new Set()); onCreated?.();
        } else { setError(result.error ?? "Failed to create Level."); }
    }

    const groupsByBatch = useMemo(() => {
        const map = new Map<string, GroupForSelection[]>();
        for (const group of intermediateGroups) { const list = map.get(group.batchName) ?? []; list.push(group); map.set(group.batchName, list); }
        return map;
    }, [intermediateGroups]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8 space-y-1.5">
                    <Label htmlFor="level-name" className="text-xs font-semibold text-foreground/90">Level Title</Label>
                    <Input id="level-name" placeholder="e.g. Level 1: Foundations of Programming" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50" />
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                    <Label htmlFor="level-number" className="text-xs font-semibold text-foreground/90">Level Number</Label>
                    <Input id="level-number" type="number" min={1} value={levelNumber} onChange={(e) => setLevelNumber(e.target.value)} required className="bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 font-mono focus-visible:border-gold-500/50" />
                </div>
            </div>
            <div className="space-y-1.5">
                <MarkdownEditor id="level-description" label="Description & Learning Objectives (Optional)" placeholder="Briefly outline topics, algorithms, or concepts covered in this level in Markdown..." value={description} onChange={(val) => setDescription(val)} rows={4} />
            </div>
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground/90">Target Intermediate Groups ({selectedGroupIds.size} selected)</Label>
                    <span className="text-[11px] text-muted-foreground">Beginner groups excluded</span>
                </div>
                {intermediateGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 rounded-xl border border-dashed border-border bg-muted/20">No Intermediate groups available.</p>
                ) : (
                    <div className="max-h-56 space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/20 dark:bg-space-950/60 p-4">
                        {Array.from(groupsByBatch.entries()).map(([batchName, batchGroups]) => (
                            <div key={batchName} className="space-y-2">
                                <div className="flex items-center justify-between border-b border-border/60 pb-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">{batchName}</span>
                                    <button type="button" onClick={() => selectAllBatch(batchGroups)} className="text-[10px] text-muted-foreground hover:text-foreground hover:underline font-medium">Toggle All</button>
                                </div>
                                <div className="space-y-1.5 pl-1">
                                    {batchGroups.map((group) => {
                                        const isSelected = selectedGroupIds.has(group.id);
                                        return (
                                            <div key={group.id} onClick={() => toggleGroup(group.id)}
                                                className={cn("flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all",
                                                    isSelected ? "bg-gold-500/10 border-gold-500/35 text-foreground dark:text-starlight-100" : "bg-background/80 dark:bg-space-900/40 border-border/60 text-muted-foreground hover:border-border")}>
                                                <div className="flex items-center gap-2.5">
                                                    <Checkbox id={`group-${group.id}`} checked={isSelected} onCheckedChange={() => toggleGroup(group.id)} />
                                                    <span className="font-medium">{group.name}</span>
                                                </div>
                                                {group.activeLevel ? (
                                                    <span className="text-[10px] text-muted-foreground font-mono">Level {group.activeLevel.levelNumber}</span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400/80">No active level</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedGroupIds.size > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
                        <AlertTriangle className="size-4 text-amber-500 dark:text-amber-400 shrink-0" /><span>Platform Transition Notice</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground dark:text-starlight-300 leading-relaxed">
                        Activating this level will freeze the previous active level. Each student will receive a fresh Level ST balance of{" "}
                        <strong className="text-gold-600 dark:text-gold-300">50 ST</strong>. Historical data remains preserved.
                    </p>
                </div>
            )}
            {error && <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">{error}</p>}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">Cancel</Button>}
                <Button type="submit" disabled={isSubmitting || selectedGroupIds.size === 0} className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold h-10 px-6">
                    {isSubmitting ? "Activating Level..." : "Activate & Launch Level"}
                </Button>
            </div>
        </form>
    );
}
