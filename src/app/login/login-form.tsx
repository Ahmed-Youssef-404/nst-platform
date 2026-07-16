// src/app/login/login-form.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/actions/auth";

type LoginMode = "staff" | "student";

export function LoginForm() {
    const [mode, setMode] = useState<LoginMode>("staff");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await loginAction({ email, password });

        // Note: if login succeeds, loginAction redirects and this line
        // is never reached. We only get here if it failed.
        if (!result.success) {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Log in to NST Platform</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs
                    className="flex-col"
                    value={mode}
                    onValueChange={(value) => {
                        setMode(value as LoginMode);
                        setPassword(""); // clear password/code when switching modes
                        setError(null);
                    }}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="staff">Staff</TabsTrigger>
                        <TabsTrigger value="student">Student</TabsTrigger>
                    </TabsList>

                    <TabsContent value="staff">
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="staff-email">Email</Label>
                                <Input
                                    id="staff-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="staff-password">Password</Label>
                                <Input
                                    id="staff-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-error">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Logging in..." : "Log in"}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="student">
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                                <Label htmlFor="student-code">Student Code</Label>
                                <Input
                                    id="student-code"
                                    type="text"
                                    placeholder="NST-1000"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-error">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Logging in..." : "Log in"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}