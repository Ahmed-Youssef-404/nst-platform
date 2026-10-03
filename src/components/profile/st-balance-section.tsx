// src/components/profile/st-balance-section.tsx
// Student-only ST summary. Values come straight from the stored columns
// (beginnerSt / the active LevelStBalance / the cached avgSt) - nothing is
// recalculated here, and an average is never labelled as a balance.

import Link from "next/link";
import { ArrowUpRight, Coins } from "lucide-react";
import { ProfileSection } from "@/components/profile/profile-section";
import { StatTile } from "@/components/profile/stat-tile";
import type { StudentProfileData } from "@/types/types";

export function StBalanceSection({ profile }: { profile: StudentProfileData }) {
    const isBeginner = profile.groupType === "BEGINNER";

    return (
        <ProfileSection
            title="Star Tokens"
            description={
                isBeginner
                    ? "One balance that grows across your whole course."
                    : "Your ST is tracked separately for each level."
            }
            icon={Coins}
            action={
                <Link
                    href="/student/st-history"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-600 focus-visible:outline-none focus-visible:underline dark:text-gold-300"
                >
                    View ST history
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
            }
        >
            {isBeginner ? (
                <StatTile label="Total ST" value={profile.beginnerSt} hint="Your current balance" />
            ) : (
                <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatTile
                            label="Current level ST"
                            value={profile.levelSt ?? "—"}
                            hint={
                                profile.activeLevel
                                    ? `Your balance in Level ${profile.activeLevel.levelNumber}`
                                    : "No active level yet"
                            }
                        />
                        <StatTile
                            label="Average ST"
                            value={profile.avgSt}
                            hint="Average across all your levels"
                        />
                    </div>
                    <p className="text-xs text-starlight-400">
                        The average is used for the overall ranking. It isn&apos;t a balance you can spend.
                    </p>
                </div>
            )}
        </ProfileSection>
    );
}
