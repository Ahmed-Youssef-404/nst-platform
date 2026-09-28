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
import { MarkdownEditor } from "@/components/ui/markdown-editor";
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
    upcoming: {
        label: "Upcoming",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    ongoing: {
        label: "Live / Ongoing",
        badgeClass: "bg-success-500/15 text-success-400 border-success-500/30",
    },
    ended: {
        label: "Ended / Grading",
        badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    },
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
        <div className="space-y-8 animate-fade-in">
            {/* Top Bar Navigation & Actions */}
            <div className="space-y-3">
                <Link
                    href="/instructor"
                    className="inline-flex items-center gap-1.5 text-xs text-starlight-400 hover:text-gold-300 font-mono transition-colors"
                >
                    <ChevronLeft className="size-3.5" />
                    Back to dashboard
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-starlight-100">
                                {week.name}
                            </h1>
                            <Badge className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyle.badgeClass}`}>
                                {statusStyle.label}
                            </Badge>
                        </div>
                        <p className="mt-1 text-xs text-starlight-300 font-mono">
                            {week.groupName} · {week.batchName} (Beginner Track)
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                            className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-starlight-100 rounded-xl text-xs font-semibold"
                        >
                            <Pencil className="size-3.5 mr-1 text-gold-400" />
                            Edit Week Info
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs transition-all"
                            render={<Link href={`/instructor/weeks/${week.id}/grade`} />}
                        >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Grade Submissions
                        </Button>
                    </div>
                </div>
            </div>

            {actionError && (
                <div className="flex items-center gap-2.5 rounded-xl bg-error-500/10 p-3.5 text-xs text-error-400 border border-error-500/25">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{actionError}</span>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/80 bg-space-900/80 p-5 shadow-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-semibold text-starlight-400 uppercase tracking-wider mb-2">
                        <Clock className="size-3.5 text-gold-400" />
                        Schedule & Duration
                    </div>
                    <p className="text-sm font-bold font-display text-starlight-100">
                        {formatDateTime(week.startDate)}
                    </p>
                    <p className="text-xs text-starlight-400 font-mono mt-1">
                        Deadline: {formatDateTime(week.endDate)}
                    </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-space-900/80 p-5 shadow-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-semibold text-starlight-400 uppercase tracking-wider mb-2">
                        <FileText className="size-3.5 text-gold-400" />
                        Mandatory Deliverable
                    </div>
                    <p className="text-sm font-bold text-starlight-100 truncate" title={week.requiredFileLabel}>
                        {week.requiredFileLabel}
                    </p>
                    <a
                        href={week.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-semibold mt-1 transition-colors"
                    >
                        <ExternalLink className="size-3" />
                        Open Lecture Playlist
                    </a>
                </div>

                <div className="rounded-2xl border border-border/80 bg-space-900/80 p-5 shadow-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-semibold text-starlight-400 uppercase tracking-wider mb-2">
                        <Users className="size-3.5 text-gold-400" />
                        Student Progress
                    </div>
                    <p className="text-sm font-bold font-display text-starlight-100">
                        {week.students.length} Enrolled Students
                    </p>
                    <div className="flex items-center gap-2 text-xs text-starlight-400 font-mono mt-1">
                        <span>{uploadedResourceCount} uploaded</span>
                        <span>•</span>
                        <span>{lockedStudentCount} locked</span>
                        <span>•</span>
                        <span className="text-gold-400 font-semibold">{finalizedStudentCount} graded</span>
                    </div>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <h2 className="font-display text-xl font-bold text-starlight-100">
                            Tasks & Challenges
                        </h2>
                        <span className="rounded-full bg-space-800 border border-border/80 px-2.5 py-0.5 text-xs font-mono text-starlight-300">
                            {week.tasks.length} {week.tasks.length === 1 ? "task" : "tasks"}
                        </span>
                    </div>

                    {week.canEditTasks ? (
                        <Button
                            size="sm"
                            className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs transition-all"
                            onClick={() =>
                                setTaskModalState({ isOpen: true, taskToEdit: null })
                            }
                        >
                            <Plus className="size-3.5 mr-1" />
                            Add Task
                        </Button>
                    ) : (
                        <Badge className="bg-space-850 text-starlight-400 border-border/80 gap-1.5 text-xs py-1 px-3 rounded-full">
                            <Lock className="size-3 text-gold-400" />
                            Tasks Locked (Week Started)
                        </Badge>
                    )}
                </div>

                {!week.canEditTasks && (
                    <div className="rounded-xl bg-space-900/60 border border-border/70 p-3.5 flex items-start gap-2.5 text-xs text-starlight-300">
                        <Info className="size-4 text-gold-400 shrink-0 mt-0.5" />
                        <span>
                            This week has already begun. In accordance with system policy, task descriptions, hints, and rubric criteria are locked to protect ongoing student submissions.
                        </span>
                    </div>
                )}

                {week.tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-space-900/50 p-12 text-center backdrop-blur-md">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-space-850 border border-border/80 text-gold-400 mb-3 shadow-gold">
                            <Lightbulb className="size-6" />
                        </div>
                        <p className="text-sm font-bold text-starlight-100">
                            No tasks created for this week yet
                        </p>
                        <p className="text-xs text-starlight-400 max-w-sm mt-1 mb-4">
                            Add coding tasks, hints, and rubric criteria (up to 15 points total per task) for your students.
                        </p>
                        {week.canEditTasks && (
                            <Button
                                size="sm"
                                className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs transition-all"
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
        <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-gold-500/30">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 border-b border-border/70 bg-space-950/40">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-md">
                            Task #{index}
                        </span>
                        <CardTitle className="text-base font-bold text-starlight-100 font-display">
                            {task.title}
                        </CardTitle>
                        <Badge className="bg-space-850 text-starlight-300 border-border/80 text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {task.type}
                        </Badge>
                        {task.isBonus && (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                Bonus (+5 ST)
                            </Badge>
                        )}
                        {task.allowedSubmissionMode && (
                            <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                                {task.allowedSubmissionMode} only
                            </Badge>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onEdit}
                            title="Edit task"
                            className="size-8 p-0 text-starlight-300 hover:text-gold-300 hover:bg-space-800 rounded-lg transition-colors"
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-error-400 hover:text-error-300 hover:bg-error-500/10 rounded-lg transition-colors"
                            onClick={onDelete}
                            disabled={isDeleting}
                            title="Delete task"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
                <MarkdownContent
                    content={task.description}
                    className="text-starlight-300 text-xs leading-relaxed"
                />

                {/* Rubric Fields Summary */}
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-starlight-100 flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-gold-400" />
                            Rubric Criteria (15 Points Total)
                        </span>
                        <span className="text-starlight-400 font-mono text-[11px]">
                            {task.rubricFields.length} criteria
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {task.rubricFields.map((field) => (
                            <div
                                key={field.id}
                                className="flex items-center justify-between rounded-lg bg-space-850/80 border border-border/70 px-3 py-2 text-xs"
                            >
                                <span className="font-medium text-starlight-200 truncate max-w-[140px]">
                                    {field.fieldName}
                                </span>
                                <span className="font-mono font-bold text-gold-400 text-[11px] bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">
                                    {field.maxPoints} pts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hints Summary */}
                {task.hints.length > 0 && (
                    <div className="space-y-2 pt-1">
                        <p className="text-xs font-bold text-starlight-300 flex items-center gap-1.5">
                            <Lightbulb className="size-3.5 text-gold-400" />
                            Hints ({task.hints.length})
                        </p>
                        <div className="space-y-1.5">
                            {task.hints.map((hint) => (
                                <div
                                    key={hint.id}
                                    className="flex items-start justify-between gap-2.5 text-xs rounded-xl border border-border/60 bg-space-950/50 p-2.5 text-starlight-300"
                                >
                                    <span>
                                        <strong className="text-gold-300 font-mono">
                                            Hint #{hint.order}:
                                        </strong>{" "}
                                        {hint.content}
                                    </span>
                                    <Badge className="shrink-0 text-[10px] font-mono bg-space-850 text-starlight-300 border-border/80">
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
            <DialogContent className="sm:max-w-lg bg-space-900/95 border-border/80 text-starlight-100 rounded-2xl backdrop-blur-xl shadow-4">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold text-starlight-100">
                        Edit Week Details
                    </DialogTitle>
                    <DialogDescription className="text-xs text-starlight-400">
                        Update the title, lecture playlist, and deliverable guidelines.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdate} className="space-y-4 pt-2">
                    {error && (
                        <div className="flex items-center gap-2 rounded-xl bg-error-500/10 p-3 text-xs text-error-400 border border-error-500/25">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-name" className="text-xs font-semibold text-starlight-200">
                            Week Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-xs"
                            required
                        />
                    </div>

                    {week.canEditDates ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-start" className="text-xs font-semibold text-starlight-200">
                                    Start Date
                                </Label>
                                <Input
                                    id="edit-start"
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-end" className="text-xs font-semibold text-starlight-200">
                                    End Date
                                </Label>
                                <Input
                                    id="edit-end"
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-xs"
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-space-950/60 border border-border/70 p-3 text-xs text-starlight-400 flex items-center gap-2">
                            <Lock className="size-3.5 text-gold-400 shrink-0" />
                            <span>Start and End dates are locked because the week has begun.</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-playlist" className="text-xs font-semibold text-starlight-200">
                            Playlist URL
                        </Label>
                        <Input
                            id="edit-playlist"
                            type="url"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            disabled={isSubmitting}
                            className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-resource-label" className="text-xs font-semibold text-starlight-200">
                            Required File Label
                        </Label>
                        <Input
                            id="edit-resource-label"
                            value={requiredFileLabel}
                            onChange={(e) => setRequiredFileLabel(e.target.value)}
                            disabled={isSubmitting}
                            className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-xs"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-300 rounded-xl text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs"
                        >
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
            <DialogContent className="sm:max-w-2xl bg-space-900/95 border-border/80 text-starlight-100 rounded-2xl backdrop-blur-xl shadow-4 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold text-starlight-100">
                        {isEditing ? "Edit Task" : "Add New Task"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-starlight-400">
                        Configure description, submission criteria, hints, and 15-point rubric breakdown.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {error && (
                        <div className="flex items-center gap-2 rounded-xl bg-error-500/10 p-3 text-xs text-error-400 border border-error-500/25">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="task-title" className="text-xs font-semibold text-starlight-200">
                            Task Title
                        </Label>
                        <Input
                            id="task-title"
                            placeholder="e.g. Reverse a Linked List"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isSubmitting}
                            className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-xs"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-starlight-200">
                                Task Type
                            </Label>
                            <Select
                                value={type}
                                onValueChange={(val) => setType(val as TaskTypeCode)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-space-900 border-border/80 text-starlight-100">
                                    <SelectItem value="INTERNAL">Internal (Platform Task)</SelectItem>
                                    <SelectItem value="EXTERNAL">External (LeetCode / Codeforces)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === "INTERNAL" && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-starlight-200">
                                    Allowed Submission Mode
                                </Label>
                                <Select
                                    value={allowedSubmissionMode}
                                    onValueChange={(val) =>
                                        setAllowedSubmissionMode(val as SubmissionModeCode | "ANY")
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-space-900 border-border/80 text-starlight-100">
                                        <SelectItem value="ANY">Any (Code, File, or Link)</SelectItem>
                                        <SelectItem value="CODE">Code Editor only</SelectItem>
                                        <SelectItem value="FILE">File Upload only</SelectItem>
                                        <SelectItem value="LINK">External Link only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                            id="is-bonus"
                            checked={isBonus}
                            onCheckedChange={(c) => setIsBonus(Boolean(c))}
                            disabled={isSubmitting}
                        />
                        <Label htmlFor="is-bonus" className="text-xs font-semibold text-starlight-200 cursor-pointer">
                            Bonus Task (+5 ST reward for students who solve it)
                        </Label>
                    </div>

                    <div className="space-y-1.5">
                        <MarkdownEditor
                            id="task-description"
                            label="Task Description"
                            placeholder="Provide the problem statement, constraints, code snippets, and instructions in Markdown..."
                            value={description}
                            onChange={(val) => setDescription(val)}
                            disabled={isSubmitting}
                            rows={5}
                            required
                        />
                    </div>

                    {/* Rubric Criteria Builder (Mandatory: Sum = 15) */}
                    <div className="rounded-xl border border-border/80 bg-space-950/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-xs font-bold text-starlight-100 flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-gold-400" />
                                    Rubric Criteria
                                </Label>
                                <p className="text-[11px] text-starlight-400">
                                    Sum of criterion points must equal exactly 15.
                                </p>
                            </div>

                            <span
                                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                                    isRubricValid
                                        ? "bg-success-500/15 text-success-400 border-success-500/30"
                                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                }`}
                            >
                                Total: {rubricSum} / 15 pts
                            </span>
                        </div>

                        <div className="space-y-2">
                            {rubricFields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        placeholder={`Criterion #${idx + 1} (e.g. Logic)`}
                                        value={field.fieldName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setRubricFields((prev) =>
                                                prev.map((f, i) =>
                                                    i === idx ? { ...f, fieldName: val } : f
                                                )
                                            );
                                        }}
                                        disabled={isSubmitting}
                                        className="bg-space-850/80 border-border/80 text-starlight-100 text-xs rounded-xl"
                                        required
                                    />
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={15}
                                            value={field.maxPoints}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10) || 0;
                                                setRubricFields((prev) =>
                                                    prev.map((f, i) =>
                                                        i === idx ? { ...f, maxPoints: val } : f
                                                    )
                                                );
                                            }}
                                            disabled={isSubmitting}
                                            className="w-16 text-center text-xs font-mono bg-space-850/80 border-border/80 text-starlight-100 rounded-xl"
                                            required
                                        />
                                        <span className="text-[11px] text-starlight-400">pts</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="size-8 p-0 text-starlight-400 hover:text-error-400 hover:bg-space-800 rounded-lg shrink-0"
                                        onClick={() => removeRubricField(idx)}
                                        disabled={isSubmitting || rubricFields.length <= 1}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addRubricField}
                            disabled={isSubmitting}
                            className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-300 rounded-xl text-xs font-semibold"
                        >
                            <Plus className="size-3 mr-1" />
                            Add Criterion
                        </Button>
                    </div>

                    {/* Hints Builder (0 to 3) */}
                    <div className="rounded-xl border border-border/80 bg-space-950/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-xs font-bold text-starlight-100 flex items-center gap-1.5">
                                    <Lightbulb className="size-3.5 text-gold-400" />
                                    Hints ({hints.length}/3)
                                </Label>
                                <p className="text-[11px] text-starlight-400">
                                    Progressive hints students can unlock with ST.
                                </p>
                            </div>

                            {hints.length < 3 && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addHint}
                                    disabled={isSubmitting}
                                    className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-300 rounded-xl text-xs font-semibold"
                                >
                                    <Plus className="size-3 mr-1" />
                                    Add Hint
                                </Button>
                            )}
                        </div>

                        {hints.length === 0 ? (
                            <p className="text-[11px] text-starlight-400 italic">
                                No hints added. (Optional, up to 3 hints)
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {hints.map((hint, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            placeholder={`Hint #${idx + 1} text`}
                                            value={hint.content}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setHints((prev) =>
                                                    prev.map((h, i) =>
                                                        i === idx ? { ...h, content: val } : h
                                                    )
                                                );
                                            }}
                                            disabled={isSubmitting}
                                            className="bg-space-850/80 border-border/80 text-starlight-100 text-xs rounded-xl"
                                            required
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={hint.cost}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10) || 0;
                                                    setHints((prev) =>
                                                        prev.map((h, i) =>
                                                            i === idx ? { ...h, cost: val } : h
                                                        )
                                                    );
                                                }}
                                                disabled={isSubmitting}
                                                className="w-16 text-center text-xs font-mono bg-space-850/80 border-border/80 text-starlight-100 rounded-xl"
                                                required
                                            />
                                            <span className="text-[11px] text-starlight-400">ST</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="size-8 p-0 text-starlight-400 hover:text-error-400 hover:bg-space-800 rounded-lg shrink-0"
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

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-300 rounded-xl text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !isRubricValid}
                            className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs"
                        >
                            {isSubmitting ? "Saving..." : isEditing ? "Save Task" : "Create Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
