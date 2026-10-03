// src/components/profile/info-row.tsx
// Label/value rows for profile details. Wrap rows in <InfoList> (a <dl>).
// `readOnly` rows get a visible "Read-only" tag; editable rows pass their
// own `action` (the Edit button / form controls) instead.

import { Lock } from "lucide-react";

export function InfoList({ children }: { children: React.ReactNode }) {
    return <dl className="divide-y divide-border/60">{children}</dl>;
}

export function InfoRow({
    label,
    children,
    readOnly = false,
    hint,
    action,
}: {
    label: string;
    children: React.ReactNode;
    readOnly?: boolean;
    hint?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5 py-4 first:pt-0 last:pb-0 sm:grid-cols-[10.5rem_1fr] sm:gap-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                {label}
            </dt>
            <dd className="min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 break-words text-sm font-medium text-starlight-100">
                        {children}
                    </div>

                    {readOnly ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/70 bg-space-850/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-starlight-400">
                            <Lock className="size-2.5" aria-hidden="true" />
                            Read-only
                        </span>
                    ) : (
                        action
                    )}
                </div>
                {hint && <p className="text-xs text-starlight-400">{hint}</p>}
            </dd>
        </div>
    );
}
