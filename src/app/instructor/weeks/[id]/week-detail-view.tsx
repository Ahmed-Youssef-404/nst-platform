// src/app/instructor/weeks/[id]/week-detail-view.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Calendar,
    Clock,
    FileText,
    ExternalLink,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Info,
    Lock,
    ChevronLeft,
    Lightbulb,
    Sparkles,
    Users,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { formatDateTime } from "@/lib/format-date";
import {
    addTaskToWeekAction,
    updateWeekTaskAction,
    deleteWeekTaskAction,
    updateWeekAction,
} from "@/lib/actions/week-management";
import type {
    WeekDetailForInstructor,
    WeekDetailTask,
} from "@/lib/data/get-week-detail";
import type { SubmissionModeCode, TaskTypeCode } from "@/types/types";

const STATUS_STYLES = {
    upcoming: { label: "Upcoming", variant: "outline" as const },
    ongoing: { label: "Ongoing", variant: "success" as const },
    ended: { label: "Ended / Grading", variant: "secondary" as const },
};

export function WeekDetailView({ week }: { week: WeekDetailForInstructor }) {
    const router = useRouter();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [taskModalState, setTaskModalState] = useState<{
        isOpen: boolean;
        taskToEdit: WeekDetailTask | null;
    }>({ isOpen: false, taskToEdit: null });

    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const statusStyle = STATUS_STYLES[week.status];

    const lockedStudentCount = week.students.filter((s) => s.isLocked).length;
    const uploadedResourceCount = week.students.filter((s) => s.resource?.fileUrl).length;
    const finalizedStudentCount = week.students.filter((s) => s.isFinalized).length;

    async function handleDeleteTask(taskId: string) {
        if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) {
            return;
        }

        setDeletingTaskId(taskId);
        setActionError(null);

        try {
            const res = await deleteWeekTaskAction({ taskId });
            if (!res.success) {
                setActionError(res.error ?? "Failed to delete task.");
            } else {
                router.refresh();
            }
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Error deleting task.");
        } finally {
            setDeletingTaskId(null);
        }
    }

    return (
        <div className="space-y-8">
            {/* Navigation & Header */}
            <div className="space-y-3">
                <Link
                    href="/instructor"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="size-4" />
                    Back to dashboard
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="font-display text-2xl font-bold tracking-tight">
                                {week.name}
                            </h1>
                            <Badge variant={statusStyle.variant}>
                                {statusStyle.label}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {week.groupName} · {week.batchName} (Beginner Track)
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            <Pencil className="size-3.5 mr-1" />
                            Edit Week Info
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            render={<Link href={`/instructor/weeks/${week.id}/grade`} />}
                        >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Grade Submissions
                        </Button>
                    </div>
                </div>
            </div>

            {actionError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3.5 text-sm text-destructive border border-destructive/20">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{actionError}</span>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                            <Clock className="size-3.5 text-muted-foreground" />
                            Schedule & Duration
                        </CardDescription>
                        <CardTitle className="text-sm font-medium">
                            {formatDateTime(week.startDate)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Deadline: {formatDateTime(week.endDate)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                            <FileText className="size-3.5 text-muted-foreground" />
                            Mandatory Deliverable
                        </CardDescription>
                        <CardTitle className="text-sm font-medium truncate" title={week.requiredFileLabel}>
                            {week.requiredFileLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        <a
                            href={week.playlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                            <ExternalLink className="size-3" />
                            Open Video Playlist
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                            <Users className="size-3.5 text-muted-foreground" />
                            Student Progress
                        </CardDescription>
                        <CardTitle className="text-sm font-medium">
                            {week.students.length} Enrolled Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{uploadedResourceCount} uploaded file</span>
                        <span>•</span>
                        <span>{lockedStudentCount} locked</span>
                        <span>•</span>
                        <span>{finalizedStudentCount} graded</span>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-lg font-semibold">
                            Tasks & Challenges
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {week.tasks.length} {week.tasks.length === 1 ? "task" : "tasks"} configured
                        </p>
                    </div>

                    {week.canEditTasks ? (
                        <Button
                            size="sm"
                            onClick={() =>
                                setTaskModalState({ isOpen: true, taskToEdit: null })
                            }
                        >
                            <Plus className="size-3.5 mr-1" />
                            Add Task
                        </Button>
                    ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                            <Lock className="size-3" />
                            Tasks Locked (Week Started)
                        </Badge>
                    )}
                </div>

                {!week.canEditTasks && (
                    <div className="rounded-lg bg-muted/50 border border-border p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                            This week has already begun. In accordance with system policy, task descriptions, hints, and rubric criteria are locked to protect student grading and submissions.
                        </span>
                    </div>
                )}

                {week.tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                        <Lightbulb className="size-8 text-muted-foreground/60 mb-2" />
                        <p className="text-sm font-medium text-foreground">
                            No tasks created for this week yet
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mt-0.5 mb-4">
                            Add practical challenges, hints, and rubric fields for your students.
                        </p>
                        {week.canEditTasks && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    setTaskModalState({ isOpen: true, taskToEdit: null })
                                }
                            >
                                <Plus className="size-3.5 mr-1" />
                                Add First Task
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {week.tasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                index={index + 1}
                                task={task}
                                canEdit={week.canEditTasks}
                                onEdit={() =>
                                    setTaskModalState({ isOpen: true, taskToEdit: task })
                                }
                                onDelete={() => handleDeleteTask(task.id)}
                                isDeleting={deletingTaskId === task.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Week Dialog */}
            {isEditDialogOpen && (
                <EditWeekDialog
                    week={week}
                    isOpen={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                    onSuccess={() => {
                        setIsEditDialogOpen(false);
                        router.refresh();
                    }}
                />
            )}

            {/* Task Create / Edit Dialog */}
            {taskModalState.isOpen && (
                <TaskFormDialog
                    weekId={week.id}
                    taskToEdit={taskModalState.taskToEdit}
                    isOpen={taskModalState.isOpen}
                    onClose={() =>
                        setTaskModalState({ isOpen: false, taskToEdit: null })
                    }
                    onSuccess={() => {
                        setTaskModalState({ isOpen: false, taskToEdit: null });
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}

function TaskCard({
    index,
    task,
    canEdit,
    onEdit,
    onDelete,
    isDeleting,
}: {
    index: number;
    task: WeekDetailTask;
    canEdit: boolean;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    return (
        <Card className="border-border/80 shadow-xs">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-sm text-muted-foreground">
                            #{index}
                        </span>
                        <CardTitle className="text-base font-medium">
                            {task.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {task.type}
                        </Badge>
                        {task.isBonus && (
                            <Badge variant="warning" className="text-xs">
                                Bonus (+5 ST)
                            </Badge>
                        )}
                        {task.allowedSubmissionMode && (
                            <Badge variant="secondary" className="text-xs">
                                {task.allowedSubmissionMode} only
                            </Badge>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={onEdit}
                            title="Edit task"
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                        <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={onDelete}
                            disabled={isDeleting}
                            title="Delete task"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
                <MarkdownContent
                    content={task.description}
                    className="text-muted-foreground text-sm"
                />

                {/* Rubric Fields Summary */}
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <Sparkles className="size-3 text-gold-400" />
                            Rubric Criteria (15 Points Total)
                        </span>
                        <span className="text-muted-foreground">
                            {task.rubricFields.length} criteria
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {task.rubricFields.map((field) => (
                            <div
                                key={field.id}
                                className="flex items-center justify-between rounded bg-muted/40 px-2.5 py-1.5 text-xs"
                            >
                                <span className="font-medium truncate max-w-[130px]">
                                    {field.fieldName}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                    {field.maxPoints} pts
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hints Summary */}
                {task.hints.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="size-3" />
                            Hints ({task.hints.length})
                        </p>
                        <div className="space-y-1.5">
                            {task.hints.map((hint) => (
                                <div
                                    key={hint.id}
                                    className="flex items-start justify-between gap-2 text-xs rounded border border-border/50 bg-background/50 p-2 text-muted-foreground"
                                >
                                    <span>
                                        <strong className="text-foreground">
                                            Hint #{hint.order}:
                                        </strong>{" "}
                                        {hint.content}
                                    </span>
                                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                                        Cost: {hint.cost} ST
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// -----------------------------------------------------------------------------
// Edit Week Info Dialog
// -----------------------------------------------------------------------------
function EditWeekDialog({
    week,
    isOpen,
    onClose,
    onSuccess,
}: {
    week: WeekDetailForInstructor;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [name, setName] = useState(week.name);
    const [playlistUrl, setPlaylistUrl] = useState(week.playlistUrl);
    const [requiredFileLabel, setRequiredFileLabel] = useState(week.requiredFileLabel);
    const [startDate, setStartDate] = useState(
        new Date(week.startDate.getTime() - week.startDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
    );
    const [endDate, setEndDate] = useState(
        new Date(week.endDate.getTime() - week.endDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
    );
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Week name cannot be empty.");
            return;
        }

        if (!requiredFileLabel.trim()) {
            setError("Required file label cannot be empty.");
            return;
        }

        try {
            new URL(playlistUrl.trim());
        } catch {
            setError("Playlist URL must be a valid URL.");
            return;
        }

        setIsSubmitting(true);

        try {
            const input: Parameters<typeof updateWeekAction>[0] = {
                weekId: week.id,
                name: name.trim(),
                playlistUrl: playlistUrl.trim(),
                requiredFileLabel: requiredFileLabel.trim(),
            };

            if (week.canEditDates) {
                input.startDate = new Date(startDate);
                input.endDate = new Date(endDate);
            }

            const res = await updateWeekAction(input);

            if (!res.success) {
                setError(res.error ?? "Failed to update week.");
                setIsSubmitting(false);
                return;
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error updating week.");
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Week Details</DialogTitle>
                    <DialogDescription>
                        Update the title, lecture playlist, and deliverable guidelines.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdate} className="space-y-4 pt-2">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-name">Week Name</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {week.canEditDates ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-start">Start Date</Label>
                                <Input
                                    id="edit-start"
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-end">End Date</Label>
                                <Input
                                    id="edit-end"
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                            <Lock className="size-3.5 shrink-0" />
                            <span>Start and End dates are locked because the week has begun.</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-playlist">Playlist URL</Label>
                        <Input
                            id="edit-playlist"
                            type="url"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-resource-label">Required File Label</Label>
                        <Input
                            id="edit-resource-label"
                            value={requiredFileLabel}
                            onChange={(e) => setRequiredFileLabel(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t">
                        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// -----------------------------------------------------------------------------
// Task Add & Edit Dialog
// -----------------------------------------------------------------------------
function TaskFormDialog({
    weekId,
    taskToEdit,
    isOpen,
    onClose,
    onSuccess,
}: {
    weekId: string;
    taskToEdit: WeekDetailTask | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const isEditing = Boolean(taskToEdit);

    const [title, setTitle] = useState(taskToEdit?.title ?? "");
    const [description, setDescription] = useState(taskToEdit?.description ?? "");
    const [type, setType] = useState<TaskTypeCode>(taskToEdit?.type ?? "INTERNAL");
    const [isBonus, setIsBonus] = useState(taskToEdit?.isBonus ?? false);
    const [allowedSubmissionMode, setAllowedSubmissionMode] = useState<
        SubmissionModeCode | "ANY"
    >(taskToEdit?.allowedSubmissionMode ?? "ANY");

    const [hints, setHints] = useState<
        { content: string; cost: number }[]
    >(
        taskToEdit?.hints.map((h) => ({ content: h.content, cost: h.cost })) ?? []
    );

    const [rubricFields, setRubricFields] = useState<
        { fieldName: string; maxPoints: number }[]
    >(
        taskToEdit?.rubricFields.map((r) => ({
            fieldName: r.fieldName,
            maxPoints: r.maxPoints,
        })) ?? [
            { fieldName: "Implementation", maxPoints: 5 },
            { fieldName: "Approach & Clean Code", maxPoints: 5 },
            { fieldName: "Correctness", maxPoints: 5 },
        ]
    );

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rubricSum = rubricFields.reduce((acc, f) => acc + (Number(f.maxPoints) || 0), 0);
    const isRubricValid = rubricSum === 15;

    function addHint() {
        if (hints.length >= 3) return;
        setHints((prev) => [...prev, { content: "", cost: 5 }]);
    }

    function removeHint(index: number) {
        setHints((prev) => prev.filter((_, i) => i !== index));
    }

    function addRubricField() {
        setRubricFields((prev) => [...prev, { fieldName: "", maxPoints: 1 }]);
    }

    function removeRubricField(index: number) {
        if (rubricFields.length <= 1) return;
        setRubricFields((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Task title cannot be empty.");
            return;
        }

        if (!description.trim()) {
            setError("Task description cannot be empty.");
            return;
        }

        if (!isRubricValid) {
            setError(`Rubric criteria points must sum to exactly 15 (currently ${rubricSum}).`);
            return;
        }

        for (const [i, f] of rubricFields.entries()) {
            if (!f.fieldName.trim()) {
                setError(`Criterion #${i + 1} name cannot be empty.`);
                return;
            }
            if (f.maxPoints <= 0) {
                setError(`Criterion #${i + 1} max points must be greater than 0.`);
                return;
            }
        }

        for (const [i, h] of hints.entries()) {
            if (!h.content.trim()) {
                setError(`Hint #${i + 1} content cannot be empty.`);
                return;
            }
            if (h.cost < 0) {
                setError(`Hint #${i + 1} cost cannot be negative.`);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const taskPayload = {
                title: title.trim(),
                description: description.trim(),
                type,
                isBonus,
                allowedSubmissionMode:
                    type === "EXTERNAL"
                        ? null
                        : allowedSubmissionMode === "ANY"
                        ? null
                        : allowedSubmissionMode,
                hints: hints.map((h) => ({
                    content: h.content.trim(),
                    cost: Number(h.cost) || 0,
                })),
                rubricFields: rubricFields.map((f) => ({
                    fieldName: f.fieldName.trim(),
                    maxPoints: Number(f.maxPoints) || 0,
                })),
            };

            if (isEditing && taskToEdit) {
                const res = await updateWeekTaskAction({
                    taskId: taskToEdit.id,
                    ...taskPayload,
                });
                if (!res.success) {
                    setError(res.error ?? "Failed to update task.");
                    setIsSubmitting(false);
                    return;
                }
            } else {
                const res = await addTaskToWeekAction({
                    weekId,
                    ...taskPayload,
                });
                if (!res.success) {
                    setError(res.error ?? "Failed to add task.");
                    setIsSubmitting(false);
                    return;
                }
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error saving task.");
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Task" : "Add New Task"}
                    </DialogTitle>
                    <DialogDescription>
                        Configure the problem statement, submission mode, hints, and 15-point rubric criteria.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            placeholder="e.g. Reverse an Array"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="task-type">Task Type</Label>
                            <Select
                                value={type}
                                onValueChange={(val) => setType(val as TaskTypeCode)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="task-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNAL">INTERNAL (On-platform)</SelectItem>
                                    <SelectItem value="EXTERNAL">EXTERNAL (External link/OJ)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === "INTERNAL" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="task-mode">Allowed Mode</Label>
                                <Select
                                    value={allowedSubmissionMode}
                                    onValueChange={(val) =>
                                        setAllowedSubmissionMode(val as SubmissionModeCode | "ANY")
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger id="task-mode">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ANY">Any (Student Choice)</SelectItem>
                                        <SelectItem value="FILE">FILE only</SelectItem>
                                        <SelectItem value="LINK">LINK only</SelectItem>
                                        <SelectItem value="TEXT">TEXT only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-6">
                            <Checkbox
                                id="task-bonus"
                                checked={isBonus}
                                onCheckedChange={(c) => setIsBonus(Boolean(c))}
                                disabled={isSubmitting}
                            />
                            <Label htmlFor="task-bonus" className="text-xs font-normal cursor-pointer">
                                Mark as Bonus Task (+5 ST reward)
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="task-desc">Description (Markdown Supported)</Label>
                        <Textarea
                            id="task-desc"
                            rows={4}
                            placeholder="Describe the challenge instructions, inputs, expected outputs..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {/* Rubric Fields (Must sum to 15) */}
                    <div className="space-y-3 rounded-lg border border-border p-3.5 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-semibold">
                                        Rubric Criteria
                                    </Label>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                                            isRubricValid
                                                ? "bg-success/15 text-success border border-success/30"
                                                : "bg-destructive/15 text-destructive border border-destructive/30"
                                        }`}
                                    >
                                        {rubricSum} / 15 points
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total max points across all fields must equal exactly 15.
                                </p>
                            </div>

                            <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={addRubricField}
                                disabled={isSubmitting}
                            >
                                <Plus className="size-3 mr-1" />
                                Add Criterion
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {rubricFields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Criterion name (e.g. Implementation)"
                                        value={field.fieldName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setRubricFields((prev) =>
                                                prev.map((f, i) => (i === idx ? { ...f, fieldName: val } : f))
                                            );
                                        }}
                                        disabled={isSubmitting}
                                        className="text-xs"
                                        required
                                    />
                                    <div className="flex items-center gap-1 shrink-0 w-24">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={15}
                                            value={field.maxPoints}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10) || 0;
                                                setRubricFields((prev) =>
                                                    prev.map((f, i) => (i === idx ? { ...f, maxPoints: val } : f))
                                                );
                                            }}
                                            disabled={isSubmitting}
                                            className="text-xs text-center"
                                            required
                                        />
                                        <span className="text-xs text-muted-foreground">pts</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon-xs"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => removeRubricField(idx)}
                                        disabled={rubricFields.length <= 1 || isSubmitting}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hints (0-3) */}
                    <div className="space-y-3 rounded-lg border border-border p-3.5 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">
                                    Hints (Optional, max 3)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Each hint has an ST cost students pay to unlock.
                                </p>
                            </div>

                            {hints.length < 3 && (
                                <Button
                                    type="button"
                                    size="xs"
                                    variant="outline"
                                    onClick={addHint}
                                    disabled={isSubmitting}
                                >
                                    <Plus className="size-3 mr-1" />
                                    Add Hint
                                </Button>
                            )}
                        </div>

                        {hints.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-1">
                                No hints added. (Students can still solve without hints).
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {hints.map((hint, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="flex-1 space-y-1">
                                            <Input
                                                placeholder={`Hint #${idx + 1} content`}
                                                value={hint.content}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setHints((prev) =>
                                                        prev.map((h, i) => (i === idx ? { ...h, content: val } : h))
                                                    );
                                                }}
                                                disabled={isSubmitting}
                                                className="text-xs"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 w-28">
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Cost"
                                                value={hint.cost}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10) || 0;
                                                    setHints((prev) =>
                                                        prev.map((h, i) => (i === idx ? { ...h, cost: val } : h))
                                                    );
                                                }}
                                                disabled={isSubmitting}
                                                className="text-xs text-center"
                                                required
                                            />
                                            <span className="text-xs text-muted-foreground">ST</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon-xs"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                                            onClick={() => removeHint(idx)}
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !isRubricValid}
                        >
                            {isSubmitting
                                ? "Saving..."
                                : isEditing
                                ? "Update Task"
                                : "Add Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
