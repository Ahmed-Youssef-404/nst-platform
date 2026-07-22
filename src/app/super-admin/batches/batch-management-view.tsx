// src/app/super-admin/batches/batch-management-view.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
    return (
        <div className="w-full max-w-none space-y-6">
            <CreateBatchCard />

            {batches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No batches yet. Create one above to get started.
                </p>
            ) : (
                <div className="space-y-4">
                    {batches.map((batch) => (
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
// CREATE BATCH
// ============================================

function CreateBatchCard() {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await createBatchAction({ name });

        if (result.success) {
            setName("");
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Batch</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="new-batch-name">Batch name</Label>
                        <Input
                            id="new-batch-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create"}
                    </Button>
                </form>
                {error && <p className="mt-2 text-sm text-error">{error}</p>}
            </CardContent>
        </Card>
    );
}

// ============================================
// BATCH CARD (with its Groups)
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

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                {isEditingName ? (
                    <BatchNameEditor
                        batchId={batch.id}
                        currentName={batch.name}
                        onDone={() => setIsEditingName(false)}
                    />
                ) : (
                    <>
                        <CardTitle>{batch.name}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingName(true)}
                        >
                            Rename
                        </Button>
                    </>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {batch.groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No groups in this batch yet.
                    </p>
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

                {isAddingGroup ? (
                    <CreateGroupForm
                        batchId={batch.id}
                        onDone={() => setIsAddingGroup(false)}
                    />
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingGroup(true)}
                    >
                        + Add Group
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

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
        setError(null);
        setIsSubmitting(true);

        const result = await updateBatchAction({ id: batchId, name });

        if (result.success) {
            onDone();
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-1 items-center gap-2">
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8"
                autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDone}>
                Cancel
            </Button>
            {error && <p className="text-sm text-error">{error}</p>}
        </div>
    );
}

// ============================================
// CREATE GROUP
// ============================================

function CreateGroupForm({
    batchId,
    onDone,
}: {
    batchId: string;
    onDone: () => void;
}) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await createGroupAction({ name, batchId });

        if (result.success) {
            onDone();
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t pt-3">
            <div className="flex-1 space-y-2">
                <Label htmlFor={`new-group-name-${batchId}`}>Group name</Label>
                <Input
                    id={`new-group-name-${batchId}`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8"
                    autoFocus
                    required
                />
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDone}>
                Cancel
            </Button>
            {error && <p className="text-sm text-error">{error}</p>}
        </form>
    );
}

// ============================================
// GROUP ROW (name, student count, instructors)
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
        <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
                {isEditingName ? (
                    <GroupNameEditor
                        groupId={group.id}
                        currentName={group.name}
                        onDone={() => setIsEditingName(false)}
                    />
                ) : (
                    <>
                        <div>
                            <p className="text-sm font-medium">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {group.studentCount}{" "}
                                {group.studentCount === 1 ? "student" : "students"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingName(true)}
                            >
                                Rename
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setIsManagingInstructors((prev) => !prev)
                                }
                            >
                                Instructors ({group.instructors.length})
                            </Button>
                        </div>
                    </>
                )}
            </div>

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
        setError(null);
        setIsSubmitting(true);

        const result = await updateGroupAction({ id: groupId, name });

        if (result.success) {
            onDone();
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-1 items-center gap-2">
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8"
                autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDone}>
                Cancel
            </Button>
            {error && <p className="text-sm text-error">{error}</p>}
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
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    async function handleUnassign(instructorId: string) {
        setError(null);
        setIsSubmitting(true);

        const result = await unassignInstructorAction({ instructorId, groupId });

        if (!result.success) {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="mt-3 space-y-2 border-t pt-3">
            {assignedInstructors.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                    No instructors assigned yet.
                </p>
            ) : (
                <ul className="space-y-1">
                    {assignedInstructors.map((instructor) => (
                        <li
                            key={instructor.id}
                            className="flex items-center justify-between text-sm"
                        >
                            <span>
                                {instructor.name}{" "}
                                <span className="text-xs text-muted-foreground">
                                    ({instructor.email})
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => handleUnassign(instructor.id)}
                                disabled={isSubmitting}
                                className="text-xs text-error hover:underline disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {availableInstructors.length > 0 && (
                <div className="flex items-center gap-2">
                    <select
                        value={selectedInstructorId}
                        onChange={(e) => setSelectedInstructorId(e.target.value)}
                        className="border-input flex h-8 flex-1 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                        <option value="">Select an instructor to add...</option>
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
                    >
                        Add
                    </Button>
                </div>
            )}

            {error && <p className="text-sm text-error">{error}</p>}
        </div>
    );
}