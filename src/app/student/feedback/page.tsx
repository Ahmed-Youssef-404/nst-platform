// src/app/student/feedback/page.tsx
// Server Component - "Send Feedback" page. No data to fetch here (this
// feature isn't persisted, see types.ts / send-feedback.ts), so this page
// only needs to verify the student is authenticated before rendering the
// form. Middleware already guards /student for the "student" role, but a
// server component should never trust that alone (same pattern as the
// other /student pages).

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { SendFeedbackForm } from "@/components/student/send-feedback-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Lightbulb, MessageCircle, Sparkles } from "lucide-react";

export default async function SendFeedbackPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const promptQuestions = [
        "What did you like?",
        "What felt difficult?",
        "What wasn't clear?",
        "Are the sessions working for you?",
        "Are the tasks appropriate?",
        "Is your mentor helpful?",
        "What would you like to change?",
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-xl font-semibold">Send Feedback</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Have a problem, a suggestion, or a complaint? Let us know — it goes
                    straight to the team.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New feedback</CardTitle>
                    <CardDescription>
                        Choose a type and describe what's on your mind.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Reflection prompts - helpful guidance before the form */}
                    <div className="rounded-lg bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-5 border border-primary/10">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-foreground">
                                    Not sure what to say? Here are some things to reflect on:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {promptQuestions.map((question, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-2 rounded-md bg-background/60 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-background hover:text-foreground"
                                        >
                                            <MessageCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
                                            <span>{question}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground/70">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    <span>Your honest feedback helps us improve the program for everyone.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SendFeedbackForm />
                </CardContent>
            </Card>
        </div>
    );
}