// src/app/super-admin/user-management-form.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    createInstructorAction,
    createStudentAction,
} from "@/lib/actions/user-management";
import type { GroupOption } from "@/lib/data/get-groups";

type Mode = "instructor" | "student";

export function UserManagementForm({ groups }: { groups: GroupOption[] }) {
    const [mode, setMode] = useState<Mode>("instructor");

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs
                    className="flex-col"
                    value={mode}
                    onValueChange={(value) => setMode(value as Mode)}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="instructor">Instructor</TabsTrigger>
                        <TabsTrigger value="student">Student</TabsTrigger>
                    </TabsList>

                    <TabsContent value="instructor">
                        <InstructorForm />
                    </TabsContent>

                    <TabsContent value="student">
                        <StudentForm groups={groups} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function InstructorForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        const result = await createInstructorAction({ name, email, password });

        if (result.success) {
            setSuccessMessage(`Instructor "${result.data?.name}" created successfully.`);
            setName("");
            setEmail("");
            setPassword("");
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
                <Label htmlFor="instructor-name">Name</Label>
                <Input
                    id="instructor-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="instructor-email">Email</Label>
                <Input
                    id="instructor-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="instructor-password">Password</Label>
                <Input
                    id="instructor-password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                    You&apos;ll need to send this password to the instructor yourself.
                </p>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            {successMessage && (
                <p className="text-sm text-success">{successMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Instructor"}
            </Button>
        </form>
    );
}

function StudentForm({ groups }: { groups: GroupOption[] }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [id, setId] = useState("");
    const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!groupId) {
            setError("Please select a group.");
            return;
        }

        setIsSubmitting(true);

        const result = await createStudentAction({ id, name, email, groupId });

        if (result.success) {
            setSuccessMessage(
                `Student "${result.data?.name}" created successfully. Login code: ${result.data?.id}`
            );
            setName("");
            setEmail("");
            setId("");
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    if (groups.length === 0) {
        return (
            <p className="mt-4 text-sm text-muted-foreground">
                No groups exist yet. Create a Batch and Group first before adding
                students.
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
                <Label htmlFor="student-name">Name</Label>
                <Input
                    id="student-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                    id="student-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                    id="student-id"
                    type="text"
                    placeholder="NST-1001"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    This code is final and will also be used as the student&apos;s
                    login password.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="student-group">Group</Label>
                <select
                    id="student-group"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    required
                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                    {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                            {group.batchName} — {group.name}
                        </option>
                    ))}
                </select>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            {successMessage && (
                <p className="text-sm text-success">{successMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Student"}
            </Button>
        </form>
    );
}