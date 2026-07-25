// src/app/super-admin/levels/page.tsx
import { getBatchesWithLevels } from "@/lib/data/get-batches-with-levels";
import { LevelManagementView } from "@/app/super-admin/levels/level-management-view";

export default async function LevelsPage() {
    const batches = await getBatchesWithLevels();

    return <LevelManagementView batches={batches} />;
}