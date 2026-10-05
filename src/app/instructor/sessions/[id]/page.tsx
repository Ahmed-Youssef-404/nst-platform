// src/app/instructor/sessions/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSessionDetail } from "@/lib/data/get-session-detail";
import { SessionDetailView } from "./session-detail-view";

export default async function SessionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { id } = await params;
    const session = await getSessionDetail(id, user.id);

    if (!session) {
        return (
            <div className="max-w-xl mx-auto py-12 text-center space-y-3">
                <p className="text-sm text-starlight-300">
                    This Session doesn&apos;t exist, or you&apos;re not assigned to its Group.
                </p>
                <Link href="/instructor" className="inline-block text-xs font-semibold text-gold-400 hover:text-gold-300 hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    return <SessionDetailView session={session} instructorId={user.id} />;
}