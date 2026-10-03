// src/components/profile/learning-journey-section.tsx
// Student-only. Beginner and Intermediate students have different
// structures (Group -> Week vs Group -> Level), so the "current" row
// adapts to the student's actual track.

import { Rocket } from "lucide-react";
import { ProfileSection } from "@/components/profile/profile-section";
import { InfoList, InfoRow } from "@/components/profile/info-row";
import { TrackBadge } from "@/components/profile/track-badge";
import type { StudentProfileData } from "@/types/types";

export function LearningJourneySection({ profile }: { profile: StudentProfileData }) {
    const isBeginner = profile.groupType === "BEGINNER";

    return (
        <ProfileSection
            title="Learning journey"
            description="Assigned by NST based on your enrollment."
            icon={Rocket}
        >
            <InfoList>
                <InfoRow label="Group">{profile.groupName}</InfoRow>
                <InfoRow label="Batch">{profile.batchName}</InfoRow>
                <InfoRow label="Track">
                    <TrackBadge type={profile.groupType} />
                </InfoRow>

                {isBeginner ? (
                    <InfoRow label="Current week">
                        {profile.ongoingWeek ? (
                            profile.ongoingWeek.name
                        ) : (
                            <span className="font-normal text-starlight-400">No week in progress right now</span>
                        )}
                    </InfoRow>
                ) : (
                    <InfoRow label="Current level">
                        {profile.activeLevel ? (
                            `Level ${profile.activeLevel.levelNumber} · ${profile.activeLevel.name}`
                        ) : (
                            <span className="font-normal text-starlight-400">No active level yet</span>
                        )}
                    </InfoRow>
                )}
            </InfoList>
        </ProfileSection>
    );
}
