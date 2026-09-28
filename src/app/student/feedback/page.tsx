// src/app/student/feedback/page.tsx
// Server Component - "Send Feedback" page.

import { redirect } from "next/navigation";
import { MessageSquareWarning, Sparkles, ShieldCheck } from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { SendFeedbackForm } from "@/components/student/send-feedback-form";

export default async function SendFeedbackPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-400 border border-gold-500/25">
                        <MessageSquareWarning className="size-3 text-gold-400" />
                        Cadet Transmission
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-space-850 px-2.5 py-0.5 text-xs font-mono text-starlight-400 border border-border/70">
                        <ShieldCheck className="size-3 text-emerald-400" />
                        Direct to Leadership
                    </span>
                </div>

                <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100">
                    Share Your Voice & Feedback
                </h1>
                <p className="text-sm text-starlight-400">
                    Encountered an obstacle, have an idea for future sessions, or want to share your learning experience? Your feedback helps us continuously elevate NST for everyone.
                </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-space-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl">
                <SendFeedbackForm />
            </div>
        </div>
    );
}