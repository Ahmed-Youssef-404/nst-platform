// src/components/profile/profile-unavailable.tsx
// Honest empty/error state - used when the profile query fails or the
// record can't be found. Never shown alongside made-up data.

import { AlertTriangle } from "lucide-react";

export function ProfileUnavailable({ reason }: { reason: "error" | "missing" }) {
    return (
        <div
            role="alert"
            className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center"
        >
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
                <AlertTriangle className="size-6 text-red-400" aria-hidden="true" />
            </div>
            <h1 className="font-display text-lg font-bold text-starlight-100">
                {reason === "error" ? "We couldn't load your profile" : "Profile not found"}
            </h1>
            <p className="mt-1.5 text-sm text-starlight-300">
                {reason === "error"
                    ? "Something went wrong while loading your details. Please refresh the page, and try again in a moment if it keeps happening."
                    : "We couldn't find a profile record linked to your account. Please contact the NST team."}
            </p>
        </div>
    );
}
