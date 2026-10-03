// src/components/profile/profile-section.tsx
// Titled card used for every block on the profile pages.

import type { LucideIcon } from "lucide-react";

export function ProfileSection({
    title,
    description,
    icon: Icon,
    action,
    children,
}: {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs dark:border-border/70 dark:bg-space-900/70 md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    {Icon && (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/10">
                            <Icon className="size-4 text-gold-600 dark:text-gold-400" aria-hidden="true" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="font-display text-base font-bold tracking-tight text-starlight-100">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-0.5 text-xs text-starlight-400">{description}</p>
                        )}
                    </div>
                </div>
                {action}
            </div>

            {children}
        </section>
    );
}
