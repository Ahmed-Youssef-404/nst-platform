// src/components/profile/student-security-notice.tsx
// Students sign in with their email + student code (the code IS their
// password, see create-student.ts and the login form), and there is no
// password-reset flow - so changing it from here would risk locking
// students out. We explain that instead of showing a fake/unsafe control.

import { ShieldCheck } from "lucide-react";

export function StudentSecurityNotice() {
    return (
        <div className="flex gap-3 rounded-xl border border-border/70 bg-space-850/50 p-4">
            <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
            />
            <div className="space-y-1.5 text-sm text-starlight-300">
                <p>
                    You sign in with your email and your <strong className="text-starlight-100">student code</strong>.
                    Because the code is your sign-in credential, it can&apos;t be changed from this page.
                </p>
                <p className="text-xs text-starlight-400">
                    Keep your code private. If you think someone else knows it, let the NST team know.
                </p>
            </div>
        </div>
    );
}
