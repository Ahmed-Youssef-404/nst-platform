// src/components/student/send-feedback-form.tsx
"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitFeedbackAction } from "@/lib/actions/feedback";
import type { FeedbackTypeCode } from "@/types/types";

const FEEDBACK_TYPE_OPTIONS: { value: FeedbackTypeCode; label: string }[] = [
    { value: "PROBLEM", label: "Problem" },
    { value: "SUGGESTION", label: "Suggestion" },
    { value: "COMPLAINT", label: "Complaint" },
    { value: "OTHER", label: "Other" },
];

const MAX_MESSAGE_LENGTH = 2000;

export function SendFeedbackForm() {
    const [type, setType] = useState<FeedbackTypeCode>("SUGGESTION");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!message.trim()) {
            setError("Please write your feedback before submitting.");
            return;
        }

        setIsSubmitting(true);
        const result = await submitFeedbackAction({ type, message: message.trim() });
        setIsSubmitting(false);

        if (result.success) {
            setMessage("");
            setType("SUGGESTION");
            setIsSent(true);
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }
    }

    if (isSent) {
        return (
            <Alert className="border-success/30 bg-success-bg text-success">
                <CheckCircle2 />
                <AlertDescription className="text-success/90">
                    Thanks — your feedback has been sent to the team.
                </AlertDescription>
                <div className="mt-3">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsSent(false)}
                    >
                        Send another
                    </Button>
                </div>
            </Alert>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Feedback type</Label>
                <Select
                    value={type}
                    onValueChange={(value) => setType(value as FeedbackTypeCode)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FEEDBACK_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={6}
                    required
                />
                <p className="text-right text-xs text-muted-foreground">
                    {message.length} / {MAX_MESSAGE_LENGTH}
                </p>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send feedback"}
            </Button>
        </form>
    );
}