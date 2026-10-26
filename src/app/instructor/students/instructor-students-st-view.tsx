import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Search, SlidersHorizontal, Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { STAdjustGroup, STAdjustStudent } from "@/lib/data/get-instructor-students";
import { StAdjustDialog } from "./st-adjust-dialog";

export function InstructorStudentsSTView({ groups: initialGroups }: { groups: STAdjustGroup[] }) {
    const router = useRouter();
    const [groups, setGroups] = useState(initialGroups);
    const [activeGroupId, setActiveGroupId] = useState(initialGroups[0]?.id ?? "");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<STAdjustStudent | null>(null);

    const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];

    const students = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!activeGroup) return [];
        if (!q) return activeGroup.students;
        return activeGroup.students.filter(
            (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
        );
    }, [activeGroup, query]);

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
                            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-xs transition-colors ${
                                isActive
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

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-starlight-400" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search students by name or email"
                    aria-label="Search students"
                    className="h-10 pl-9"
                />
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
                        const profileUrl = `/instructor/students/${encodeURIComponent(student.id)}${
                            activeGroup ? `?groupId=${encodeURIComponent(activeGroup.id)}` : ""
                        }`;

                        return (
                            <div
                                key={student.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`View 360 profile for ${student.name}`}
                                onClick={() => router.push(profileUrl)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        router.push(profileUrl);
                                    }
                                }}
                                className="group flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 hover:bg-space-850/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gold-500/50 cursor-pointer transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-starlight-100 group-hover:text-gold-300 transition-colors">
                                        {student.name}
                                    </p>
                                    <p className="truncate text-xs text-starlight-400 font-mono">
                                        {student.email}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-gold-300">
                                        <Coins className="size-4 text-gold-400" aria-hidden />
                                        <span>{student.balance}</span>
                                        <span className="text-[10px] font-semibold text-starlight-400">ST</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelected(student);
                                        }}
                                        className="h-8 gap-1.5 rounded-lg border-gold-500/40 text-xs text-gold-300 hover:bg-space-850"
                                    >
                                        <SlidersHorizontal className="size-3.5" />
                                        Adjust ST
                                    </Button>
                                    <ChevronRight className="size-4 text-starlight-400 group-hover:text-gold-300 group-hover:translate-x-0.5 transition-all shrink-0" />
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
