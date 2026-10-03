// src/app/student/profile/page.tsx
// Server Component - the Student's OWN profile. The student is resolved
// through getCurrentStudentId() (Auth email -> students.id, e.g. "NST-1001"),
// never by treating the Supabase Auth UUID as a Student id. Everything on
// this page is read-only: name, code and group are institutional data, and
// the student code doubles as the sign-in credential.

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
    Calendar,
    CalendarCheck,
    Hash,
    History,
    Mail,
    Sparkles,
    Trophy,
    UserRound,
    Compass,
    ShieldCheck,
} from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentProfileData } from "@/lib/data/get-profile";
import { formatDate } from "@/lib/format-date";
import type { StudentProfileData } from "@/types/types";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSection } from "@/components/profile/profile-section";
import { InfoList, InfoRow } from "@/components/profile/info-row";
import { LearningJourneySection } from "@/components/profile/learning-journey-section";
import { StBalanceSection } from "@/components/profile/st-balance-section";
import { ShortcutList, type Shortcut } from "@/components/profile/shortcut-list";
import { StudentSecurityNotice } from "@/components/profile/student-security-notice";
import { ProfilePreferencesSection } from "@/components/profile/profile-preferences-section";
import { ProfileUnavailable } from "@/components/profile/profile-unavailable";

export const metadata: Metadata = { title: "My Profile — NST Platform" };

export default async function StudentProfilePage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    let profile: StudentProfileData | null = null;
    try {
        profile = await getStudentProfileData(studentId);
    } catch {
        return <ProfileUnavailable reason="error" />;
    }

    if (!profile) {
        return <ProfileUnavailable reason="missing" />;
    }

    const isBeginner = profile.groupType === "BEGINNER";

    const shortcuts: Shortcut[] = [
        {
            href: "/student",
            label: isBeginner ? "My Weeks" : "My Sessions",
            description: isBeginner ? "Weekly modules & tasks" : "Active level & sessions",
            icon: isBeginner ? Calendar : CalendarCheck,
        },
        {
            href: "/student/ranking",
            label: "Ranking",
            description: "Group leaderboard & podium",
            icon: Trophy,
        },
        ...(isBeginner
            ? []
            : [
                  {
                      href: "/student/levels",
                      label: "Level History",
                      description: "Past levels & archives",
                      icon: History,
                  },
              ]),
    ];

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <ProfileHeader
                name={profile.name}
                roleLabel="Student Cadet"
                roleIcon={Sparkles}
                initialsFallback="ST"
                description="Your place in the NST learning journey."
                chips={[
                    { icon: Hash, label: "Student code", value: profile.studentCode, mono: true },
                    { icon: Mail, label: "Email", value: profile.email },
                ]}
            />

            <ProfileSection
                title="Personal information"
                description="These details are managed by NST and can't be edited here."
                icon={UserRound}
            >
                <InfoList>
                    <InfoRow label="Full name" readOnly>
                        {profile.name}
                    </InfoRow>
                    <InfoRow label="Email" readOnly>
                        {profile.email}
                    </InfoRow>
                    <InfoRow label="Student code" readOnly>
                        <span className="font-mono">{profile.studentCode}</span>
                    </InfoRow>
                    <InfoRow label="Joined NST">{formatDate(profile.createdAt)}</InfoRow>
                </InfoList>
            </ProfileSection>

            <LearningJourneySection profile={profile} />

            <StBalanceSection profile={profile} />

            <ProfileSection
                title="Quick links"
                description="Pick up where you left off."
                icon={Compass}
            >
                <ShortcutList items={shortcuts} />
            </ProfileSection>

            <ProfileSection
                title="Account security"
                description="How your sign-in works."
                icon={ShieldCheck}
            >
                <StudentSecurityNotice />
            </ProfileSection>

            <ProfilePreferencesSection />
        </div>
    );
}
