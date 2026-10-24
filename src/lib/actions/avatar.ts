// src/lib/actions/avatar.ts
"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import {
    validateAvatarConfig,
    normalizeHexColor,
    type StudentAvatarConfig,
} from "@/types/avatar";
import {
    getCatalogItemById,
    getAuthoritativeColorPrice,
    isItemInherentFree,
    isColorInherentFreeForItem,
    type CatalogItem,
    type AvatarSlotName,
} from "@/lib/avatar/catalog";
import { isHeadwearTop } from "@/lib/avatar/options";
import { applySTChange } from "@/lib/st-economy/create-transaction";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export type SaveAvatarActionResult =
    | { success: true; config: StudentAvatarConfig }
    | { success: false; error: string };

export interface PurchaseItemRequest {
    itemId: string; // e.g. "top:theCaesar"
}

export interface PurchaseColorRequest {
    itemId: string; // e.g. "top:theCaesar"
    colorHex: string; // e.g. "c93305"
    isCustom?: boolean;
}

export interface BulkPurchaseInput {
    items: PurchaseItemRequest[];
    colors: PurchaseColorRequest[];
}

export interface BulkPurchaseResult {
    success: boolean;
    error?: string;
    totalCharged?: number;
    newBalance?: number;
    purchasedItemIds?: string[];
    purchasedColors?: { itemId: string; colorHex: string; isCustom: boolean }[];
}

export interface StudentEntitlementsResult {
    success: boolean;
    error?: string;
    ownedItemIds?: string[];
    ownedColors?: { itemId: string; colorHex: string; isCustom: boolean }[];
    spendableBalance?: number;
    track?: "INTERMEDIATE" | "BEGINNER";
}

/**
 * Server Action for fetching student's avatar entitlements and spendable ST balance.
 */
export async function getStudentAvatarEntitlementsAction(): Promise<StudentEntitlementsResult> {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        return {
            success: false,
            error: "Unauthorized: You must be logged in as a student.",
        };
    }

    try {
        const student = await prisma.student.findUniqueOrThrow({
            where: { id: studentId },
            select: {
                id: true,
                avgSt: true,
                beginnerSt: true,
                group: {
                    select: {
                        type: true,
                        levels: {
                            where: { isActive: true },
                            take: 1,
                            select: {
                                levelStBalances: {
                                    where: { studentId },
                                    take: 1,
                                    select: { balance: true },
                                },
                            },
                        },
                    },
                },
                storeInventory: {
                    select: { storeItemId: true },
                },
                itemColors: {
                    select: { itemId: true, colorHex: true, isCustom: true },
                },
            },
        });

        const isBeginner = student.group.type === "BEGINNER";
        const spendableBalance = isBeginner
            ? (student.beginnerSt ?? 0)
            : (student.group.levels[0]?.levelStBalances[0]?.balance ?? 50);

        return {
            success: true,
            ownedItemIds: student.storeInventory.map((i) => i.storeItemId),
            ownedColors: student.itemColors.map((c) => ({
                itemId: c.itemId,
                colorHex: c.colorHex,
                isCustom: c.isCustom,
            })),
            spendableBalance,
            track: isBeginner ? "BEGINNER" : "INTERMEDIATE",
        };
    } catch (err) {
        console.error("Failed to load student avatar entitlements:", err);
        return {
            success: false,
            error: "Failed to load student inventory.",
        };
    }
}

/**
 * Server Action for purchasing a selection of paid avatar items and item-specific colors in one atomic transaction.
 *
 * Security:
 * - Always authenticates using getCurrentStudentId().
 * - Re-evaluates authoritative prices and validity from AVATAR_CATALOG on the server.
 * - Deduplicates requests and skips items/colors already owned.
 * - Checks spendable balance against student's actual track balance.
 * - Atomically debits ST via applySTChange() and creates inventory records.
 * - Rolls back completely if any failure occurs.
 */
export async function purchaseAvatarSelectionAction(
    input: BulkPurchaseInput
): Promise<BulkPurchaseResult> {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        return {
            success: false,
            error: "Unauthorized: You must be logged in as a student to make purchases.",
        };
    }

    if (!input || (!input.items?.length && !input.colors?.length)) {
        return {
            success: false,
            error: "No items or colors selected for purchase.",
        };
    }

    const now = new Date();

    // 1. Fetch student info, group, balance, and existing inventory/colors
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            groupId: true,
            avgSt: true,
            beginnerSt: true,
            group: {
                select: {
                    type: true,
                    levels: {
                        where: { isActive: true },
                        take: 1,
                        select: {
                            id: true,
                            levelStBalances: {
                                where: { studentId },
                                take: 1,
                                select: { balance: true },
                            },
                        },
                    },
                    weeks: {
                        where: { startDate: { lte: now }, endDate: { gte: now } },
                        orderBy: { startDate: "desc" },
                        take: 1,
                        select: { id: true },
                    },
                },
            },
            storeInventory: {
                select: { storeItemId: true },
            },
            itemColors: {
                select: { itemId: true, colorHex: true },
            },
        },
    });

    if (!student) {
        return { success: false, error: "Student account not found." };
    }

    const ownedItemIds = new Set(student.storeInventory.map((i) => i.storeItemId));
    const ownedColorKeys = new Set(
        student.itemColors.map((c) => `${c.itemId}:${c.colorHex.toLowerCase()}`)
    );

    // 2. Resolve items to purchase (deduplicated, filtering free & already owned)
    const uniqueItemIds = Array.from(new Set(input.items.map((i) => i.itemId)));
    const itemsToCharge: CatalogItem[] = [];

    for (const itemId of uniqueItemIds) {
        const catalogItem = getCatalogItemById(itemId);
        if (!catalogItem) {
            return { success: false, error: `Invalid item selected: ${itemId}` };
        }
        // If inherently free or already owned, do not charge
        if (catalogItem.isFree || ownedItemIds.has(itemId)) {
            continue;
        }
        itemsToCharge.push(catalogItem);
    }

    // 3. Resolve colors to purchase (deduplicated, filtering free & already owned)
    const colorKeyMap = new Map<
        string,
        { itemId: string; colorHex: string; isCustom: boolean; cost: number }
    >();

    for (const col of input.colors) {
        const cleanHex = normalizeHexColor(col.colorHex);
        if (!cleanHex) {
            return { success: false, error: `Invalid color hex: ${col.colorHex}` };
        }
        const catalogItem = getCatalogItemById(col.itemId);
        if (!catalogItem || !catalogItem.isColorable) {
            return {
                success: false,
                error: `Item ${col.itemId} does not support color customization.`,
            };
        }

        const key = `${col.itemId}:${cleanHex}`;
        // If already owned or inherently free for this item, skip
        if (isColorInherentFreeForItem(col.itemId, cleanHex) || ownedColorKeys.has(key)) {
            continue;
        }

        if (!colorKeyMap.has(key)) {
            const cost = getAuthoritativeColorPrice(col.itemId, cleanHex, col.isCustom);
            colorKeyMap.set(key, {
                itemId: col.itemId,
                colorHex: cleanHex,
                isCustom: Boolean(col.isCustom),
                cost,
            });
        }
    }

    const colorsToCharge = Array.from(colorKeyMap.values());

    const totalCost =
        itemsToCharge.reduce((sum, item) => sum + item.cost, 0) +
        colorsToCharge.reduce((sum, col) => sum + col.cost, 0);

    // If everything requested was already free or owned, return success without charge
    if (totalCost === 0 && itemsToCharge.length === 0 && colorsToCharge.length === 0) {
        return {
            success: true,
            totalCharged: 0,
            purchasedItemIds: [],
            purchasedColors: [],
        };
    }

    // 4. Verify spendable balance
    const isBeginner = student.group.type === "BEGINNER";
    let spendableBalance = 0;
    let targetLevelId: string | null = null;
    let targetWeekId: string | null = null;

    if (isBeginner) {
        spendableBalance = student.beginnerSt ?? 0;
        targetWeekId = student.group.weeks[0]?.id ?? null;
        if (!targetWeekId) {
            // Fallback to most recent week
            const fallbackWeek = await prisma.week.findFirst({
                where: { groupId: student.groupId },
                orderBy: { startDate: "desc" },
                select: { id: true },
            });
            targetWeekId = fallbackWeek?.id ?? null;
        }
        if (!targetWeekId) {
            return {
                success: false,
                error: "No active or recent week found for your beginner group.",
            };
        }
    } else {
        const activeLevel = student.group.levels[0];
        if (!activeLevel) {
            return {
                success: false,
                error: "No active level found for your group.",
            };
        }
        targetLevelId = activeLevel.id;
        spendableBalance = activeLevel.levelStBalances[0]?.balance ?? 50;
    }

    if (spendableBalance < totalCost) {
        return {
            success: false,
            error: `Insufficient ST balance. You have ${spendableBalance} ST, but this purchase requires ${totalCost} ST (shortfall: ${totalCost - spendableBalance} ST).`,
        };
    }

    // 5. Execute atomic database transaction
    try {
        await prisma.$transaction(async (tx) => {
            // A. Upsert StoreItem records so foreign keys succeed
            for (const item of itemsToCharge) {
                await tx.storeItem.upsert({
                    where: { id: item.id },
                    create: {
                        id: item.id,
                        name: item.name,
                        cost: item.cost,
                        isActive: true,
                    },
                    update: {
                        name: item.name,
                        cost: item.cost,
                    },
                });
            }

            // B. Create StudentInventory records
            for (const item of itemsToCharge) {
                await tx.studentInventory.create({
                    data: {
                        studentId,
                        storeItemId: item.id,
                        isEquipped: false,
                    },
                });
            }

            // C. Create StudentItemColor records
            for (const col of colorsToCharge) {
                await tx.studentItemColor.create({
                    data: {
                        studentId,
                        itemId: col.itemId,
                        colorHex: col.colorHex,
                        isCustom: col.isCustom,
                    },
                });
            }

            // D. Deduct ST via applySTChange inside tx
            if (isBeginner) {
                await applySTChange(
                    {
                        track: "BEGINNER",
                        studentId,
                        weekId: targetWeekId!,
                        type: "PENALTY",
                        reason: "STORE_PURCHASE",
                        amount: totalCost,
                        relatedEntityId:
                            itemsToCharge[0]?.id ??
                            colorsToCharge[0]?.itemId ??
                            "avatar_store_purchase",
                    },
                    tx
                );
            } else {
                await applySTChange(
                    {
                        track: "INTERMEDIATE",
                        studentId,
                        levelId: targetLevelId!,
                        type: "PENALTY",
                        reason: "STORE_PURCHASE",
                        amount: totalCost,
                        relatedEntityId:
                            itemsToCharge[0]?.id ??
                            colorsToCharge[0]?.itemId ??
                            "avatar_store_purchase",
                    },
                    tx
                );
            }
        });

        // Revalidate student paths
        revalidatePath("/student/profile");
        revalidatePath("/student");
        revalidatePath("/student/st-history");

        return {
            success: true,
            totalCharged: totalCost,
            newBalance: spendableBalance - totalCost,
            purchasedItemIds: itemsToCharge.map((i) => i.id),
            purchasedColors: colorsToCharge.map((c) => ({
                itemId: c.itemId,
                colorHex: c.colorHex,
                isCustom: c.isCustom,
            })),
        };
    } catch (err) {
        console.error("Bulk purchase transaction failed:", err);
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Failed to complete purchase. The transaction was rolled back.",
        };
    }
}

/**
 * Server Action for a student to save their avatar customization.
 *
 * Security:
 * - Always resolves studentId from the active authenticated session via getCurrentStudentId().
 * - Client-supplied IDs are neither accepted nor trusted.
 * - Validates every single field against an explicit allowlist.
 * - Enforces that every equipped paid item and paid color is actually owned by the student.
 * - Only modifies `avatarConfig` on the student record — does NOT touch ST, roles, or groups.
 */
export async function saveStudentAvatarAction(
    rawConfig: unknown
): Promise<SaveAvatarActionResult> {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        return {
            success: false,
            error: "Unauthorized: You must be logged in as a student to update your avatar.",
        };
    }

    const validation = validateAvatarConfig(rawConfig);
    if (!validation.valid) {
        return {
            success: false,
            error: `Validation error: ${validation.error}`,
        };
    }

    const config = validation.config;

    // Verify ownership of all selected items and item-specific colors
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                storeInventory: { select: { storeItemId: true } },
                itemColors: { select: { itemId: true, colorHex: true } },
            },
        });

        const ownedItemIds = new Set(student?.storeInventory.map((i) => i.storeItemId) ?? []);
        const ownedColors = new Set(
            student?.itemColors.map((c) => `${c.itemId}:${c.colorHex.toLowerCase()}`) ?? []
        );

        function checkItemOwnership(slot: AvatarSlotName, value: string): boolean {
            if (isItemInherentFree(slot, value)) return true;
            const itemId = `${slot}:${value}`;
            return ownedItemIds.has(itemId);
        }

        function checkColorOwnership(
            slot: AvatarSlotName,
            itemValue: string,
            colorHex: string
        ): boolean {
            const itemId = `${slot}:${itemValue}`;
            if (isColorInherentFreeForItem(itemId, colorHex)) return true;
            const cleanHex = normalizeHexColor(colorHex);
            if (!cleanHex) return false;
            return ownedColors.has(`${itemId}:${cleanHex}`);
        }

        // Verify top
        if (!checkItemOwnership("top", config.top)) {
            return {
                success: false,
                error: `You do not own the hairstyle/headwear: ${config.top}. Please purchase it first.`,
            };
        }
        if (config.top !== "none") {
            if (!checkColorOwnership("top", config.top, config.hairColor)) {
                return {
                    success: false,
                    error: `You do not own the hair color #${config.hairColor} for ${config.top}. Please purchase it first.`,
                };
            }
            if (isHeadwearTop(config.top) && config.hatColor) {
                if (!checkColorOwnership("top", config.top, config.hatColor)) {
                    return {
                        success: false,
                        error: `You do not own the headwear color #${config.hatColor} for ${config.top}. Please purchase it first.`,
                    };
                }
            }
        }

        // Verify clothing
        if (!checkItemOwnership("clothing", config.clothing)) {
            return {
                success: false,
                error: `You do not own the clothing: ${config.clothing}. Please purchase it first.`,
            };
        }
        if (!checkColorOwnership("clothing", config.clothing, config.clothesColor)) {
            return {
                success: false,
                error: `You do not own the clothing color #${config.clothesColor} for ${config.clothing}. Please purchase it first.`,
            };
        }
        if (config.clothing === "graphicShirt" && config.clothingGraphic) {
            if (!checkItemOwnership("clothingGraphic", config.clothingGraphic)) {
                return {
                    success: false,
                    error: `You do not own the t-shirt graphic: ${config.clothingGraphic}. Please purchase it first.`,
                };
            }
        }

        // Verify accessories
        if (config.accessories !== "none") {
            if (!checkItemOwnership("accessories", config.accessories)) {
                return {
                    success: false,
                    error: `You do not own the accessory: ${config.accessories}. Please purchase it first.`,
                };
            }
            if (!checkColorOwnership("accessories", config.accessories, config.accessoriesColor)) {
                return {
                    success: false,
                    error: `You do not own the accessory color #${config.accessoriesColor} for ${config.accessories}. Please purchase it first.`,
                };
            }
        }

        // Verify facial hair
        if (config.facialHair !== "none") {
            if (!checkItemOwnership("facialHair", config.facialHair)) {
                return {
                    success: false,
                    error: `You do not own the facial hair: ${config.facialHair}. Please purchase it first.`,
                };
            }
            if (!checkColorOwnership("facialHair", config.facialHair, config.facialHairColor)) {
                return {
                    success: false,
                    error: `You do not own the facial hair color #${config.facialHairColor} for ${config.facialHair}. Please purchase it first.`,
                };
            }
        }

        // Verify eyes
        if (!checkItemOwnership("eyes", config.eyes)) {
            return {
                success: false,
                error: `You do not own the eye expression: ${config.eyes}. Please purchase it first.`,
            };
        }

        // Verify eyebrows
        if (!checkItemOwnership("eyebrows", config.eyebrows)) {
            return {
                success: false,
                error: `You do not own the eyebrow expression: ${config.eyebrows}. Please purchase it first.`,
            };
        }

        // Verify mouth
        if (!checkItemOwnership("mouth", config.mouth)) {
            return {
                success: false,
                error: `You do not own the mouth expression: ${config.mouth}. Please purchase it first.`,
            };
        }

        // Ownership verified — persist to student record
        await prisma.student.update({
            where: { id: studentId },
            data: {
                avatarConfig: config as unknown as Prisma.InputJsonValue,
            },
        });

        // Revalidate student profile, rankings, and dashboard pages
        revalidatePath("/student/profile");
        revalidatePath("/student/ranking");
        revalidatePath("/student");

        return {
            success: true,
            config,
        };
    } catch (err) {
        console.error("Failed to save avatar configuration:", err);
        return {
            success: false,
            error: "An unexpected database error occurred while saving your avatar.",
        };
    }
}
