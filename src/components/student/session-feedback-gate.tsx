// src/components/student/session-feedback-gate.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Star,
    Lock,
    Unlock,
    AlertCircle,
    MessageSquare,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitSessionFeedbackAction } from "@/lib/actions/session-feedback";
import type { StudentSessionFeedbackView } from "@/types/types";

interface SessionFeedbackGateProps {
    sessionId: string;
    sessionTitle: string;
    onFeedbackSubmitted?: (feedback: StudentSessionFeedbackView) => void;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; colorClass: string }> = {
    1: { label: "Needs Serious Improvement", colorClass: "text-red-400" },
    2: { label: "Difficult to Follow", colorClass: "text-red-400" },
    3: { label: "Below Expectations", colorClass: "text-orange-400" },
    4: { label: "Fair / Basic", colorClass: "text-amber-400" },
    5: { label: "Good / Average", colorClass: "text-yellow-400" },
    6: { label: "Solid Session", colorClass: "text-yellow-400" },
    7: { label: "Very Good & Clear", colorClass: "text-emerald-400" },
    8: { label: "Great Experience", colorClass: "text-emerald-400" },
    9: { label: "Excellent & Inspiring", colorClass: "text-gold-400" },
    10: { label: "Outstanding / Stellar!", colorClass: "text-gold-300 font-bold" },
};

export function SessionFeedbackGate({
    sessionId,
    sessionTitle,
    onFeedbackSubmitted,
}: SessionFeedbackGateProps) {
    const router = useRouter();
    const [rating, setRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!rating) {
            setError("Please select a session rating from 1 to 10 before submitting.");
            return;
        }

        setIsSubmitting(true);
        const result = await submitSessionFeedbackAction({
            sessionId,
            rating,
            comment: comment.trim() || undefined,
        });
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error || "Failed to submit rating. Please try again.");
            return;
        }

        if (result.data) {
            onFeedbackSubmitted?.(result.data);
        }
        router.refresh();
    }

    const currentRatingInfo = rating ? RATING_DESCRIPTIONS[rating] : null;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-space-850 via-space-900 to-space-950 p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 -mt-16 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 -mb-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                {/* Header Badge & Title */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-3.5 py-1 text-xs font-semibold text-gold-300 border border-gold-500/30 shadow-gold">
                        <Lock className="size-3.5 text-gold-400" />
                        <span>Missions Locked</span>
                    </div>

                    <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-starlight-100">
                        Rate This Session to Unlock Missions
                    </h2>

                    <p className="text-sm text-starlight-300 leading-relaxed max-w-lg mx-auto">
                        Your honest feedback directly shapes our curriculum. Please rate <strong className="text-gold-300 font-medium">{sessionTitle}</strong> (1-10) to access the tasks and missions.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs font-medium text-red-200 animate-shake">
                            <AlertCircle className="size-4 shrink-0 text-red-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Rating Scale (1 to 10) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-starlight-200 flex items-center gap-1.5">
                                <Star className="size-3.5 text-gold-400 fill-gold-400/20" />
                                Session Rating (Mandatory)
                            </span>
                            <span className="text-starlight-400 font-mono">
                                {rating ? `${rating} / 10` : "Select a score"}
                            </span>
                        </div>

                        {/* Numbers Grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                                const isSelected = rating === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => {
                                            setRating(val);
                                            setError(null);
                                        }}
                                        className={`
                                            h-12 rounded-xl font-mono text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center border
                                            ${
                                                isSelected
                                                    ? "bg-gradient-to-b from-gold-500/30 to-amber-500/20 text-gold-200 border-gold-400 shadow-gold scale-105 ring-2 ring-gold-400/40"
                                                    : "bg-space-950/70 text-starlight-300 border-border/80 hover:bg-space-800 hover:text-gold-300 hover:border-gold-500/50"
                                            }
                                        `}
                                    >
                                        <span>{val}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Interactive Scale Labels */}
                        <div className="flex items-center justify-between text-[11px] text-starlight-400 px-1 pt-1">
                            <span>1 — Poor</span>
                            {currentRatingInfo ? (
                                <span className={`font-semibold animate-fade-in ${currentRatingInfo.colorClass}`}>
                                    {currentRatingInfo.label}
                                </span>
                            ) : (
                                <span className="italic text-starlight-500">Pick from 1 to 10</span>
                            )}
                            <span>10 — Stellar</span>
                        </div>
                    </div>

                    {/* Optional Comment */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <label
                                htmlFor="session-feedback-comment"
                                className="font-semibold text-starlight-200 flex items-center gap-1.5"
                            >
                                <MessageSquare className="size-3.5 text-starlight-400" />
                                Thoughts &amp; Feedback (Optional)
                            </label>
                            <span className="text-[11px] text-starlight-400">
                                {comment.length} / 1000
                            </span>
                        </div>

                        <Textarea
                            id="session-feedback-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                            placeholder="Share what you liked, what felt unclear, or any suggestions for your instructor..."
                            rows={3}
                            className="bg-space-950/80 border-border/80 text-starlight-100 placeholder:text-starlight-500 focus:border-gold-500/60 rounded-xl resize-none text-xs leading-relaxed"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting || !rating}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-space-950 font-bold text-sm tracking-wide shadow-gold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Unlocking Missions...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Unlock className="size-4" />
                                Submit Rating &amp; Unlock Tasks
                            </span>
                        )}
                    </Button>

                    <p className="text-[11px] text-center text-starlight-400">
                        Note: Your rating is final and cannot be modified once submitted.
                    </p>
                </form>
            </div>
        </div>
    );
}
