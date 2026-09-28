// src/app/super-admin/levels/level-management-view.tsx
"use client";

import { useState, useMemo } from "react";
import {
    Sparkles,
    Layers,
    Plus,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    ChevronDown,
    ChevronRight,
    Search,
    BookOpen,
    Info,
    Check,
    Compass,
    ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createLevelAction } from "@/lib/actions/level-management";
import type { BatchWithGroupsAndLevels } from "@/types/types";
import { formatDate } from "@/lib/format-date";

export function LevelManagementView({
    batches,
}: {
    batches: BatchWithGroupsAndLevels[];
}) {
    const [showCreateLevel, setShowCreateLevel] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Flat list of all groups with batch info
    const allGroups = useMemo(() => {
        return batches.flatMap((batch) =>
            batch.groups.map((group) => ({
                ...group,
                batchName: batch.name,
            }))
        );
    }, [batches]);

    const intermediateGroups = useMemo(() => {
        return allGroups.filter((g) => g.type !== "BEGINNER");
    }, [allGroups]);

    const activeLevelsCount = useMemo(() => {
        return intermediateGroups.filter((g) => g.activeLevel !== null).length;
    }, [intermediateGroups]);

    const pendingLevelsCount = intermediateGroups.length - activeLevelsCount;

    // Filtered batches for overview
    const filteredBatches = useMemo(() => {
        if (!searchQuery.trim()) return batches;
        const q = searchQuery.toLowerCase();
        return batches.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                b.groups.some(
                    (g) =>
                        g.name.toLowerCase().includes(q) ||
                        (g.activeLevel && g.activeLevel.name.toLowerCase().includes(q))
                )
        );
    }, [batches, searchQuery]);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/70 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/25">
                            <Sparkles className="size-3.5 text-gold-400" />
                            <span>Progression Engine</span>
                        </span>
                    </div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-starlight-100 mt-2">
                        Level Management & Curriculum Progression
                    </h1>
                    <p className="mt-1 text-sm text-starlight-300">
                        Advance intermediate cohorts across curriculum levels and monitor live active levels.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        onClick={() => setShowCreateLevel(!showCreateLevel)}
                        className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold"
                    >
                        <Plus className="size-4 mr-1.5" />
                        <span>{showCreateLevel ? "Close Creator" : "Create Level"}</span>
                    </Button>
                </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Intermediate Groups
                    </span>
                    <p className="font-display text-2xl font-bold text-starlight-100 mt-1">
                        {intermediateGroups.length}
                    </p>
                    <span className="text-[11px] text-starlight-400">Using Level-based system</span>
                </div>

                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Active Levels
                    </span>
                    <p className="font-display text-2xl font-bold text-success-400 mt-1">
                        {activeLevelsCount}
                    </p>
                    <span className="text-[11px] text-starlight-400">Cohorts progressing</span>
                </div>

                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Pending Level
                    </span>
                    <p className="font-display text-2xl font-bold text-amber-400 mt-1">
                        {pendingLevelsCount}
                    </p>
                    <span className="text-[11px] text-starlight-400">Awaiting level assignment</span>
                </div>

                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Beginner Groups
                    </span>
                    <p className="font-display text-2xl font-bold text-violet-400 mt-1">
                        {allGroups.length - intermediateGroups.length}
                    </p>
                    <span className="text-[11px] text-starlight-400">Managed via Weekly Missions</span>
                </div>
            </div>

            {/* CREATE LEVEL CARD */}
            {showCreateLevel && (
                <div className="animate-slide-down">
                    <CreateLevelCard
                        groups={allGroups}
                        onCreated={() => setShowCreateLevel(false)}
                    />
                </div>
            )}

            {/* Search Filter */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                <Input
                    placeholder="Search cohorts, groups, or levels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-space-900/60 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50"
                />
            </div>

            {/* ACTIVE LEVELS OVERVIEW */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-starlight-300">
                        Active Curriculum Status per Group
                    </h2>
                    <span className="text-xs text-starlight-400 font-mono">
                        {batches.length} Cohorts Total
                    </span>
                </div>

                {filteredBatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/50 p-12 text-center backdrop-blur-md">
                        <Sparkles className="size-10 text-starlight-400/60 mb-3" />
                        <h3 className="font-display text-base font-bold text-starlight-200">
                            No Cohorts or Levels Found
                        </h3>
                        <p className="mt-1 text-xs text-starlight-400 max-w-sm">
                            {batches.length === 0
                                ? "No batches or groups exist yet. Create batches first in the Batches tab."
                                : "No results match your search keywords."}
                        </p>
                    </div>
                ) : (
                    filteredBatches.map((batch) => (
                        <Card
                            key={batch.id}
                            className="border-border/80 bg-space-900/70 backdrop-blur-md shadow-2"
                        >
                            <CardHeader className="border-b border-border/70 p-4 sm:p-5 flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-xl bg-space-850 border border-gold-500/30 text-gold-400 flex items-center justify-center shadow-xs">
                                        <Layers className="size-4" />
                                    </div>
                                    <CardTitle className="font-display text-base text-starlight-100">
                                        {batch.name}
                                    </CardTitle>
                                </div>
                                <span className="text-xs text-starlight-400">
                                    {batch.groups.length} Groups
                                </span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-3">
                                {batch.groups.length === 0 ? (
                                    <p className="text-xs text-starlight-400/80 italic">
                                        No groups defined in this batch yet.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {batch.groups.map((group) => {
                                            const isBeginner = group.type === "BEGINNER";

                                            return (
                                                <div
                                                    key={group.id}
                                                    className="rounded-xl border border-border/70 bg-space-950/60 p-4 space-y-2.5 hover:border-border transition-all"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-sm text-starlight-100">
                                                            {group.name}
                                                        </span>
                                                        {isBeginner ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                                                Beginner Track
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-500/15 text-gold-300 border border-gold-500/30">
                                                                Intermediate Track
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Active Level Card Content */}
                                                    {isBeginner ? (
                                                        <div className="rounded-lg bg-space-900/60 border border-violet-500/20 p-2.5 flex items-center gap-2">
                                                            <Compass className="size-4 text-violet-400 shrink-0" />
                                                            <span className="text-xs text-violet-300">
                                                                Managed via weekly missions and video playlists by mentors.
                                                            </span>
                                                        </div>
                                                    ) : group.activeLevel ? (
                                                        <div className="rounded-lg bg-space-900/90 border border-gold-500/25 p-3 space-y-1.5 shadow-xs">
                                                            <div className="flex items-center justify-between">
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/40">
                                                                    <Sparkles className="size-3 text-gold-400" />
                                                                    <span>Level {group.activeLevel.levelNumber}</span>
                                                                </span>
                                                                <span className="text-[10px] text-starlight-400 flex items-center gap-1">
                                                                    <Calendar className="size-3" />
                                                                    <span>Active since {formatDate(group.activeLevel.startDate)}</span>
                                                                </span>
                                                            </div>
                                                            <p className="font-medium text-xs text-starlight-100 pt-0.5">
                                                                {group.activeLevel.name}
                                                            </p>
                                                            {group.activeLevel.description && (
                                                                <p className="text-[11px] text-starlight-400 line-clamp-2">
                                                                    {group.activeLevel.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-lg bg-space-900/50 border border-dashed border-amber-500/30 p-2.5 flex items-center justify-between">
                                                            <span className="text-xs text-amber-300 flex items-center gap-1.5">
                                                                <AlertTriangle className="size-3.5 text-amber-400" />
                                                                <span>No Active Level Yet</span>
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowCreateLevel(true)}
                                                                className="text-[11px] text-gold-400 hover:underline font-medium"
                                                            >
                                                                Assign Level
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// CREATE LEVEL CARD
// ============================================

interface GroupForSelection {
    id: string;
    name: string;
    batchName: string;
    type?: "BEGINNER" | "INTERMEDIATE";
    activeLevel: { name: string; levelNumber: number } | null;
}

function CreateLevelCard({
    groups,
    onCreated,
}: {
    groups: GroupForSelection[];
    onCreated?: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [levelNumber, setLevelNumber] = useState("1");
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Only intermediate groups use Levels
    const intermediateGroups = useMemo(() => {
        return groups.filter((g) => g.type !== "BEGINNER");
    }, [groups]);

    function toggleGroup(groupId: string) {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    }

    function selectAllBatch(batchGroups: GroupForSelection[]) {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            const allSelected = batchGroups.every((g) => next.has(g.id));
            if (allSelected) {
                batchGroups.forEach((g) => next.delete(g.id));
            } else {
                batchGroups.forEach((g) => next.add(g.id));
            }
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const levelNumberValue = Number(levelNumber);
        if (!Number.isInteger(levelNumberValue) || levelNumberValue <= 0) {
            setError("Level number must be a positive whole number.");
            return;
        }

        if (selectedGroupIds.size === 0) {
            setError("Select at least one Intermediate Group for this Level.");
            return;
        }

        setIsSubmitting(true);
        const result = await createLevelAction({
            name: name.trim(),
            description: description.trim() ? description.trim() : null,
            levelNumber: levelNumberValue,
            groupIds: Array.from(selectedGroupIds),
        });
        setIsSubmitting(false);

        if (result.success && result.data) {
            setSuccessMessage(
                `Level "${name}" successfully created and activated for ${result.data.length} Group${
                    result.data.length === 1 ? "" : "s"
                }.`
            );
            setName("");
            setDescription("");
            setLevelNumber("1");
            setSelectedGroupIds(new Set());
            setTimeout(() => {
                onCreated?.();
            }, 1800);
        } else {
            setError(result.error ?? "Failed to create Level.");
        }
    }

    // Group the selectable groups by Batch
    const groupsByBatch = useMemo(() => {
        const map = new Map<string, GroupForSelection[]>();
        for (const group of intermediateGroups) {
            const list = map.get(group.batchName) ?? [];
            list.push(group);
            map.set(group.batchName, list);
        }
        return map;
    }, [intermediateGroups]);

    return (
        <Card className="border-gold-500/30 bg-space-900/80 backdrop-blur-md shadow-gold">
            <CardHeader className="border-b border-border/70 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/25">
                            <Sparkles className="size-4" />
                        </div>
                        <div>
                            <CardTitle className="font-display text-base text-starlight-100">
                                Launch New Curriculum Level
                            </CardTitle>
                            <CardDescription className="text-xs text-starlight-400">
                                Define the level title, sequence number, and select intermediate cohorts to progress.
                            </CardDescription>
                        </div>
                    </div>

                    {onCreated && (
                        <button
                            type="button"
                            onClick={onCreated}
                            className="text-starlight-400 hover:text-starlight-200 text-xs"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {successMessage && (
                    <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-3.5 flex items-center gap-2.5 text-xs text-success-300">
                        <CheckCircle2 className="size-4 text-success-400 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-8 space-y-1.5">
                            <Label htmlFor="level-name" className="text-xs text-starlight-300">
                                Level Title
                            </Label>
                            <Input
                                id="level-name"
                                placeholder="e.g. Level 1: Foundations of Programming"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-space-950/80 border-border/80 text-starlight-100 focus-visible:border-gold-500/50"
                            />
                        </div>

                        <div className="sm:col-span-4 space-y-1.5">
                            <Label htmlFor="level-number" className="text-xs text-starlight-300">
                                Level Number (Sequential)
                            </Label>
                            <Input
                                id="level-number"
                                type="number"
                                min={1}
                                value={levelNumber}
                                onChange={(e) => setLevelNumber(e.target.value)}
                                required
                                className="bg-space-950/80 border-border/80 text-starlight-100 font-mono focus-visible:border-gold-500/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <MarkdownEditor
                            id="level-description"
                            label="Description & Learning Objectives (Optional)"
                            placeholder="Briefly outline topics, algorithms, or concepts covered in this level in Markdown..."
                            value={description}
                            onChange={(val) => setDescription(val)}
                            rows={4}
                        />
                    </div>

                    {/* Groups Multi-Selection */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-starlight-300">
                                Target Intermediate Groups ({selectedGroupIds.size} selected)
                            </Label>
                            <span className="text-[11px] text-starlight-400">
                                Beginner groups are excluded (they use Weekly Missions)
                            </span>
                        </div>

                        {intermediateGroups.length === 0 ? (
                            <p className="text-xs text-starlight-400/80 italic p-4 rounded-xl border border-dashed border-border/70 bg-space-950/40">
                                No Intermediate groups available. Create intermediate groups in the Batches tab first.
                            </p>
                        ) : (
                            <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border/80 bg-space-950/60 p-4">
                                {Array.from(groupsByBatch.entries()).map(([batchName, batchGroups]) => (
                                    <div key={batchName} className="space-y-2">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-1">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400">
                                                {batchName}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => selectAllBatch(batchGroups)}
                                                className="text-[10px] text-starlight-400 hover:text-gold-300 hover:underline"
                                            >
                                                Toggle All
                                            </button>
                                        </div>

                                        <div className="space-y-1.5 pl-1">
                                            {batchGroups.map((group) => {
                                                const isSelected = selectedGroupIds.has(group.id);
                                                return (
                                                    <div
                                                        key={group.id}
                                                        onClick={() => toggleGroup(group.id)}
                                                        className={`
                                                            flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all
                                                            ${
                                                                isSelected
                                                                    ? "bg-gold-500/10 border-gold-500/35 text-starlight-100"
                                                                    : "bg-space-900/40 border-border/60 text-starlight-300 hover:border-border"
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Checkbox
                                                                id={`group-${group.id}`}
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleGroup(group.id)}
                                                            />
                                                            <span className="font-medium">
                                                                {group.name}
                                                            </span>
                                                        </div>

                                                        {group.activeLevel ? (
                                                            <span className="text-[10px] text-starlight-400 font-mono">
                                                                Current: Level {group.activeLevel.levelNumber} ({group.activeLevel.name})
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-amber-400/80">
                                                                No active level
                                                            </span>
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

                    {/* ST Economy Transition Notice */}
                    {selectedGroupIds.size > 0 && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5 animate-fade-in">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                                <AlertTriangle className="size-4 text-amber-400" />
                                <span>Platform Transition Notice</span>
                            </div>
                            <p className="text-[11px] text-starlight-300 leading-relaxed">
                                Activating this level will freeze the previous active level for the selected groups. Each student in these groups will receive a fresh Level ST balance of <strong className="text-gold-300">50 ST</strong>. Historical balances and past sessions remain completely preserved in audit logs.
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs font-medium text-error-400 bg-error-500/10 border border-error-500/20 p-2.5 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        {onCreated && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCreated}
                                className="text-starlight-400 hover:text-starlight-200"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting || selectedGroupIds.size === 0}
                            className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold h-10 px-6"
                        >
                            {isSubmitting ? "Activating Level..." : "Activate & Launch Level"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}