// src/app/instructor/sessions/new/create-session-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar,
    Clock,
    ChevronLeft,
    Sparkles,
    AlertCircle,
    Plus,
    Trash2,
    Layers,
    FileText,
    Lightbulb,
    Link as LinkIcon,
    Video,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { createSessionAction } from "@/lib/actions/session-management";
import type { LevelForInstructor } from "@/lib/data/get-level-for-instructor";
import type {
    CreateHintInput,
    CreateTaskInput,
    SubmissionModeCode,
    TaskTypeCode,
    TaskRubricFieldInput,
} from "@/types/types";
import { formatDateTime } from "@/lib/format-date";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

// "ANY" is a UI-only sentinel meaning "student chooses freely" -> null
type SubmissionModeChoice = SubmissionModeCode | "ANY";

interface HintFormState {
    content: string;
    cost: string; // number input as string while editing
}

interface RubricFieldFormState {
    id: string; // stable React key
    fieldName: string;
    maxPoints: string;
}

interface TaskFormState {
    key: string; // stable React key
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: string; // datetime-local value
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeChoice;
    rubricFields: RubricFieldFormState[];
    hints: [HintFormState, HintFormState, HintFormState];
}

function emptyHint(): HintFormState {
    return { content: "", cost: "0" };
}

function defaultRubricFields(): RubricFieldFormState[] {
    return [
        { id: crypto.randomUUID(), fieldName: "Core Logic & Implementation", maxPoints: "5" },
        { id: crypto.randomUUID(), fieldName: "Code Quality & Structure", maxPoints: "5" },
        { id: crypto.randomUUID(), fieldName: "Problem Solving & Edge Cases", maxPoints: "5" },
    ];
}

function emptyTask(): TaskFormState {
    return {
        key: crypto.randomUUID(),
        title: "",
        description: "",
        type: "INTERNAL",
        deadline: "",
        isBonus: false,
        allowedSubmissionMode: "ANY",
        rubricFields: defaultRubricFields(),
        hints: [emptyHint(), emptyHint(), emptyHint()],
    };
}

export function CreateSessionForm({ level }: { level: LevelForInstructor }) {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("60");
    const [recordingLink, setRecordingLink] = useState("");
    const [tasks, setTasks] = useState<TaskFormState[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track if form is dirty for unsaved changes guard
    const isDirty =
        title.trim().length > 0 ||
        startTime.length > 0 ||
        recordingLink.trim().length > 0 ||
        tasks.length > 0;

    useUnsavedChanges(isDirty && !isSubmitting);

    function updateTask(index: number, patch: Partial<TaskFormState>) {
        setTasks((prev) =>
            prev.map((task, i) => (i === index ? { ...task, ...patch } : task))
        );
    }

    function updateHint(taskIndex: number, hintIndex: number, patch: Partial<HintFormState>) {
        setTasks((prev) =>
            prev.map((task, i) => {
                if (i !== taskIndex) return task;
                const hints = [...task.hints] as [HintFormState, HintFormState, HintFormState];
                hints[hintIndex] = { ...hints[hintIndex], ...patch };
                return { ...task, hints };
            })
        );
    }

    function addTask() {
        setTasks((prev) => [...prev, emptyTask()]);
    }

    function removeTask(index: number) {
        setTasks((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const durationValue = Number(durationMinutes);
        if (!startTime) {
            setError("Session start time is required.");
            return;
        }
        if (!Number.isFinite(durationValue) || durationValue <= 0) {
            setError("Duration must be a positive number of minutes.");
            return;
        }

        // Validate each task
        for (const [tIdx, task] of tasks.entries()) {
            if (!task.title.trim()) {
                setError(`Task #${tIdx + 1} must have a title.`);
                return;
            }
            if (!task.deadline) {
                setError(`Task #${tIdx + 1} (${task.title || "Untitled"}) must have a deadline.`);
                return;
            }

            // Rubric validation
            const rubricTotal = task.rubricFields.reduce(
                (sum, f) => sum + (Number(f.maxPoints) || 0),
                0
            );
            if (rubricTotal !== 15) {
                setError(
                    `Task #${tIdx + 1} rubric criteria points sum to ${rubricTotal}, but must equal exactly 15.`
                );
                return;
            }
            for (const f of task.rubricFields) {
                if (!f.fieldName.trim()) {
                    setError(`All criteria in Task #${tIdx + 1} must have a name.`);
                    return;
                }
            }

            // Hints validation
            for (let h = 0; h < 3; h++) {
                if (!task.hints[h].content.trim()) {
                    setError(`Task #${tIdx + 1} must have all 3 hints filled out.`);
                    return;
                }
            }
        }

        const taskInputs: CreateTaskInput[] = tasks.map((task) => {
            const hints: [CreateHintInput, CreateHintInput, CreateHintInput] = [
                { content: task.hints[0].content, cost: Number(task.hints[0].cost) || 0 },
                { content: task.hints[1].content, cost: Number(task.hints[1].cost) || 0 },
                { content: task.hints[2].content, cost: Number(task.hints[2].cost) || 0 },
            ];

            const rubricFields: TaskRubricFieldInput[] = task.rubricFields.map((f, i) => ({
                fieldName: f.fieldName.trim(),
                maxPoints: Number(f.maxPoints) || 0,
                order: i + 1,
            }));

            return {
                title: task.title.trim(),
                description: task.description.trim(),
                type: task.type,
                deadline: new Date(task.deadline),
                isBonus: task.isBonus,
                allowedSubmissionMode:
                    task.type === "EXTERNAL"
                        ? null
                        : task.allowedSubmissionMode === "ANY"
                          ? null
                          : task.allowedSubmissionMode,
                rubricFields,
                hints,
            };
        });

        setIsSubmitting(true);
        try {
            const result = await createSessionAction({
                levelId: level.id,
                title: title.trim(),
                startTime: new Date(startTime),
                durationMinutes: durationValue,
                recordingLink: recordingLink.trim() ? recordingLink.trim() : null,
                tasks: taskInputs,
            });

            if (result.success && result.data) {
                router.push(`/instructor/sessions/${result.data.id}`);
            } else {
                setError(result.error ?? "Something went wrong. Please try again.");
                setIsSubmitting(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-16">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/instructor"
                        className="inline-flex items-center gap-1.5 text-xs text-starlight-400 hover:text-gold-300 transition-colors mb-2"
                    >
                        <ChevronLeft className="size-3.5" />
                        Back to Instructor Dashboard
                    </Link>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100 flex items-center gap-2.5">
                        Create New Session
                        <span className="rounded-md bg-gold-500/10 px-2 py-0.5 text-xs font-semibold text-gold-400 border border-gold-500/20 font-mono">
                            {level.name}
                        </span>
                    </h1>
                    <p className="mt-1 text-xs text-starlight-300 font-mono">
                        {level.batchName} · {level.groupName} (Intermediate Track)
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80 bg-space-850 hover:bg-space-750 text-starlight-300 hover:text-starlight-100 rounded-xl text-xs font-semibold self-start sm:self-auto"
                    render={<Link href="/instructor" />}
                >
                    Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Session Configuration Card */}
                <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-3 backdrop-blur-md overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/70 bg-space-950/40">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-gold-400" />
                            <CardTitle className="text-base font-bold font-display text-starlight-100">
                                Session Details & Schedule
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs text-starlight-400">
                            Configure the live session schedule, duration, and optional recording link.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-error-500/10 p-3.5 text-xs text-error-400 border border-error-500/25">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="session-title" className="text-xs font-semibold text-starlight-200">
                                Session Title
                            </Label>
                            <Input
                                id="session-title"
                                placeholder="e.g. Session 3: Dynamic Programming & Memoization"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="session-start" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                    <Calendar className="size-3.5 text-gold-400" />
                                    Start Time
                                </Label>
                                <Input
                                    id="session-start"
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="session-duration" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                    <Clock className="size-3.5 text-gold-400" />
                                    Duration (Minutes)
                                </Label>
                                <Input
                                    id="session-duration"
                                    type="number"
                                    min={1}
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {level.nextSessionStartTime && (
                            <p className="text-xs text-starlight-400 bg-space-950/60 p-3 rounded-xl border border-border/60">
                                <span className="text-gold-400 font-semibold">Note:</span> The next Session in this Level is scheduled for{" "}
                                <span className="font-mono text-starlight-200">{formatDateTime(level.nextSessionStartTime)}</span>. Task deadlines should precede it.
                            </p>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="session-recording" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                <Video className="size-3.5 text-gold-400" />
                                Recording Link (Optional)
                            </Label>
                            <Input
                                id="session-recording"
                                type="url"
                                placeholder="https://..."
                                value={recordingLink}
                                onChange={(e) => setRecordingLink(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Section Header & List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-display text-base font-bold text-starlight-100 flex items-center gap-2">
                                <Layers className="size-4 text-gold-400" />
                                Session Tasks {tasks.length > 0 && <span className="font-mono text-xs text-starlight-400">({tasks.length})</span>}
                            </h3>
                            <p className="text-xs text-starlight-400 mt-0.5">
                                Add programming problems or missions for students to solve. Each task has a 15-point rubric.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTask}
                            className="border-gold-500/40 bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                            <Plus className="size-3.5" />
                            Add Task
                        </Button>
                    </div>

                    {tasks.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-8 text-center space-y-3">
                            <Layers className="size-8 mx-auto text-starlight-500 opacity-60" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-starlight-200">No Tasks Added Yet</p>
                                <p className="text-xs text-starlight-400 max-w-md mx-auto">
                                    You can create a session without tasks, but tasks cannot be added or edited after creation. Click &ldquo;Add Task&rdquo; to attach problems now.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTask}
                                className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs"
                            >
                                <Plus className="size-3.5 mr-1" />
                                Add First Task
                            </Button>
                        </div>
                    )}

                    {tasks.map((task, index) => (
                        <TaskEditor
                            key={task.key}
                            index={index}
                            task={task}
                            onChange={(patch) => updateTask(index, patch)}
                            onHintChange={(hintIndex, patch) => updateHint(index, hintIndex, patch)}
                            onRemove={() => removeTask(index)}
                        />
                    ))}
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center gap-3 pt-3">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gold-500 hover:bg-gold-450 text-space-950 font-bold px-6 py-2.5 rounded-xl shadow-gold transition-all flex items-center gap-2 text-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Creating Session...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4" />
                                Create Session
                            </>
                        )}
                    </Button>
                    <Link
                        href="/instructor"
                        className="text-xs text-starlight-400 hover:text-starlight-200 transition-colors font-medium px-3 py-2"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

// ============================================
// TASK EDITOR COMPONENT
// ============================================

function TaskEditor({
    index,
    task,
    onChange,
    onHintChange,
    onRemove,
}: {
    index: number;
    task: TaskFormState;
    onChange: (patch: Partial<TaskFormState>) => void;
    onHintChange: (hintIndex: number, patch: Partial<HintFormState>) => void;
    onRemove: () => void;
}) {
    const rubricSum = task.rubricFields.reduce(
        (acc, f) => acc + (Number(f.maxPoints) || 0),
        0
    );
    const isRubricValid = rubricSum === 15;

    function addRubricField() {
        onChange({
            rubricFields: [
                ...task.rubricFields,
                { id: crypto.randomUUID(), fieldName: "", maxPoints: "5" },
            ],
        });
    }

    function removeRubricField(fieldId: string) {
        if (task.rubricFields.length <= 1) return;
        onChange({
            rubricFields: task.rubricFields.filter((f) => f.id !== fieldId),
        });
    }

    function updateRubricField(fieldId: string, patch: Partial<RubricFieldFormState>) {
        onChange({
            rubricFields: task.rubricFields.map((f) =>
                f.id === fieldId ? { ...f, ...patch } : f
            ),
        });
    }

    return (
        <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden animate-fade-in">
            <CardHeader className="p-5 border-b border-border/70 bg-space-950/40 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400 font-mono text-xs font-bold border border-gold-500/25">
                        {index + 1}
                    </span>
                    <CardTitle className="text-sm font-bold font-display text-starlight-100">
                        {task.title.trim() ? task.title : `Task ${index + 1}`}
                    </CardTitle>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-starlight-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-8"
                >
                    <Trash2 className="size-3.5 mr-1" />
                    Remove Task
                </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                    <Label htmlFor={`task-${task.key}-title`} className="text-xs font-semibold text-starlight-200">
                        Task Title
                    </Label>
                    <Input
                        id={`task-${task.key}-title`}
                        placeholder="e.g. Implement Fibonacci with Memoization"
                        value={task.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        className="bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 focus-visible:border-gold-500 rounded-xl text-sm"
                        required
                    />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <MarkdownEditor
                        id={`task-${task.key}-description`}
                        label="Description & Instructions"
                        placeholder="Write task details, constraints, examples in Markdown..."
                        value={task.description}
                        onChange={(val) => onChange({ description: val })}
                        rows={4}
                        required
                    />
                </div>

                {/* Type & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-starlight-200">Task Type</Label>
                        <Select
                            value={task.type}
                            onValueChange={(value) => {
                                const type = value as TaskTypeCode;
                                onChange({
                                    type,
                                    allowedSubmissionMode:
                                        type === "EXTERNAL" ? "ANY" : task.allowedSubmissionMode,
                                });
                            }}
                        >
                            <SelectTrigger className="w-full bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-space-900 border-border text-starlight-100">
                                <SelectItem value="INTERNAL">Internal (Direct NST Submissions)</SelectItem>
                                <SelectItem value="EXTERNAL">External (Link Only)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`task-${task.key}-deadline`} className="text-xs font-semibold text-starlight-200">
                            Submission Deadline
                        </Label>
                        <Input
                            id={`task-${task.key}-deadline`}
                            type="datetime-local"
                            value={task.deadline}
                            onChange={(e) => onChange({ deadline: e.target.value })}
                            className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 rounded-xl text-sm"
                            required
                        />
                    </div>
                </div>

                {/* Submission Mode (Internal tasks) */}
                {task.type === "INTERNAL" && (
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-starlight-200">Allowed Submission Format</Label>
                        <Select
                            value={task.allowedSubmissionMode}
                            onValueChange={(value) =>
                                onChange({
                                    allowedSubmissionMode: value as SubmissionModeChoice,
                                })
                            }
                        >
                            <SelectTrigger className="w-full bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-space-900 border-border text-starlight-100">
                                <SelectItem value="ANY">Student chooses freely (File, Link, or Text)</SelectItem>
                                <SelectItem value="FILE">File only (PDF/ZIP, max 5MB)</SelectItem>
                                <SelectItem value="LINK">Link only (GitHub / PR / Repo)</SelectItem>
                                <SelectItem value="TEXT">Direct Text only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Bonus Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                        id={`task-${task.key}-bonus`}
                        checked={task.isBonus}
                        onCheckedChange={(checked) => onChange({ isBonus: checked === true })}
                    />
                    <Label htmlFor={`task-${task.key}-bonus`} className="text-xs text-starlight-200 cursor-pointer flex items-center gap-1.5">
                        <Sparkles className="size-3 text-amber-400" />
                        Bonus Task (+10 ST extra award)
                    </Label>
                </div>

                {/* Dynamic Rubric Builder (15 Points Total) */}
                <div className="space-y-3 rounded-xl border border-border/70 bg-space-950/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                        <div className="flex items-center gap-2">
                            <Layers className="size-4 text-gold-400" />
                            <div>
                                <span className="text-xs font-bold text-starlight-100 block">
                                    Grading Rubric Criteria
                                </span>
                                <span className="text-[11px] text-starlight-400">
                                    Criteria points must sum to exactly 15.
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                    isRubricValid
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                        : "bg-red-500/15 text-red-400 border-red-500/30"
                                }`}
                            >
                                Total: {rubricSum} / 15 pts {isRubricValid ? "✓" : "(!)"}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRubricField}
                                className="h-7 text-xs border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-lg px-2"
                            >
                                <Plus className="size-3 mr-1" />
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {task.rubricFields.map((field, fIdx) => (
                            <div
                                key={field.id}
                                className="grid grid-cols-[1fr_80px_auto] gap-2 items-center bg-space-900/60 p-2.5 rounded-xl border border-border/50"
                            >
                                <Input
                                    placeholder={`Criterion #${fIdx + 1} name`}
                                    value={field.fieldName}
                                    onChange={(e) =>
                                        updateRubricField(field.id, { fieldName: e.target.value })
                                    }
                                    className="h-8 text-xs bg-space-850/80 border-border/70 text-starlight-100 rounded-lg"
                                    required
                                />
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={15}
                                        value={field.maxPoints}
                                        onChange={(e) =>
                                            updateRubricField(field.id, { maxPoints: e.target.value })
                                        }
                                        className="h-8 text-xs font-mono text-center bg-space-850/80 border-border/70 text-gold-300 rounded-lg"
                                        required
                                    />
                                    <span className="text-[10px] text-starlight-400 font-mono">pts</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeRubricField(field.id)}
                                    disabled={task.rubricFields.length <= 1}
                                    className="h-8 w-8 p-0 text-starlight-400 hover:text-red-400 rounded-lg"
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tactical Hints (3 Required) */}
                <div className="space-y-3 rounded-xl border border-border/70 bg-space-950/40 p-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-starlight-100">
                            <Lightbulb className="size-3.5 text-amber-400" />
                            Tactical Hints (3 Required)
                        </div>
                        <span className="text-[11px] text-starlight-400 font-mono">
                            Students spend ST to unlock
                        </span>
                    </div>

                    <div className="space-y-3">
                        {task.hints.map((hint, hintIndex) => (
                            <div
                                key={hintIndex}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2.5 bg-space-900/60 p-3 rounded-xl border border-border/50"
                            >
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={`task-${task.key}-hint-${hintIndex}`}
                                        className="text-[11px] font-semibold text-starlight-300 flex items-center gap-1"
                                    >
                                        <span className="font-mono text-gold-400">Hint #{hintIndex + 1}</span> Content
                                    </Label>
                                    <Textarea
                                        id={`task-${task.key}-hint-${hintIndex}`}
                                        placeholder={`Hint ${hintIndex + 1} guidance or clue...`}
                                        value={hint.content}
                                        onChange={(e) =>
                                            onHintChange(hintIndex, { content: e.target.value })
                                        }
                                        className="min-h-12 text-xs bg-space-850/80 border-border/70 text-starlight-100 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={`task-${task.key}-hint-${hintIndex}-cost`}
                                        className="text-[11px] font-semibold text-starlight-300"
                                    >
                                        Cost (ST)
                                    </Label>
                                    <Input
                                        id={`task-${task.key}-hint-${hintIndex}-cost`}
                                        type="number"
                                        min={0}
                                        value={hint.cost}
                                        onChange={(e) =>
                                            onHintChange(hintIndex, { cost: e.target.value })
                                        }
                                        className="h-9 text-xs font-mono bg-space-850/80 border-border/70 text-starlight-100 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}