// src/components/profile/assigned-groups-section.tsx
// Instructor-only: the groups THIS instructor is assigned to (the data
// comes from getInstructorProfile, which is keyed by the session user's
// own id), plus two honest counts. Not a management UI - just context.

import Link from "next/link";
import { ArrowUpRight, FolderGit2, Users } from "lucide-react";
import { ProfileSection } from "@/components/profile/profile-section";
import { StatTile } from "@/components/profile/stat-tile";
import { TrackBadge } from "@/components/profile/track-badge";
import type { InstructorProfileGroup } from "@/types/types";

function pluralStudents(count: number) {
    return `${count} ${count === 1 ? "student" : "students"}`;
}

function groupStatus(group: InstructorProfileGroup): string {
    if (group.type === "INTERMEDIATE") {
        return group.activeLevel
            ? `Active level: Level ${group.activeLevel.levelNumber} · ${group.activeLevel.name}`
            : "No active level yet";
    }
    return group.ongoingWeek ? `Week in progress: ${group.ongoingWeek.name}` : "No week in progress";
}

export function AssignedGroupsSection({ groups }: { groups: InstructorProfileGroup[] }) {
    const totalStudents = groups.reduce((sum, g) => sum + g.studentCount, 0);

    return (
        <ProfileSection
            title="Assigned groups"
            description="The groups you currently teach."
            icon={FolderGit2}
            action={
                <Link
                    href="/instructor"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-600 focus-visible:outline-none focus-visible:underline dark:text-gold-300"
                >
                    Open teaching dashboard
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
            }
        >
            {groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-space-900/30 p-8 text-center">
                    <Users className="mx-auto mb-2 size-6 text-starlight-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-starlight-100">No groups assigned yet</p>
                    <p className="mt-1 text-xs text-starlight-400">
                        Once a Super Admin assigns you to a group, it will show up here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatTile label="Groups" value={groups.length} />
                        <StatTile label="Students" value={totalStudents} hint="Across your groups" />
                    </div>

                    <ul className="space-y-3">
                        {groups.map((group) => (
                            <li
                                key={group.id}
                                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-space-850/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0 space-y-1">
                                    <p className="break-words text-sm font-semibold text-starlight-100">
                                        {group.name}
                                    </p>
                                    <p className="text-xs text-starlight-400">
                                        Batch: {group.batchName} · {pluralStudents(group.studentCount)}
                                    </p>
                                    <p className="text-xs text-starlight-300">{groupStatus(group)}</p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-3">
                                    <TrackBadge type={group.type} />
                                    {group.ongoingWeek && (
                                        <Link
                                            href={`/instructor/weeks/${group.ongoingWeek.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-600 focus-visible:outline-none focus-visible:underline dark:text-gold-300"
                                        >
                                            Open week
                                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                                        </Link>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </ProfileSection>
    );
}
