// src/app/student/st-history/page.tsx
// Server Component - "ST History" page. Shows every ST transaction
// (rewards + penalties) for the logged-in student as a timeline, newest
// first. Fetches only the first page here (getStudentSTHistory is cursor-
// paginated) - further pages are loaded client-side via
// getStudentSTHistoryAction (see st-history-view.tsx) so "Load more"
// doesn't need a full navigation.
//
// Middleware already guards /student for the "student" role, but a server
// component should never trust that alone (same pattern as other
// /student pages).

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentSTHistory } from "@/lib/data/get-st-balance";
import { StudentSTHistoryView } from "./st-history-view";

export default async function STHistoryPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const firstPage = await getStudentSTHistory(studentId);

    return (
        <div className=" backdrop-blur-md space-y-6 relative z-50">
            <div>
                <h1 className="font-display text-xl font-semibold">ST History</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Every ST reward and penalty on your account, most recent first.
                </p>
            </div>

            <StudentSTHistoryView initialPage={firstPage} />
        </div>
    );  
}

