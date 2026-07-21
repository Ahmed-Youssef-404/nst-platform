// src/app/super-admin/page.tsx
import { UserManagementForm } from "@/app/super-admin/user-management-form";
import { getGroups } from "@/lib/data/get-groups";

export default async function SuperAdminPage() {
    const groups = await getGroups();

    return <UserManagementForm groups={groups} />;
}