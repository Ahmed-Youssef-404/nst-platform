// src/app/instructor/profile/page.tsx
// Server Component - the Instructor's OWN profile and assigned groups. Both
// are looked up by the session user's id (Instructor.id === Auth user id),
// so an instructor can never see another instructor's groups from here.

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { GraduationCap, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInstructorProfile } from "@/lib/data/get-profile";
import { formatDate } from "@/lib/format-date";
import type { InstructorProfileData } from "@/types/types";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSection } from "@/components/profile/profile-section";
import { InfoList, InfoRow } from "@/components/profile/info-row";
import { EditableNameRow } from "@/components/profile/editable-name-row";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { AssignedGroupsSection } from "@/components/profile/assigned-groups-section";
import { ProfilePreferencesSection } from "@/components/profile/profile-preferences-section";
import { ProfileUnavailable } from "@/components/profile/profile-unavailable";

export const metadata: Metadata = { title: "My Profile — NST Platform" };

export default async function InstructorProfilePage() {
    const user = await getCurrentUser();

    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    let profile: InstructorProfileData | null = null;
    try {
        profile = await getInstructorProfile(user.id);
    } catch {
        return <ProfileUnavailable reason="error" />;
    }

    if (!profile) {
        return <ProfileUnavailable reason="missing" />;
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <ProfileHeader
                name={profile.name}
                roleLabel="Instructor"
                roleIcon={GraduationCap}
                initialsFallback="IN"
                description="Guiding NST students through their learning journey."
                chips={[{ icon: Mail, label: "Email", value: profile.email }]}
            />

            <ProfileSection
                title="Personal information"
                description="Your name is shown to students and admins."
                icon={UserRound}
            >
                <InfoList>
                    <EditableNameRow name={profile.name} />
                    <InfoRow
                        label="Email"
                        readOnly
                        hint="Your email is your sign-in identity, so it can't be changed here."
                    >
                        {profile.email}
                    </InfoRow>
                    <InfoRow label="Member since">{formatDate(profile.createdAt)}</InfoRow>
                </InfoList>
            </ProfileSection>

            <AssignedGroupsSection groups={profile.groups} />

            <ProfileSection
                title="Account security"
                description="Change the password you use to sign in."
                icon={ShieldCheck}
            >
                <ChangePasswordForm />
            </ProfileSection>

            <ProfilePreferencesSection />
        </div>
    );
}
