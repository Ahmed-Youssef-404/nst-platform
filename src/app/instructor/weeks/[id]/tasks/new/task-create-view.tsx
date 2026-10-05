// src/app/instructor/weeks/[id]/tasks/new/task-create-view.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Sparkles,
    Lightbulb,
    Plus,
    Trash2,
    AlertCircle,
    CheckCircle2,
    BookOpen,
    Layers,
    FileText,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { showToast } from "@/components/ui/toast";
import { addTaskToWeekAction } from "@/lib/actions/week-management";
import type { TaskTypeCode, SubmissionModeCode } from "@/types/types";
import type { WeekDetailForInstructor } from "@/lib/data/get-week-detail";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

export function TaskCreateView({ week }: { week: WeekDetailForInstructor }) {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<TaskTypeCode>("INTERNAL");
    const [isBonus, setIsBonus] = useState(false);
    const [allowedSubmissionMode, setAllowedSubmissionMode] = useState<
        SubmissionModeCode | "ANY"
    >("ANY");

    const [hints, setHints] = useState<{ content: string; cost: number }[]>([]);

    const [rubricFields, setRubricFields] = useState<
        { fieldName: string; maxPoints: number }[]
    >([
        { fieldName: "Implementation", maxPoints: 5 },
        { fieldName: "Approach & Clean Code", maxPoints: 5 },
        { fieldName: "Correctness", maxPoints: 5 },
    ]);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDirty =
        title.trim().length > 0 ||
        description.trim().length > 0 ||
        hints.length > 0;
    useUnsavedChanges(isDirty && !isSubmitting);

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

            const res = await addTaskToWeekAction({
                weekId: week.id,
                ...taskPayload,
            });

            if (!res.success) {
                setError(res.error ?? "Failed to add task.");
                setIsSubmitting(false);
                return;
            }

            showToast({
                title: "Task Created Successfully",
                description: `"${title.trim()}" has been published to ${week.name}.`,
                type: "success",
            });

            router.push(`/instructor/weeks/${week.id}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error saving task.");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in pb-16">
            {/* Top Navigation & Header */}
            <div className="space-y-3 border-b border-border/70 pb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                        href={`/instructor/weeks/${week.id}`}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                    >
                        <ChevronLeft className="size-3.5" />
                        <span>Back to {week.name}</span>
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-semibold">New Task</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/25">
                                <Sparkles className="size-3.5 text-gold-500" />
                                <span>Task Authoring Suite</span>
                            </span>
                        </div>
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-2">
                            Create New Task
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Author challenge requirements, evaluation rubric criteria, and tactical hint unlocks for{" "}
                            <span className="text-foreground font-semibold">{week.name}</span> ({week.groupName}).
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-semibold"
                            onClick={() => router.push(`/instructor/weeks/${week.id}`)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="task-create-form"
                            size="sm"
                            disabled={isSubmitting || !isRubricValid}
                            className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs px-5"
                        >
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-4 text-xs font-medium text-destructive border border-destructive/25 shadow-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form id="task-create-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Basic Specifications */}
                <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-1">
                    <CardHeader className="border-b border-border/60 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                <Settings className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="font-display text-base text-foreground">
                                    Task Specifications & Modality
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    General classification, submission format, and scoring rewards.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="task-title" className="text-xs font-semibold text-foreground/90">
                                Task Title
                            </Label>
                            <Input
                                id="task-title"
                                placeholder="e.g. Reverse a Linked List with O(1) Memory"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 focus-visible:border-gold-500/50 rounded-xl"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-foreground/90">
                                    Task Type
                                </Label>
                                <Select
                                    value={type}
                                    onValueChange={(val) => setType(val as TaskTypeCode)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="w-full bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 rounded-xl text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="INTERNAL">Internal (Platform Task)</SelectItem>
                                        <SelectItem value="EXTERNAL">External (LeetCode / Codeforces / HackerRank)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {type === "INTERNAL" && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-foreground/90">
                                        Allowed Submission Mode
                                    </Label>
                                    <Select
                                        value={allowedSubmissionMode}
                                        onValueChange={(val) =>
                                            setAllowedSubmissionMode(val as SubmissionModeCode | "ANY")
                                        }
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger className="w-full bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="ANY">Any (Code, File, or Link)</SelectItem>
                                            <SelectItem value="CODE">Code Editor only</SelectItem>
                                            <SelectItem value="FILE">File Upload only</SelectItem>
                                            <SelectItem value="LINK">External Link only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/20">
                            <Checkbox
                                id="is-bonus"
                                checked={isBonus}
                                onCheckedChange={(c) => setIsBonus(Boolean(c))}
                                disabled={isSubmitting}
                            />
                            <div>
                                <Label htmlFor="is-bonus" className="text-xs font-semibold text-foreground cursor-pointer">
                                    Mark as Bonus Challenge (+5 ST Reward)
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                    Bonus tasks provide extra Space Tokens and accelerate student leaderboard standing.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Problem Description */}
                <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-1">
                    <CardHeader className="border-b border-border/60 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="font-display text-base text-foreground">
                                    Problem Statement & Instructions
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Full Markdown documentation of problem requirements, input/output constraints, and test scenarios.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <MarkdownEditor
                            id="task-description"
                            label="Task Description (Markdown supported)"
                            placeholder="Provide the complete problem statement, constraints, sample inputs, and submission requirements..."
                            value={description}
                            onChange={(val) => setDescription(val)}
                            disabled={isSubmitting}
                            rows={8}
                            required
                        />
                    </CardContent>
                </Card>

                {/* Section 3: Rubric Breakdown */}
                <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-1">
                    <CardHeader className="border-b border-border/60 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="font-display text-base text-foreground">
                                        Evaluation Rubric Criteria (Must equal 15 pts)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Instructors use these distinct criteria when grading submissions.
                                    </CardDescription>
                                </div>
                            </div>

                            <span
                                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                                    isRubricValid
                                        ? "bg-success/15 text-success border-success/30"
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30"
                                }`}
                            >
                                Total: {rubricSum} / 15 pts
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-3">
                            {rubricFields.map((field, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/20"
                                >
                                    <div className="flex-1">
                                        <Input
                                            placeholder={`Criterion #${idx + 1} (e.g. Algorithmic Complexity)`}
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
                                            className="bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <div className="flex items-center gap-1.5 shrink-0">
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
                                                className="w-16 text-center text-xs font-mono bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 rounded-xl"
                                                required
                                            />
                                            <span className="text-xs text-muted-foreground font-medium">pts</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                                            onClick={() => removeRubricField(idx)}
                                            disabled={isSubmitting || rubricFields.length <= 1}
                                            title="Delete criterion"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addRubricField}
                            disabled={isSubmitting}
                            className="rounded-xl text-xs font-semibold border-border hover:bg-muted"
                        >
                            <Plus className="size-3.5 mr-1" />
                            Add Criterion
                        </Button>
                    </CardContent>
                </Card>

                {/* Section 4: Progressive Tactical Hints */}
                <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-1">
                    <CardHeader className="border-b border-border/60 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center border border-gold-500/25">
                                    <Lightbulb className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="font-display text-base text-foreground">
                                        Tactical Hints ({hints.length}/3)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Optional hints students can unlock by spending Space Tokens.
                                    </CardDescription>
                                </div>
                            </div>

                            {hints.length < 3 && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addHint}
                                    disabled={isSubmitting}
                                    className="rounded-xl text-xs font-semibold border-border hover:bg-muted"
                                >
                                    <Plus className="size-3.5 mr-1" />
                                    Add Hint
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                        {hints.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                                No hints added yet. You can add up to 3 progressive hints that students unlock with ST.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {hints.map((hint, idx) => (
                                    <div
                                        key={idx}
                                        className="space-y-3 p-4 rounded-xl border border-border/70 bg-muted/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <Lightbulb className="size-3.5 text-gold-500" />
                                                Hint #{idx + 1}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Label className="text-[11px] text-muted-foreground font-medium">
                                                        Unlock Cost:
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={25}
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
                                                        className="w-16 text-center text-xs font-mono bg-background dark:bg-space-950/80 border-border text-foreground dark:text-starlight-100 rounded-xl"
                                                        required
                                                    />
                                                    <span className="text-xs font-semibold text-gold-600 dark:text-gold-400">
                                                        ST
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                    onClick={() => removeHint(idx)}
                                                    disabled={isSubmitting}
                                                    title="Delete hint"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <MarkdownEditor
                                            id={`hint-editor-${idx}`}
                                            label={`Hint #${idx + 1} Content (Markdown supported)`}
                                            placeholder="Write helpful nudges or code patterns for stuck students..."
                                            value={hint.content}
                                            onChange={(val) => {
                                                setHints((prev) =>
                                                    prev.map((h, i) =>
                                                        i === idx ? { ...h, content: val } : h
                                                    )
                                                );
                                            }}
                                            disabled={isSubmitting}
                                            rows={3}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/instructor/weeks/${week.id}`)}
                        disabled={isSubmitting}
                        className="rounded-xl text-xs font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !isRubricValid}
                        className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs px-6 h-10"
                    >
                        {isSubmitting ? "Publishing Task..." : "Create & Publish Task"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
