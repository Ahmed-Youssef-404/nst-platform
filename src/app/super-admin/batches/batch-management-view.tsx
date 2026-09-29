// src/app/super-admin/batches/batch-management-view.tsx
"use client";

import { useState, useMemo } from "react";
import {
    Layers,
    Plus,
    Users,
    GraduationCap,
    Edit3,
    Check,
    X,
    Trash2,
    Sparkles,
    Search,
    BookOpen,
    Compass,
    UserPlus,
    UserMinus,
    AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { showToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    createBatchAction,
    updateBatchAction,
    createGroupAction,
    updateGroupAction,
    assignInstructorAction,
    unassignInstructorAction,
} from "@/lib/actions/batch-management";
import type { BatchWithGroups, InstructorOption } from "@/types/types";

export function BatchManagementView({
    batches,
    instructors,
}: {
    batches: BatchWithGroups[];
    instructors: InstructorOption[];
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateBatch, setShowCreateBatch] = useState(false);

    // Filtered batches
    const filteredBatches = useMemo(() => {
        if (!searchQuery.trim()) return batches;
        const q = searchQuery.toLowerCase();
        return batches.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                b.groups.some((g) => g.name.toLowerCase().includes(q))
        );
    }, [batches, searchQuery]);

    const totalGroups = batches.reduce((acc, b) => acc + b.groups.length, 0);
    const totalStudents = batches.reduce(
        (acc, b) => acc + b.groups.reduce((gAcc, g) => gAcc + g.studentCount, 0),
        0
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/70 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/25">
                            <Layers className="size-3.5 text-gold-400" />
                            <span>Academic Cohorts</span>
                        </span>
                    </div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-starlight-100 mt-2">
                        Batches & Groups Management
                    </h1>
                    <p className="mt-1 text-sm text-starlight-300">
                        Create cohorts, organize learning groups into Intermediate or Beginner tracks, and assign instructors.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        onClick={() => setShowCreateBatch(true)}
                        className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold"
                    >
                        <Plus className="size-4 mr-1.5" />
                        <span>New Batch</span>
                    </Button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Total Cohorts
                    </span>
                    <p className="font-display text-2xl font-bold text-starlight-100 mt-1">
                        {batches.length} <span className="text-xs font-normal text-starlight-400">Batches</span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Total Groups
                    </span>
                    <p className="font-display text-2xl font-bold text-starlight-100 mt-1">
                        {totalGroups} <span className="text-xs font-normal text-starlight-400">Active Groups</span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md">
                    <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                        Total Enrolled
                    </span>
                    <p className="font-display text-2xl font-bold text-starlight-100 mt-1">
                        {totalStudents} <span className="text-xs font-normal text-starlight-400">Students across cohorts</span>
                    </p>
                </div>
            </div>

            {/* CREATE BATCH MODAL (Requirement 16) */}
            <Dialog open={showCreateBatch} onOpenChange={setShowCreateBatch}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-gold-500/10 text-gold-500 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                <Plus className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="font-display text-base text-foreground dark:text-starlight-100">
                                    Create Academic Batch
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    A batch groups students and cohorts by graduation year or session cycle.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <CreateBatchForm onCreated={() => setShowCreateBatch(false)} onCancel={() => setShowCreateBatch(false)} />
                </DialogContent>
            </Dialog>

            {/* Search Filter */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                <Input
                    placeholder="Search batches or groups by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-space-900/60 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50"
                />
            </div>

            {/* BATCHES LIST */}
            {filteredBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/50 p-12 text-center backdrop-blur-md">
                    <Layers className="size-10 text-starlight-400/60 mb-3" />
                    <h3 className="font-display text-base font-bold text-starlight-200">
                        No Batches Found
                    </h3>
                    <p className="mt-1 text-xs text-starlight-400 max-w-sm">
                        {batches.length === 0
                            ? "No academic cohorts have been initialized yet. Click New Batch to create the first one."
                            : "No batches match your search criteria. Try clearing the search."}
                    </p>
                    {batches.length === 0 && (
                        <Button
                            size="sm"
                            onClick={() => setShowCreateBatch(true)}
                            className="mt-4 bg-gold-500 text-space-950 font-semibold"
                        >
                            <Plus className="size-4 mr-1.5" />
                            Create First Batch
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredBatches.map((batch) => (
                        <BatchCard
                            key={batch.id}
                            batch={batch}
                            instructors={instructors}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// CREATE BATCH FORM (FOR DIALOG)
// ============================================

function CreateBatchForm({ onCreated, onCancel }: { onCreated?: () => void; onCancel?: () => void }) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await createBatchAction({ name: name.trim() });

        if (result.success) {
            setName("");
            showToast({
                title: "Batch Created",
                description: `Academic batch "${name.trim()}" created successfully.`,
                type: "success",
            });
            onCreated?.();
        } else {
            setError(result.error ?? "Failed to create batch.");
        }

        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
                <Label htmlFor="new-batch-name" className="text-xs font-semibold text-foreground/90">
                    Batch Name
                </Label>
                <Input
                    id="new-batch-name"
                    type="text"
                    placeholder="e.g. Batch 2026 - Spring"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50"
                />
            </div>

            {error && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
                    {error}
                </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold px-5"
                >
                    {isSubmitting ? "Creating..." : "Create Batch"}
                </Button>
            </div>
        </form>
    );
}

// ============================================
// BATCH CARD (with Groups)
// ============================================

function BatchCard({
    batch,
    instructors,
}: {
    batch: BatchWithGroups;
    instructors: InstructorOption[];
}) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAddingGroup, setIsAddingGroup] = useState(false);

    const totalBatchStudents = batch.groups.reduce(
        (acc, g) => acc + g.studentCount,
        0
    );

    return (
        <Card className="border-border/80 bg-space-900/70 backdrop-blur-md shadow-2 hover:border-border transition-all">
            {/* Batch Header */}
            <CardHeader className="border-b border-border/70 p-5 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
                {isEditingName ? (
                    <BatchNameEditor
                        batchId={batch.id}
                        currentName={batch.name}
                        onDone={() => setIsEditingName(false)}
                    />
                ) : (
                    <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-space-850 border border-gold-500/30 text-gold-400 flex items-center justify-center shadow-xs">
                                <Layers className="size-4" />
                            </div>
                            <div>
                                <h3 className="font-display text-lg font-bold text-starlight-100 flex items-center gap-2">
                                    <span>{batch.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingName(true)}
                                        className="text-starlight-400 hover:text-gold-400 transition-colors"
                                        title="Rename Batch"
                                    >
                                        <Edit3 className="size-3.5" />
                                    </button>
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-starlight-400">
                                    <span>{batch.groups.length} Groups</span>
                                    <span>•</span>
                                    <span>{totalBatchStudents} Enrolled Students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingGroup(true)}
                        className="text-xs border-gold-500/30 text-gold-600 dark:text-gold-300 hover:bg-gold-500/10 h-8"
                    >
                        <Plus className="size-3.5 mr-1" />
                        <span>Add Group</span>
                    </Button>
                </div>
            </CardHeader>

            {/* ADD GROUP MODAL (Requirement 16) */}
            <Dialog open={isAddingGroup} onOpenChange={setIsAddingGroup}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-gold-500/10 text-gold-500 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                <Plus className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="font-display text-base text-foreground dark:text-starlight-100">
                                    Add Learning Group
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Add a new group to {batch.name} and configure its curriculum track.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <CreateGroupForm
                        batchId={batch.id}
                        onDone={() => setIsAddingGroup(false)}
                    />
                </DialogContent>
            </Dialog>

            <CardContent className="p-5 space-y-4">

                {/* Groups Container */}
                {batch.groups.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-space-950/40 p-6 text-center">
                        <Compass className="size-7 text-starlight-400/60 mx-auto mb-2" />
                        <p className="text-xs text-starlight-300 font-medium">
                            No learning groups in this batch yet.
                        </p>
                        <p className="text-[11px] text-starlight-400 mt-0.5">
                            Click &quot;Add Group&quot; to define an Intermediate or Beginner group.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {batch.groups.map((group) => (
                            <GroupRow
                                key={group.id}
                                group={group}
                                instructors={instructors}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// BATCH NAME EDITOR
// ============================================

function BatchNameEditor({
    batchId,
    currentName,
    onDone,
}: {
    batchId: string;
    currentName: string;
    onDone: () => void;
}) {
    const [name, setName] = useState(currentName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!name.trim()) return;
        setError(null);
        setIsSubmitting(true);

        const result = await updateBatchAction({ id: batchId, name: name.trim() });

        if (result.success) {
            onDone();
        } else {
            setError(result.error ?? "Failed to rename batch.");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-sm bg-space-950/80 border-gold-500/50 text-starlight-100"
                    autoFocus
                />
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="h-8 bg-gold-500 text-space-950 font-semibold"
                >
                    <Check className="size-3.5 mr-1" />
                    Save
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDone}
                    className="h-8 text-starlight-400 hover:text-starlight-200"
                >
                    <X className="size-3.5 mr-1" />
                    Cancel
                </Button>
            </div>
            {error && <p className="text-xs text-error-400">{error}</p>}
        </div>
    );
}

// ============================================
// CREATE GROUP FORM (With Track Selection!)
// ============================================

function CreateGroupForm({
    batchId,
    onDone,
}: {
    batchId: string;
    onDone: () => void;
}) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"INTERMEDIATE" | "BEGINNER">("INTERMEDIATE");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await createGroupAction({
            name: name.trim(),
            batchId,
            type,
        });

        if (result.success) {
            onDone();
        } else {
            setError(result.error ?? "Failed to create group.");
        }

        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
                <Label htmlFor={`group-name-${batchId}`} className="text-xs font-semibold text-foreground/90">
                    Group Name
                </Label>
                <Input
                    id={`group-name-${batchId}`}
                    type="text"
                    placeholder="e.g. Group A (Morning)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="h-10 text-xs bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90">
                    Curriculum Track
                </Label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "INTERMEDIATE" | "BEGINNER")}
                    className="flex h-10 w-full rounded-xl border border-border bg-background dark:bg-space-950/90 px-3 py-2 text-xs font-medium text-foreground dark:text-starlight-200 outline-none focus-visible:border-gold-500/50 shadow-xs"
                >
                    <option value="INTERMEDIATE">Intermediate (Levels & Sessions)</option>
                    <option value="BEGINNER">Beginner (Weekly Missions & Videos)</option>
                </select>
                <p className="text-[11px] text-muted-foreground pt-1">
                    {type === "INTERMEDIATE"
                        ? "Intermediate groups follow Level progression and session tasks."
                        : "Beginner groups follow weekly missions with video playlists."}
                </p>
            </div>

            {error && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
                    {error}
                </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onDone}
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gold-500 text-space-950 hover:bg-gold-400 font-semibold shadow-gold px-5"
                >
                    {isSubmitting ? "Creating..." : "Create Group"}
                </Button>
            </div>
        </form>
    );
}

// ============================================
// GROUP ROW (Name, Track Badge, Headcount, Instructors)
// ============================================

function GroupRow({
    group,
    instructors,
}: {
    group: BatchWithGroups["groups"][number];
    instructors: InstructorOption[];
}) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [isManagingInstructors, setIsManagingInstructors] = useState(false);

    return (
        <div className="rounded-xl border border-border/70 bg-space-950/50 p-4 hover:border-border transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {isEditingName ? (
                    <GroupNameEditor
                        groupId={group.id}
                        currentName={group.name}
                        onDone={() => setIsEditingName(false)}
                    />
                ) : (
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-starlight-100">
                                    {group.name}
                                </h4>
                                {group.type === "BEGINNER" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                        Beginner Track
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-500/15 text-gold-300 border border-gold-500/30">
                                        Intermediate Track
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-starlight-400 mt-0.5 flex items-center gap-1.5">
                                <Users className="size-3 text-starlight-400" />
                                <span>
                                    {group.studentCount}{" "}
                                    {group.studentCount === 1 ? "student" : "students"} enrolled
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!isEditingName && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingName(true)}
                            className="h-7 text-xs text-starlight-400 hover:text-starlight-200"
                        >
                            Rename
                        </Button>
                    )}
                    <Button
                        variant={isManagingInstructors ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setIsManagingInstructors(!isManagingInstructors)}
                        className={`h-7 text-xs ${
                            isManagingInstructors
                                ? "bg-gold-500/20 text-gold-300 border-gold-500/40"
                                : "border-border/80 text-starlight-300"
                        }`}
                    >
                        <GraduationCap className="size-3 mr-1 text-gold-400" />
                        <span>Instructors ({group.instructors.length})</span>
                    </Button>
                </div>
            </div>

            {/* EXPANDABLE INSTRUCTORS ASSIGNMENT */}
            {isManagingInstructors && (
                <InstructorAssignment
                    groupId={group.id}
                    assignedInstructors={group.instructors}
                    allInstructors={instructors}
                />
            )}
        </div>
    );
}

// ============================================
// GROUP NAME EDITOR
// ============================================

function GroupNameEditor({
    groupId,
    currentName,
    onDone,
}: {
    groupId: string;
    currentName: string;
    onDone: () => void;
}) {
    const [name, setName] = useState(currentName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!name.trim()) return;
        setError(null);
        setIsSubmitting(true);

        const result = await updateGroupAction({ id: groupId, name: name.trim() });

        if (result.success) {
            onDone();
        } else {
            setError(result.error ?? "Failed to rename group.");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs bg-space-900 border-gold-500/40 text-starlight-100"
                    autoFocus
                />
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="h-8 bg-gold-500 text-space-950 font-semibold text-xs"
                >
                    <Check className="size-3 mr-1" />
                    Save
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDone}
                    className="h-8 text-starlight-400 hover:text-starlight-200 text-xs"
                >
                    <X className="size-3 mr-1" />
                    Cancel
                </Button>
            </div>
            {error && <p className="text-xs text-error-400">{error}</p>}
        </div>
    );
}

// ============================================
// INSTRUCTOR ASSIGNMENT
// ============================================

function InstructorAssignment({
    groupId,
    assignedInstructors,
    allInstructors,
}: {
    groupId: string;
    assignedInstructors: InstructorOption[];
    allInstructors: InstructorOption[];
}) {
    const [selectedInstructorId, setSelectedInstructorId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assignedIds = new Set(assignedInstructors.map((i) => i.id));
    const availableInstructors = allInstructors.filter(
        (i) => !assignedIds.has(i.id)
    );

    async function handleAssign() {
        if (!selectedInstructorId) return;

        setError(null);
        setIsSubmitting(true);

        const result = await assignInstructorAction({
            instructorId: selectedInstructorId,
            groupId,
        });

        if (result.success) {
            setSelectedInstructorId("");
        } else {
            setError(result.error ?? "Failed to assign instructor.");
        }

        setIsSubmitting(false);
    }

    async function handleUnassign(instructorId: string) {
        setError(null);
        setIsSubmitting(true);

        const result = await unassignInstructorAction({ instructorId, groupId });

        if (!result.success) {
            setError(result.error ?? "Failed to remove instructor.");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="mt-3.5 pt-3.5 border-t border-border/60 space-y-3 animate-fade-in">
            <span className="text-[11px] font-semibold text-starlight-300 block">
                Assigned Mentors
            </span>

            {assignedInstructors.length === 0 ? (
                <p className="text-xs text-starlight-400/80 italic">
                    No instructors assigned to this group yet. Select from below to assign.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {assignedInstructors.map((instructor) => {
                        const initials =
                            instructor.name
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((p) => p[0]?.toUpperCase())
                                .join("") || "IN";

                        return (
                            <div
                                key={instructor.id}
                                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-space-900 border border-border/80 text-xs text-starlight-200"
                            >
                                <Avatar size="sm" className="size-5 text-[9px] border border-gold-500/30">
                                    <AvatarFallback className="bg-space-850 text-gold-400">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-starlight-100">
                                    {instructor.name}
                                </span>
                                <span className="text-[10px] text-starlight-400 font-mono">
                                    ({instructor.email})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleUnassign(instructor.id)}
                                    disabled={isSubmitting}
                                    className="p-1 rounded-md text-error-400 hover:bg-error-500/10 transition-colors disabled:opacity-50"
                                    title="Unassign instructor"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Available Instructor */}
            {availableInstructors.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <select
                        value={selectedInstructorId}
                        onChange={(e) => setSelectedInstructorId(e.target.value)}
                        className="flex h-9 flex-1 w-full rounded-xl border border-border bg-background dark:bg-space-900 px-3 text-xs text-foreground dark:text-starlight-200 outline-none focus-visible:border-gold-500/50 shadow-xs"
                    >
                        <option value="">Select an available instructor to assign...</option>
                        {availableInstructors.map((instructor) => (
                            <option key={instructor.id} value={instructor.id}>
                                {instructor.name} ({instructor.email})
                            </option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        onClick={handleAssign}
                        disabled={isSubmitting || !selectedInstructorId}
                        className="w-full sm:w-auto h-8 text-xs bg-gold-500 text-space-950 font-semibold hover:bg-gold-400"
                    >
                        <UserPlus className="size-3 mr-1" />
                        Assign
                    </Button>
                </div>
            ) : (
                <p className="text-[11px] text-starlight-400">
                    All registered instructors are already assigned to this group.
                </p>
            )}

            {error && <p className="text-xs text-error-400">{error}</p>}
        </div>
    );
}