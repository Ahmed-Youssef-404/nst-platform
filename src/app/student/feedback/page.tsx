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

export default async function SendFeedbackPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

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
                <CardContent>
                    <SendFeedbackForm />
                </CardContent>
            </Card>
        </div>
    );
}