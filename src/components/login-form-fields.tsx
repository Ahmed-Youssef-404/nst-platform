// src/components/login-form-fields.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/actions/auth";
import { Eye, EyeOff } from "lucide-react";
import { normalizeEmail } from "@/lib/auth/normalize-email";

type LoginMode = "staff" | "student";

/**
 * The actual login form (tabs + fields + submit). Extracted from the Card
 * shell so it can be dropped into a page (see /login) or a Dialog (see the
 * landing page's Get Started / Join Us buttons) without duplicating logic.
 */
export function LoginFormFields() {
    const [mode, setMode] = useState<LoginMode>("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await loginAction({ email: normalizeEmail(email), password });

        // Note: if login succeeds, loginAction redirects and this line
        // is never reached. We only get here if it failed.
        if (!result.success) {
            setError(result.error ?? "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    }

    return (
        <Tabs
            className="flex-col"
            value={mode}
            onValueChange={(value) => {
                setMode(value as LoginMode);
                setPassword(""); // clear password/code when switching modes
                setShowPassword(false);
                setError(null);
            }}
        >
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
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
                        <div className="relative flex items-center">
                            <Input
                                id="staff-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
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
                        <div className="relative flex items-center">
                            <Input
                                id="student-code"
                                type={showPassword ? "text" : "password"}
                                // placeholder="NST-0000"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-error">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Log in"}
                    </Button>
                </form>
            </TabsContent>
        </Tabs>
    );
}