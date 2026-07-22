// src/app/super-admin/batches/page.tsx
import { getBatches } from "@/lib/data/get-batches";
import { getInstructors } from "@/lib/data/get-instructors";
import { BatchManagementView } from "@/app/super-admin/batches/batch-management-view";

export default async function BatchesPage() {
    const [batches, instructors] = await Promise.all([
        getBatches(),
        getInstructors(),
    ]);

    return <BatchManagementView batches={batches} instructors={instructors} />;
}