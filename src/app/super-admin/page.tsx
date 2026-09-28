// src/app/super-admin/page.tsx
import { getSuperAdminOverview } from "@/lib/data/get-super-admin-overview";
import { SuperAdminOverviewView } from "@/app/super-admin/super-admin-overview-view";

export default async function SuperAdminPage() {
    const overviewData = await getSuperAdminOverview();

    return <SuperAdminOverviewView data={overviewData} />;
}