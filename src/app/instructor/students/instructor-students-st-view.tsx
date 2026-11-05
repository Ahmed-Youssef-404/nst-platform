'use client'

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    ChevronRight,
    Coins,
    Loader2,
    Search,
    SlidersHorizontal,
    Users,
} from "lucide-react";
import { StudentAvatar } from "@/components/avatar/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { STAdjustGroup, STAdjustStudent } from "@/lib/data/get-instructor-students";
import { cn } from "@/lib/utils";
import { StAdjustDialog } from "./st-adjust-dialog";

type SortKey = "name" | "balance";
type SortDir = "asc" | "desc";

// Direction a criterion starts with when first selected.
const DEFAULT_DIR: Record<SortKey, SortDir> = { name: "asc", balance: "desc" };

const SORT_OPTIONS: { key: SortKey; label: string; hint: Record<SortDir, string> }[] = [
    { key: "name", label: "Name", hint: { asc: "A–Z", desc: "Z–A" } },
    { key: "balance", label: "ST Balance", hint: { asc: "Low–High", desc: "High–Low" } },
];

// Spinner only appears if navigation takes longer than this, so fast
// navigations don't flash it. Row highlight is still immediate.
const SPINNER_DELAY_MS = 150;

export function InstructorStudentsSTView({ groups: initialGroups }: { groups: STAdjustGroup[] }) {
    const router = useRouter();
    const [groups, setGroups] = useState(initialGroups);
    const [activeGroupId, setActiveGroupId] = useState(initialGroups[0]?.id ?? "");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<STAdjustStudent | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Navigation feedback. `isNavigating` is true until the destination route
    // commits (or the navigation fails), so it can never lock the list forever.
    const [isNavigating, startNavigation] = useTransition();
    const [navigatingId, setNavigatingId] = useState<string | null>(null);
    const [spinnerReady, setSpinnerReady] = useState(false);

    useEffect(() => {
        if (!isNavigating) return;
        const timer = setTimeout(() => setSpinnerReady(true), SPINNER_DELAY_MS);
        return () => clearTimeout(timer);
    }, [isNavigating]);

    function openProfile(student: STAdjustStudent, url: string) {
        if (isNavigating) return;
        setSpinnerReady(false);
        setNavigatingId(student.id);
        startNavigation(() => {
            router.push(url);
        });
    }

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(DEFAULT_DIR[key]);
        }
    }

    const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];

    const students = useMemo(() => {
        if (!activeGroup) return [];
        const q = query.trim().toLowerCase();
        const filtered = q
            ? activeGroup.students.filter(
                (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
            )
            : activeGroup.students;

        const byName = (a: STAdjustStudent, b: STAdjustStudent) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
        const dir = sortDir === "asc" ? 1 : -1;

        // Copy before sorting: never mutate group state.
        return [...filtered].sort((a, b) => {
            if (sortKey === "balance") {
                const diff = (a.balance - b.balance) * dir;
                return diff !== 0 ? diff : byName(a, b);
            }
            const diff = byName(a, b) * dir;
            return diff !== 0 ? diff : a.id.localeCompare(b.id);
        });
    }, [activeGroup, query, sortKey, sortDir]);

    function handleSuccess(studentId: string, balance: number) {
        setGroups((prev) =>
            prev.map((g) => ({
                ...g,
                students: g.students.map((s) => (s.id === studentId ? { ...s, balance } : s)),
            }))
        );
    }

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-gold-500/20 bg-space-850 text-gold-400 shadow-gold">
                    <Users className="size-7" />
                </div>
                <h3 className="font-display text-lg font-bold text-starlight-100">No Groups Assigned Yet</h3>
                <p className="mt-1 max-w-md text-sm text-starlight-300">
                    Once the Super Admin assigns you to a group, its students will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-starlight-100">
                    Student ST
                </h1>
                <p className="mt-1.5 text-sm text-starlight-300">
                    Add or deduct Star Tokens for students in your assigned groups. Every change is recorded in the
                    student&apos;s ST Transactions as coming from an Instructor.
                </p>
            </div>

            {/* Group picker */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Groups">
                {groups.map((group) => {
                    const isActive = group.id === activeGroup?.id;
                    return (
                        <button
                            key={group.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => {
                                setActiveGroupId(group.id);
                                setQuery("");
                            }}
                            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-xs transition-colors ${isActive
                                ? "border-gold-500/40 bg-gold-500/15 text-gold-300 font-semibold"
                                : "border-border/80 bg-space-900/70 text-starlight-300 hover:bg-space-850"
                                }`}
                        >
                            <span className="truncate">
                                {group.batchName} · {group.name}
                            </span>
                            <Badge variant="outline" className="border-border/80 text-[10px] text-starlight-400">
                                {group.type === "BEGINNER" ? "Beginner" : "Intermediate"}
                            </Badge>
                        </button>
                    );
                })}
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-starlight-400" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search students by name or email"
                        aria-label="Search students"
                        className="h-10 pl-9"
                    />
                </div>

                <div className="flex items-center gap-2" role="group" aria-label="Sort students">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-starlight-400">
                        Sort
                    </span>
                    <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-space-900/70 p-1">
                        {SORT_OPTIONS.map((opt) => {
                            const isActive = sortKey === opt.key;
                            const Icon = sortDir === "asc" ? ArrowUp : ArrowDown;
                            const nextDir = isActive ? (sortDir === "asc" ? "descending" : "ascending") : null;
                            return (
                                <button
                                    key={opt.key}
                                    type="button"
                                    aria-pressed={isActive}
                                    aria-label={
                                        isActive
                                            ? `Sorted by ${opt.label.toLowerCase()}, ${sortDir === "asc" ? "ascending" : "descending"}. Activate to sort ${nextDir}`
                                            : `Sort by ${opt.label.toLowerCase()}`
                                    }
                                    onClick={() => handleSort(opt.key)}
                                    className={cn(
                                        "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gold-500/50",
                                        isActive
                                            ? "bg-gold-500/15 font-semibold text-gold-300"
                                            : "text-starlight-300 hover:bg-space-850"
                                    )}
                                >
                                    <span>{opt.label}</span>
                                    {isActive && (
                                        <>
                                            <Icon className="size-3.5" aria-hidden />
                                            <span className="hidden text-[10px] font-medium text-gold-400/80 sm:inline">
                                                {opt.hint[sortDir]}
                                            </span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Screen-reader announcement for navigation */}
            <div role="status" aria-live="polite" className="sr-only">
                {isNavigating && navigatingId
                    ? `Opening ${groups.flatMap((g) => g.students).find((s) => s.id === navigatingId)?.name ?? "student"}'s profile…`
                    : ""}
            </div>

            {/* Students */}
            <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-space-900/60 backdrop-blur-md">
                {students.length === 0 ? (
                    <div className="p-8 text-center text-xs text-starlight-400">
                        {activeGroup && activeGroup.students.length === 0
                            ? "This group has no students yet."
                            : "No students match your search."}
                    </div>
                ) : (
                    students.map((student) => {
                        const profileUrl = `/instructor/students/${encodeURIComponent(student.id)}${activeGroup ? `?groupId=${encodeURIComponent(activeGroup.id)}` : ""
                            }`;

                        const isThisNavigating = isNavigating && navigatingId === student.id;
                        const isOtherNavigating = isNavigating && navigatingId !== student.id;

                        return (
                            <div
                                key={student.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`View 360 profile for ${student.name}`}
                                aria-busy={isThisNavigating}
                                aria-disabled={isNavigating}
                                onClick={() => openProfile(student, profileUrl)}
                                onKeyDown={(e) => {
                                    // Ignore keys coming from inner controls (e.g. Adjust ST button).
                                    if (e.target !== e.currentTarget) return;
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openProfile(student, profileUrl);
                                    }
                                }}
                                className={cn(
                                    "group flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gold-500/50 transition-[background-color,opacity]",
                                    isNavigating ? "cursor-progress" : "cursor-pointer hover:bg-space-850/60",
                                    isThisNavigating && "bg-gold-500/10",
                                    isOtherNavigating && "opacity-60"
                                )}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <StudentAvatar
                                        avatarConfig={student.avatarConfig}
                                        name={student.name}
                                        size="2xl"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-xl font-semibold text-starlight-100 group-hover:text-gold-300 transition-colors">
                                            {student.name}
                                        </p>
                                        <p className="truncate text-xs text-starlight-400 font-mono">
                                            {student.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <div className="flex items-center gap-1.5 font-mono text-xl font-bold tabular-nums text-gold-300">
                                        <Coins className="size-4 text-gold-400" aria-hidden />
                                        <span>{student.balance}</span>
                                        <span className="text-[10px] font-semibold text-starlight-400">ST</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={isNavigating}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelected(student);
                                        }}
                                        className="h-8 gap-1.5 rounded-lg border-gold-500/40 text-xs text-gold-300 hover:bg-space-850"
                                    >
                                        <SlidersHorizontal className="size-3.5" />
                                        Adjust ST
                                    </Button>
                                    {isThisNavigating && spinnerReady ? (
                                        <Loader2 className="size-4 shrink-0 animate-spin text-gold-300" aria-hidden />
                                    ) : (
                                        <ChevronRight className="size-4 text-starlight-400 group-hover:text-gold-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selected && (
                <StAdjustDialog
                    key={selected.id}
                    student={selected}
                    onClose={() => setSelected(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}