// src/app/instructor/weeks/new/create-week-form.tsx
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
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    Calendar,
    Link as LinkIcon,
    FileText,
    Info,
    Sparkles,
    ChevronLeft,
} from "lucide-react";
import { createWeekAction } from "@/lib/actions/week-management";
import type { GroupForWeekCreation } from "@/lib/data/get-week-detail";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

export function CreateWeekForm({ group }: { group: GroupForWeekCreation }) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [requiredFileLabel, setRequiredFileLabel] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDirty =
        name.trim().length > 0 ||
        startDate.length > 0 ||
        endDate.length > 0 ||
        playlistUrl.trim().length > 0 ||
        requiredFileLabel.trim().length > 0;
    useUnsavedChanges(isDirty && !isSubmitting);

    async function handleSubmit(e: React.FormEvent) {
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

        if (!playlistUrl.trim()) {
            setError("Playlist URL cannot be empty.");
            return;
        }

        try {
            new URL(playlistUrl.trim());
        } catch {
            setError("Playlist URL must be a valid URL (e.g. https://www.youtube.com/playlist?list=...).");
            return;
        }

        if (!startDate) {
            setError("Start date is required.");
            return;
        }

        if (!endDate) {
            setError("End date is required.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start <= now) {
            setError("Start date must be in the future.");
            return;
        }

        if (end <= start) {
            setError("End date must be after the start date.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createWeekAction({
                groupId: group.id,
                name: name.trim(),
                startDate: start,
                endDate: end,
                playlistUrl: playlistUrl.trim(),
                requiredFileLabel: requiredFileLabel.trim(),
            });

            if (!result.success || !result.data) {
                setError(result.error ?? "Failed to create week.");
                setIsSubmitting(false);
                return;
            }

            router.push(`/instructor/weeks/${result.data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/instructor"
                        className="inline-flex items-center gap-1.5 text-xs text-starlight-400 hover:text-gold-300 transition-colors mb-2"
                    >
                        <ChevronLeft className="size-3.5" />
                        Back to Instructor Dashboard
                    </Link>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100">
                        Create New Week
                    </h1>
                    <p className="mt-1 text-xs text-starlight-300 font-mono">
                        {group.name} · {group.batchName} (Beginner Track)
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80 bg-space-850 hover:bg-space-750 text-starlight-300 hover:text-starlight-100 rounded-xl text-xs font-semibold"
                    render={<Link href="/instructor" />}
                >
                    Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-3 backdrop-blur-md overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/70 bg-space-950/40">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-gold-400" />
                            <CardTitle className="text-base font-bold font-display text-starlight-100">
                                Week Configuration & Timelines
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs text-starlight-400">
                            Define the learning period, lecture material, and mandatory deliverables.
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
                            <Label htmlFor="week-name" className="text-xs font-semibold text-starlight-200">
                                Week Name / Title
                            </Label>
                            <Input
                                id="week-name"
                                placeholder="e.g. Week 1: Problem Solving Foundations"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="start-date" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                    <Calendar className="size-3.5 text-gold-400" />
                                    Start Date & Time
                                </Label>
                                <Input
                                    id="start-date"
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                    required
                                />
                                <p className="text-[11px] text-starlight-400">
                                    Tasks & Hints are editable until this time.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="end-date" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                    <Calendar className="size-3.5 text-gold-400" />
                                    End Date & Time (Deadline)
                                </Label>
                                <Input
                                    id="end-date"
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-space-850/80 border-border/80 text-starlight-100 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                    required
                                />
                                <p className="text-[11px] text-starlight-400">
                                    Deadline for all tasks in this week.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="playlist-url" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                <LinkIcon className="size-3.5 text-gold-400" />
                                Playlist URL
                            </Label>
                            <Input
                                id="playlist-url"
                                type="url"
                                placeholder="https://www.youtube.com/playlist?list=..."
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                required
                            />
                            <p className="text-[11px] text-starlight-400">
                                YouTube or external video playlist URL for students to study from.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="required-file-label" className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                                <FileText className="size-3.5 text-gold-400" />
                                Required File Deliverable Label
                            </Label>
                            <Input
                                id="required-file-label"
                                placeholder="e.g. Weekly Session Summary Report (PDF)"
                                value={requiredFileLabel}
                                onChange={(e) => setRequiredFileLabel(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 focus-visible:border-gold-500 focus-visible:ring-gold-500/20 rounded-xl text-sm"
                                required
                            />
                            <p className="text-[11px] text-starlight-400">
                                The label shown to students for the mandatory file upload. If not accepted during grading, ST points are halved.
                            </p>
                        </div>

                        <div className="rounded-xl bg-gold-500/10 border border-gold-500/25 p-4 flex items-start gap-3">
                            <Info className="size-4 text-gold-400 mt-0.5 shrink-0" />
                            <div className="text-xs text-starlight-300 space-y-1">
                                <p className="font-semibold text-gold-300">
                                    Next step after creating this Week:
                                </p>
                                <p>
                                    You will be redirected to the Week Details page where you can add tasks, define hints, and configure custom rubric criteria (up to 15 points total per task).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-border/80 bg-space-850 hover:bg-space-750 text-starlight-300 hover:text-starlight-100 rounded-xl text-xs font-semibold"
                                render={<Link href="/instructor" />}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs transition-all"
                            >
                                {isSubmitting ? "Creating..." : "Create Week & Continue to Tasks"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
