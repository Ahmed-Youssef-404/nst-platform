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
import { AlertCircle, Calendar, Link as LinkIcon, FileText, Info } from "lucide-react";
import { createWeekAction } from "@/lib/actions/week-management";
import type { GroupForWeekCreation } from "@/lib/data/get-week-detail";

export function CreateWeekForm({ group }: { group: GroupForWeekCreation }) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [requiredFileLabel, setRequiredFileLabel] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">
                        Create New Week
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {group.name} · {group.batchName} (Beginner Track)
                    </p>
                </div>
                <Link
                    href="/instructor"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Cancel
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Week Details</CardTitle>
                        <CardDescription>
                            Define the learning period, lecture material, and mandatory deliverables.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="week-name">Week Name / Title</Label>
                            <Input
                                id="week-name"
                                placeholder="e.g. Week 1: Problem Solving Foundations"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date" className="flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-muted-foreground" />
                                    Start Date & Time
                                </Label>
                                <Input
                                    id="start-date"
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tasks & Hints can be modified until this time.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end-date" className="flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-muted-foreground" />
                                    End Date & Time (Deadline)
                                </Label>
                                <Input
                                    id="end-date"
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Applies as the deadline for all tasks in this week.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="playlist-url" className="flex items-center gap-1.5">
                                <LinkIcon className="size-3.5 text-muted-foreground" />
                                Playlist URL
                            </Label>
                            <Input
                                id="playlist-url"
                                type="url"
                                placeholder="https://www.youtube.com/playlist?list=..."
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                YouTube or external video playlist URL for the students to study from.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="required-file-label" className="flex items-center gap-1.5">
                                <FileText className="size-3.5 text-muted-foreground" />
                                Required File Deliverable Label
                            </Label>
                            <Input
                                id="required-file-label"
                                placeholder="e.g. Weekly Session Summary Report (PDF)"
                                value={requiredFileLabel}
                                onChange={(e) => setRequiredFileLabel(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                The label shown to students for the single required file they must upload before week ends.
                            </p>
                        </div>

                        <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
                            <Info className="size-4 text-primary mt-0.5 shrink-0" />
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground">
                                    Next step after creating this Week:
                                </p>
                                <p>
                                    You will be taken directly to the Week Details page where you can add tasks, define hints, and configure custom rubric criteria (up to 15 points total per task).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                render={<Link href="/instructor" />}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Week & Continue to Tasks"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
