// src/app/super-admin/levels/level-management-view.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createLevelAction } from "@/lib/actions/level-management";
import type { BatchWithGroupsAndLevels } from "@/types/types";

export function LevelManagementView({
    batches,
}: {
    batches: BatchWithGroupsAndLevels[];
}) {
    const allGroups = batches.flatMap((batch) =>
        batch.groups.map((group) => ({ ...group, batchName: batch.name }))
    );

    return (
        <div className="w-full max-w-none space-y-6">
            <CreateLevelCard groups={allGroups} />

            <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground">
                    Current active Level per Group
                </h2>

                {batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No batches yet. Create a Batch and Groups first.
                    </p>
                ) : (
                    batches.map((batch) => (
                        <Card key={batch.id}>
                            <CardHeader>
                                <CardTitle>{batch.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {batch.groups.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No groups in this batch yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {batch.groups.map((group) => (
                                            <div
                                                key={group.id}
                                                className="flex items-center justify-between rounded-md border p-3"
                                            >
                                                <span className="text-sm font-medium">
                                                    {group.name}
                                                </span>
                                                {group.activeLevel ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="success">
                                                            Level {group.activeLevel.levelNumber}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {group.activeLevel.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        No active Level yet
                                                    </span>
                                                )}
                                            </div>
                                        ))}
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
// CREATE LEVEL (attach to one or more Groups)
// ============================================

interface GroupForSelection {
    id: string;
    name: string;
    batchName: string;
    activeLevel: { name: string; levelNumber: number } | null;
}

function CreateLevelCard({ groups }: { groups: GroupForSelection[] }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [levelNumber, setLevelNumber] = useState("1");
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
        new Set()
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
            setError("Select at least one Group for this Level.");
            return;
        }

        setIsSubmitting(true);
        const result = await createLevelAction({
            name,
            description: description.trim() ? description.trim() : null,
            levelNumber: levelNumberValue,
            groupIds: Array.from(selectedGroupIds),
        });
        setIsSubmitting(false);

        if (result.success && result.data) {
            setSuccessMessage(
                `Level "${name}" created for ${result.data.length} Group${result.data.length === 1 ? "" : "s"
                }.`
            );
            setName("");
            setDescription("");
            setLevelNumber("1");
            setSelectedGroupIds(new Set());
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }
    }

    // Group the selectable checkboxes by Batch, so a long Group list stays
    // readable - same visual grouping as the overview list below.
    const groupsByBatch = new Map<string, GroupForSelection[]>();
    for (const group of groups) {
        const list = groupsByBatch.get(group.batchName) ?? [];
        list.push(group);
        groupsByBatch.set(group.batchName, list);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Level</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="level-name">Level name</Label>
                            <Input
                                id="level-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level-number">Level number</Label>
                            <Input
                                id="level-number"
                                type="number"
                                min={1}
                                value={levelNumber}
                                onChange={(e) => setLevelNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="level-description">
                            Description (optional)
                        </Label>
                        <Textarea
                            id="level-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Attach to Groups</Label>
                        {groups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No Groups exist yet. Create a Batch and Group first.
                            </p>
                        ) : (
                            <div className="max-h-72 space-y-4 overflow-y-auto rounded-md border p-3">
                                {Array.from(groupsByBatch.entries()).map(
                                    ([batchName, batchGroups]) => (
                                        <div key={batchName} className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {batchName}
                                            </p>
                                            {batchGroups.map((group) => (
                                                <div
                                                    key={group.id}
                                                    className="flex items-center gap-2 pl-2"
                                                >
                                                    <Checkbox
                                                        id={`group-${group.id}`}
                                                        checked={selectedGroupIds.has(group.id)}
                                                        onCheckedChange={() =>
                                                            toggleGroup(group.id)
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`group-${group.id}`}
                                                        className="flex-1 font-normal"
                                                    >
                                                        {group.name}
                                                    </Label>
                                                    {group.activeLevel && (
                                                        <span className="text-xs text-muted-foreground">
                                                            currently: Level{" "}
                                                            {group.activeLevel.levelNumber} —{" "}
                                                            {group.activeLevel.name}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                        {selectedGroupIds.size > 0 && (
                            <p className="text-xs text-warning">
                                Any currently active Level in the selected Groups will be
                                deactivated and replaced by this new one. Every student in
                                the selected Groups will have their Level ST reset to 50
                                (their total ST is not affected). The old Level and all its
                                Sessions/Tasks/Submissions stay intact.
                            </p>
                        )}
                    </div>

                    {error && <p className="text-sm text-error">{error}</p>}
                    {successMessage && (
                        <p className="text-sm text-success">{successMessage}</p>
                    )}

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Level"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}