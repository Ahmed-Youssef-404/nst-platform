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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createSessionAction } from "@/lib/actions/session-management";
import type { LevelForInstructor } from "@/lib/data/get-level-for-instructor";
import type {
    CreateHintInput,
    CreateTaskInput,
    SubmissionModeCode,
    TaskTypeCode,
} from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

// "ANY" is a UI-only sentinel meaning "student chooses freely" -> null
// on the wire. Kept as a string because Select needs a string value.
type SubmissionModeChoice = SubmissionModeCode | "ANY";

interface HintFormState {
    content: string;
    cost: string; // number input as string while editing
}

interface TaskFormState {
    key: string; // stable React key, not sent to the server
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: string; // datetime-local value
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeChoice;
    hints: [HintFormState, HintFormState, HintFormState];
}

function emptyHint(): HintFormState {
    return { content: "", cost: "0" };
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

        const taskInputs: CreateTaskInput[] = tasks.map((task) => {
            const hints: [CreateHintInput, CreateHintInput, CreateHintInput] = [
                { content: task.hints[0].content, cost: Number(task.hints[0].cost) || 0 },
                { content: task.hints[1].content, cost: Number(task.hints[1].cost) || 0 },
                { content: task.hints[2].content, cost: Number(task.hints[2].cost) || 0 },
            ];

            return {
                title: task.title,
                description: task.description,
                type: task.type,
                deadline: new Date(task.deadline),
                isBonus: task.isBonus,
                allowedSubmissionMode:
                    task.type === "EXTERNAL"
                        ? null
                        : task.allowedSubmissionMode === "ANY"
                          ? null
                          : task.allowedSubmissionMode,
                hints,
            };
        });

        setIsSubmitting(true);
        const result = await createSessionAction({
            levelId: level.id,
            title,
            startTime: new Date(startTime),
            durationMinutes: durationValue,
            recordingLink: recordingLink.trim() ? recordingLink.trim() : null,
            tasks: taskInputs,
        });
        setIsSubmitting(false);

        if (result.success && result.data) {
            router.push(`/instructor/sessions/${result.data.id}`);
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← {level.groupName}
                </Link>
                <h2 className="mt-1 text-xl font-semibold">
                    New Session — {level.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {level.batchName} / {level.groupName}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="session-title">Title</Label>
                        <Input
                            id="session-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="session-start">Start time</Label>
                            <Input
                                id="session-start"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="session-duration">Duration (minutes)</Label>
                            <Input
                                id="session-duration"
                                type="number"
                                min={1}
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {level.nextSessionStartTime && (
                        <p className="text-xs text-muted-foreground">
                            The next Session in this Level starts at{" "}
                            {formatDateTime(level.nextSessionStartTime)}. Task deadlines below
                            . Task deadlines below must land before that.
                        </p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="session-recording">Recording link (optional)</Label>
                        <Input
                            id="session-recording"
                            type="url"
                            placeholder="https://..."
                            value={recordingLink}
                            onChange={(e) => setRecordingLink(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                        Tasks {tasks.length > 0 && `(${tasks.length})`}
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addTask}>
                        + Add Task
                    </Button>
                </div>

                {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No Tasks yet. A Session can be created without Tasks, but Tasks
                        can never be added, edited, or removed after this Session is
                        created — make sure everything below is correct.
                    </p>
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

            {error && (
                <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
                    {error}
                </p>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Session"}
                </Button>
                <Link href="/instructor" className="text-sm text-muted-foreground hover:underline">
                    Cancel
                </Link>
            </div>
        </form>
    );
}

// ============================================
// TASK EDITOR
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
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Task {index + 1}</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                    Remove
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`task-${task.key}-title`}>Title</Label>
                    <Input
                        id={`task-${task.key}-title`}
                        value={task.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`task-${task.key}-description`}>Description</Label>
                    <Textarea
                        id={`task-${task.key}-description`}
                        value={task.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={task.type}
                            onValueChange={(value) => {
                                const type = value as TaskTypeCode;
                                onChange({
                                    type,
                                    // EXTERNAL tasks never have an allowedSubmissionMode
                                    allowedSubmissionMode:
                                        type === "EXTERNAL" ? "ANY" : task.allowedSubmissionMode,
                                });
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INTERNAL">Internal (has Submissions)</SelectItem>
                                <SelectItem value="EXTERNAL">External (link only)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`task-${task.key}-deadline`}>Deadline</Label>
                        <Input
                            id={`task-${task.key}-deadline`}
                            type="datetime-local"
                            value={task.deadline}
                            onChange={(e) => onChange({ deadline: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {task.type === "INTERNAL" && (
                    <div className="space-y-2">
                        <Label>Allowed submission mode</Label>
                        <Select
                            value={task.allowedSubmissionMode}
                            onValueChange={(value) =>
                                onChange({
                                    allowedSubmissionMode: value as SubmissionModeChoice,
                                })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANY">Student chooses freely</SelectItem>
                                <SelectItem value="FILE">File only (PDF/ZIP, max 5MB)</SelectItem>
                                <SelectItem value="LINK">Link only</SelectItem>
                                <SelectItem value="TEXT">Text only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`task-${task.key}-bonus`}
                        checked={task.isBonus}
                        onCheckedChange={(checked) => onChange({ isBonus: checked === true })}
                    />
                    <Label htmlFor={`task-${task.key}-bonus`}>Bonus task</Label>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                        Hints (exactly 3, required)
                    </p>
                    {task.hints.map((hint, hintIndex) => (
                        <div key={hintIndex} className="grid grid-cols-[1fr_auto] gap-2">
                            <div className="space-y-1">
                                <Label htmlFor={`task-${task.key}-hint-${hintIndex}`} className="text-xs">
                                    Hint {hintIndex + 1} content
                                </Label>
                                <Textarea
                                    id={`task-${task.key}-hint-${hintIndex}`}
                                    value={hint.content}
                                    onChange={(e) =>
                                        onHintChange(hintIndex, { content: e.target.value })
                                    }
                                    className="min-h-10"
                                    required
                                />
                            </div>
                            <div className="w-24 space-y-1">
                                <Label htmlFor={`task-${task.key}-hint-${hintIndex}-cost`} className="text-xs">
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
                                    required
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}