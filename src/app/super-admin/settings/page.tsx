// src/app/super-admin/settings/page.tsx
// Server Component - platform-wide settings. Super Admin only (the middleware
// already gates /super-admin; the role is re-verified here and again inside
// the server action that changes the setting).

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMaintenanceState } from "@/lib/data/get-maintenance-state";
import { MaintenanceControl } from "./maintenance-control";

export const metadata: Metadata = { title: "Platform Settings — NST Platform" };

export default async function SuperAdminSettingsPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== "super_admin") {
        redirect("/login");
    }

    const state = await getMaintenanceState();

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div>
                <h1 className="font-heading text-2xl font-extrabold tracking-tight text-starlight-100 sm:text-3xl">
                    Platform Settings
                </h1>
                <p className="mt-1 text-sm text-starlight-300">
                    Global controls for the NST platform.
                </p>
            </div>

            <MaintenanceControl
                initialEnabled={state.enabled}
                initialMessage={state.message ?? ""}
                statusUnknown={state.unknown}
            />
        </div>
    );
}
