// src/app/super-admin/profile/page.tsx
// Server Component - the Super Admin's OWN profile. The record is looked up
// by the session user's id; nothing in the URL or request chooses whose
// profile this is.

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
    Compass,
    Crown,
    Layers,
    Mail,
    ShieldCheck,
    Sparkles,
    UserRound,
    Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSuperAdminProfile } from "@/lib/data/get-profile";
import { formatDate } from "@/lib/format-date";
import type { SuperAdminProfileData } from "@/types/types";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSection } from "@/components/profile/profile-section";
import { InfoList, InfoRow } from "@/components/profile/info-row";
import { EditableNameRow } from "@/components/profile/editable-name-row";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ShortcutList } from "@/components/profile/shortcut-list";
import { ProfilePreferencesSection } from "@/components/profile/profile-preferences-section";
import { ProfileUnavailable } from "@/components/profile/profile-unavailable";

export const metadata: Metadata = { title: "My Profile — NST Platform" };

export default async function SuperAdminProfilePage() {
    const user = await getCurrentUser();

    if (!user || user.role !== "super_admin") {
        redirect("/login");
    }

    let profile: SuperAdminProfileData | null = null;
    try {
        profile = await getSuperAdminProfile(user.id);
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
                roleLabel="Super Admin"
                roleIcon={Crown}
                initialsFallback="SA"
                description="Manage your personal account information."
                chips={[{ icon: Mail, label: "Email", value: profile.email }]}
            />

            <ProfileSection
                title="Personal information"
                description="Your name is shown across the platform."
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

            <ProfileSection
                title="Account security"
                description="Change the password you use to sign in."
                icon={ShieldCheck}
            >
                <ChangePasswordForm />
            </ProfileSection>

            <ProfileSection
                title="Administration"
                description="Jump back into the areas you manage."
                icon={Compass}
            >
                <ShortcutList
                    items={[
                        {
                            href: "/super-admin",
                            label: "Overview & Users",
                            description: "Dashboard, students & instructors",
                            icon: Users,
                        },
                        {
                            href: "/super-admin/batches",
                            label: "Batches & Groups",
                            description: "Cohorts, tracks & assignments",
                            icon: Layers,
                        },
                        {
                            href: "/super-admin/levels",
                            label: "Levels & Progression",
                            description: "Active levels per group",
                            icon: Sparkles,
                        },
                    ]}
                />
            </ProfileSection>

            <ProfilePreferencesSection />
        </div>
    );
}
