// src/app/super-admin/levels/page.tsx
import { getBatchesWithLevels } from "@/lib/data/get-batches-with-levels";
import { getLevelsIntelligence } from "@/lib/data/get-levels-intelligence";
import { LevelManagementView } from "@/app/super-admin/levels/level-management-view";

export default async function LevelsPage() {
    const [batches, intelligence] = await Promise.all([
        getBatchesWithLevels(),
        getLevelsIntelligence(),
    ]);

    return <LevelManagementView batches={batches} intelligence={intelligence} />;
}