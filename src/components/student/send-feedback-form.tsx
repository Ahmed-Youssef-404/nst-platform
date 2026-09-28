// src/components/student/send-feedback-form.tsx
"use client";

import { useState } from "react";
import {
    CheckCircle2,
    Send,
    Lightbulb,
    AlertTriangle,
    MessageSquare,
    HelpCircle,
    Sparkles,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { submitFeedbackAction } from "@/lib/actions/feedback";
import type { FeedbackTypeCode } from "@/types/types";

const FEEDBACK_TYPES: {
    value: FeedbackTypeCode;
    label: string;
    description: string;
    icon: typeof Lightbulb;
    activeClassName: string;
}[] = [
    {
        value: "SUGGESTION",
        label: "Suggestion",
        description: "Ideas to improve sessions or tasks",
        icon: Lightbulb,
        activeClassName: "bg-gold-500/20 text-gold-300 border-gold-500/50 shadow-gold",
    },
    {
        value: "PROBLEM",
        label: "Problem",
        description: "Technical or curriculum issues",
        icon: AlertTriangle,
        activeClassName: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    },
    {
        value: "COMPLAINT",
        label: "Complaint",
        description: "Concerns requiring mentor attention",
        icon: MessageSquare,
        activeClassName: "bg-red-500/20 text-red-300 border-red-500/50",
    },
    {
        value: "OTHER",
        label: "General",
        description: "Any other thoughts or remarks",
        icon: HelpCircle,
        activeClassName: "bg-space-750 text-starlight-200 border-border/80",
    },
];

const PROMPT_QUESTIONS = [
    "What did you like about the recent sessions?",
    "What felt difficult or confusing?",
    "Are the tasks challenging and fair?",
    "Is your instructor's guidance helpful?",
    "What would you like to see added to NST?",
];

const MAX_MESSAGE_LENGTH = 2000;

export function SendFeedbackForm() {
    const [type, setType] = useState<FeedbackTypeCode>("SUGGESTION");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);

    function handleAddPrompt(prompt: string) {
        if (!message) {
            setMessage(`${prompt}\n`);
        } else {
            setMessage((prev) => `${prev.trim()}\n\n${prompt}\n`);
        }
    }

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
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-space-900 to-space-950 p-8 text-center space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="size-7" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-display text-lg font-bold text-starlight-100">
                        Feedback Transmitted Successfully!
                    </h3>
                    <p className="text-sm text-starlight-300 max-w-md mx-auto">
                        Thank you for your valuable insight. Your feedback has been safely delivered to the instruction and leadership team.
                    </p>
                </div>
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSent(false)}
                        className="rounded-xl border-border/70 bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-300"
                    >
                        Send Another Note
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type Selector Grid */}
            <div className="space-y-2.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-starlight-300">
                    Select Feedback Classification
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {FEEDBACK_TYPES.map((t) => {
                        const isSelected = type === t.value;
                        const Icon = t.icon;

                        return (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setType(t.value)}
                                className={`
                                    flex flex-col items-start p-3.5 rounded-xl border text-left transition-all
                                    ${
                                        isSelected
                                            ? t.activeClassName
                                            : "border-border/60 bg-space-900/60 hover:bg-space-850/80 text-starlight-300"
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="size-4 shrink-0" />
                                    <span className="text-xs font-bold">{t.label}</span>
                                </div>
                                <span className="text-[11px] text-starlight-400 line-clamp-2">
                                    {t.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Prompt Helper Chips */}
            <div className="rounded-xl border border-gold-500/20 bg-space-950/60 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-gold-300">
                    <Sparkles className="size-3.5 text-gold-400" />
                    <span>Need inspiration? Click a reflection question to get started:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {PROMPT_QUESTIONS.map((q, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddPrompt(q)}
                            className="rounded-lg bg-space-850 px-2.5 py-1 text-xs text-starlight-300 border border-border/60 hover:text-gold-300 hover:border-gold-500/30 hover:bg-space-800 transition-all text-left"
                        >
                            + {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-starlight-300">
                        Detailed Description
                    </Label>
                    <span className="font-mono text-xs text-starlight-400">
                        {message.length} / {MAX_MESSAGE_LENGTH}
                    </span>
                </div>

                <MarkdownEditor
                    id="feedback-message"
                    value={message}
                    onChange={(val) => setMessage(val.slice(0, MAX_MESSAGE_LENGTH))}
                    placeholder="Describe your thoughts, constructive feedback, or suggestions openly using Markdown..."
                    rows={6}
                    required
                />
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold text-xs shadow-gold h-10 px-6 transition-all"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="size-3.5 mr-2 animate-spin" />
                        Transmitting...
                    </>
                ) : (
                    <>
                        <Send className="size-3.5 mr-2" />
                        Send Feedback
                    </>
                )}
            </Button>
        </form>
    );
}