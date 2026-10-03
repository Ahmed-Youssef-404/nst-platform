// src/components/profile/stat-tile.tsx
// Small label + value tile for the compact role-context stats.

export function StatTile({
    label,
    value,
    hint,
}: {
    label: string;
    value: React.ReactNode;
    hint?: string;
}) {
    return (
        <div className="rounded-xl border border-border/70 bg-space-850/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-starlight-400">
                {label}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-gold-700 dark:text-gold-300">
                {value}
            </p>
            {hint && <p className="mt-1 text-xs text-starlight-400">{hint}</p>}
        </div>
    );
}
