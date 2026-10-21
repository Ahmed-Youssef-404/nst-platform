// src/components/avatar/avatar-editor.tsx
"use client";

import * as React from "react";
import {
    Sparkles,
    Check,
    RotateCcw,
    Dices,
    Loader2,
    Sliders,
    Eye,
    Smile,
    Shirt,
    Glasses,
    UserCheck,
    Save,
    Palette,
    Tag,
    Undo2,
    X,
    Coins,
    ShoppingBag,
    Plus,
    Filter,
} from "lucide-react";
import {
    type StudentAvatarConfig,
    DEFAULT_AVATAR_CONFIG,
    ALLOWED_SKIN_COLORS,
    ALLOWED_HAIR_COLORS,
    ALLOWED_TOPS,
    ALLOWED_CLOTHING,
    ALLOWED_CLOTHING_GRAPHICS,
    ALLOWED_CLOTHES_COLORS,
    ALLOWED_EYES,
    ALLOWED_EYEBROWS,
    ALLOWED_MOUTH,
    ALLOWED_ACCESSORIES,
    ALLOWED_ACCESSORIES_COLORS,
    ALLOWED_FACIAL_HAIR,
    normalizeHexColor,
} from "@/types/avatar";
import {
    SKIN_COLOR_OPTIONS,
    HAIR_COLOR_OPTIONS,
    TOP_OPTIONS,
    CLOTHING_OPTIONS,
    CLOTHING_GRAPHIC_OPTIONS,
    CLOTHES_COLOR_OPTIONS,
    HAT_COLOR_OPTIONS,
    EYES_OPTIONS,
    EYEBROWS_OPTIONS,
    MOUTH_OPTIONS,
    ACCESSORY_OPTIONS,
    ACCESSORIES_COLOR_OPTIONS,
    FACIAL_HAIR_OPTIONS,
    isHeadwearTop,
    type ColorOption,
} from "@/lib/avatar/options";
import {
    getTopThumbnail,
    getEyesThumbnail,
    getEyebrowsThumbnail,
    getMouthThumbnail,
    getClothingThumbnail,
    getGraphicThumbnail,
    getAccessoryThumbnail,
    getFacialHairThumbnail,
} from "@/lib/avatar/thumbnails";
import { generateAvatarDataUri } from "@/lib/avatar/generate";
import {
    saveStudentAvatarAction,
    getStudentAvatarEntitlementsAction,
    purchaseAvatarSelectionAction,
} from "@/lib/actions/avatar";
import {
    getCatalogItemById,
    getCatalogItemBySlotValue,
    isItemInherentFree,
    isColorInherentFreeForItem,
    getAuthoritativeColorPrice,
    type CatalogItem,
    type AvatarSlotName,
    CUSTOM_COLOR_PRICE,
    DEFAULT_HAIR_FREE_HEXES,
    DEFAULT_CLOTHES_FREE_HEXES,
    DEFAULT_ACCESSORIES_FREE_HEXES,
} from "@/lib/avatar/catalog";
import {
    PurchaseReviewDialog,
    type SelectedColorCartItem,
} from "@/components/avatar/purchase-review-dialog";
import { UnsavedChangesDialog } from "@/components/avatar/unsaved-changes-dialog";
import { cn } from "@/lib/utils";

export interface AvatarEditorProps {
    initialConfig?: StudentAvatarConfig | null;
    studentName: string;
    onSaveSuccess?: (savedConfig: StudentAvatarConfig) => void;
    onCancel?: () => void;
    className?: string;
}

type MainCategory = "hair" | "face" | "base" | "clothing" | "details";
type HairSubcategory = "all" | "short" | "medium-long" | "headwear" | "bald";
type FaceSubcategory = "all" | "eyes" | "eyebrows" | "mouth";
type DetailsSubcategory = "all" | "eyewear" | "facial-hair";
type OwnershipFilter = "all" | "owned" | "not-owned";

export function AvatarEditor({
    initialConfig,
    studentName,
    onSaveSuccess,
    onCancel,
    className,
}: AvatarEditorProps) {
    const [savedBaseline, setSavedBaseline] = React.useState<StudentAvatarConfig>(
        () => initialConfig ?? DEFAULT_AVATAR_CONFIG
    );

    const [prevInitialConfig, setPrevInitialConfig] = React.useState(initialConfig);
    if (initialConfig !== prevInitialConfig) {
        setPrevInitialConfig(initialConfig);
        setSavedBaseline(initialConfig ?? DEFAULT_AVATAR_CONFIG);
    }

    const [currentConfig, setCurrentConfig] = React.useState<StudentAvatarConfig>(savedBaseline);
    const [activeTab, setActiveTab] = React.useState<MainCategory>("hair");
    const [hairFilter, setHairFilter] = React.useState<HairSubcategory>("all");
    const [faceFilter, setFaceFilter] = React.useState<FaceSubcategory>("all");
    const [detailsFilter, setDetailsFilter] = React.useState<DetailsSubcategory>("all");
    const [ownershipFilter, setOwnershipFilter] = React.useState<OwnershipFilter>("all");

    // Scrollable customization panel ref
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    // Entitlements and Spendable ST Balance
    const [spendableBalance, setSpendableBalance] = React.useState<number>(50);
    const [ownedItemIds, setOwnedItemIds] = React.useState<Set<string>>(new Set());
    const [ownedColorsMap, setOwnedColorsMap] = React.useState<Set<string>>(new Set());
    const [customColorsByItem, setCustomColorsByItem] = React.useState<Map<string, string[]>>(
        new Map()
    );
    const [isLoadingEntitlements, setIsLoadingEntitlements] = React.useState<boolean>(true);

    // Fetch initial entitlements
    React.useEffect(() => {
        let isMounted = true;
        async function loadEntitlements() {
            try {
                const res = await getStudentAvatarEntitlementsAction();
                if (!isMounted) return;
                if (res.success) {
                    setSpendableBalance(res.spendableBalance ?? 50);
                    setOwnedItemIds(new Set(res.ownedItemIds ?? []));

                    const colorKeys = new Set<string>();
                    const customMap = new Map<string, string[]>();

                    for (const c of res.ownedColors ?? []) {
                        colorKeys.add(`${c.itemId}:${c.colorHex.toLowerCase()}`);
                        if (c.isCustom) {
                            const existing = customMap.get(c.itemId) ?? [];
                            if (!existing.includes(c.colorHex)) {
                                existing.push(c.colorHex);
                                customMap.set(c.itemId, existing);
                            }
                        }
                    }
                    setOwnedColorsMap(colorKeys);
                    setCustomColorsByItem(customMap);
                }
            } catch (err) {
                console.error("Failed to load avatar entitlements:", err);
            } finally {
                if (isMounted) setIsLoadingEntitlements(false);
            }
        }
        loadEntitlements();
        return () => {
            isMounted = false;
        };
    }, []);

    // Cart / Purchase Selection State
    const [selectedCartItemIds, setSelectedCartItemIds] = React.useState<Set<string>>(
        new Set()
    );
    const [selectedCartColors, setSelectedCartColors] = React.useState<
        Map<string, SelectedColorCartItem>
    >(new Map());
    const [isCartDialogOpen, setIsCartDialogOpen] = React.useState<boolean>(false);
    const [isPurchasing, setIsPurchasing] = React.useState<boolean>(false);

    // Unsaved Changes Exit Protection Dialog State
    const [isExitDialogOpen, setIsExitDialogOpen] = React.useState<boolean>(false);
    const pendingNavHrefRef = React.useRef<string | null>(null);

    const [isSaving, startSavingTransition] = React.useTransition();
    const [statusMessage, setStatusMessage] = React.useState<{
        type: "success" | "error" | null;
        text: string;
    }>({ type: null, text: "" });

    // Detect if current draft config differs from saved baseline
    const isDirty = React.useMemo(() => {
        return (
            JSON.stringify(currentConfig) !== JSON.stringify(savedBaseline) ||
            selectedCartItemIds.size > 0 ||
            selectedCartColors.size > 0
        );
    }, [currentConfig, savedBaseline, selectedCartItemIds, selectedCartColors]);

    // Live preview data URI
    const previewDataUri = React.useMemo(() => {
        return generateAvatarDataUri(currentConfig);
    }, [currentConfig]);

    // Debounced thumbnail colors snapshot
    const [thumbnailColors, setThumbnailColors] = React.useState({
        hairColor: savedBaseline.hairColor,
        clothesColor: savedBaseline.clothesColor,
        accessoriesColor: savedBaseline.accessoriesColor,
        facialHairColor: savedBaseline.facialHairColor,
    });

    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const latestColorsRef = React.useRef({
        hairColor: savedBaseline.hairColor,
        clothesColor: savedBaseline.clothesColor,
        accessoriesColor: savedBaseline.accessoriesColor,
        facialHairColor: savedBaseline.facialHairColor,
    });

    React.useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Browser-native beforeunload protection for refresh and tab close
    React.useEffect(() => {
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes on your Avatar.";
                return "You have unsaved changes on your Avatar.";
            }
        }
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    // Document click interceptor for internal links when dirty
    React.useEffect(() => {
        function handleDocumentClick(e: MouseEvent) {
            if (!isDirty) return;
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (
                !href ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                anchor.target === "_blank"
            ) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            pendingNavHrefRef.current = href;
            setIsExitDialogOpen(true);
        }

        document.addEventListener("click", handleDocumentClick, true);
        return () => document.removeEventListener("click", handleDocumentClick, true);
    }, [isDirty]);

    // Check if an item is owned
    const checkItemIsOwned = React.useCallback(
        (slot: AvatarSlotName, value: string): boolean => {
            if (isItemInherentFree(slot, value)) return true;
            return ownedItemIds.has(`${slot}:${value}`);
        },
        [ownedItemIds]
    );

    // Check if a color is owned for a specific item
    const checkColorIsOwned = React.useCallback(
        (itemId: string, colorHex: string): boolean => {
            if (isColorInherentFreeForItem(itemId, colorHex)) return true;
            const clean = normalizeHexColor(colorHex);
            if (!clean) return false;
            return ownedColorsMap.has(`${itemId}:${clean}`);
        },
        [ownedColorsMap]
    );

    // Check if any equipped item or color in the draft is currently unowned
    const unownedEquippedList = React.useMemo(() => {
        const list: { type: "item" | "color"; name: string; cost: number; id: string }[] = [];

        // Check top
        if (!checkItemIsOwned("top", currentConfig.top)) {
            const item = getCatalogItemBySlotValue("top", currentConfig.top);
            if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
        }
        if (currentConfig.top !== "none") {
            const topId = `top:${currentConfig.top}`;
            if (!checkColorIsOwned(topId, currentConfig.hairColor)) {
                const cost = getAuthoritativeColorPrice(topId, currentConfig.hairColor);
                list.push({ type: "color", name: `Hair Color (#${currentConfig.hairColor})`, cost, id: topId });
            }
            if (isHeadwearTop(currentConfig.top) && currentConfig.hatColor) {
                if (!checkColorIsOwned(topId, currentConfig.hatColor)) {
                    const cost = getAuthoritativeColorPrice(topId, currentConfig.hatColor);
                    list.push({ type: "color", name: `Headwear Color (#${currentConfig.hatColor})`, cost, id: topId });
                }
            }
        }

        // Check clothing
        if (!checkItemIsOwned("clothing", currentConfig.clothing)) {
            const item = getCatalogItemBySlotValue("clothing", currentConfig.clothing);
            if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
        }
        const clothingId = `clothing:${currentConfig.clothing}`;
        if (!checkColorIsOwned(clothingId, currentConfig.clothesColor)) {
            const cost = getAuthoritativeColorPrice(clothingId, currentConfig.clothesColor);
            list.push({ type: "color", name: `Clothing Color (#${currentConfig.clothesColor})`, cost, id: clothingId });
        }
        if (currentConfig.clothing === "graphicShirt" && currentConfig.clothingGraphic) {
            if (!checkItemIsOwned("clothingGraphic", currentConfig.clothingGraphic)) {
                const item = getCatalogItemBySlotValue("clothingGraphic", currentConfig.clothingGraphic);
                if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
            }
        }

        // Check accessories
        if (currentConfig.accessories !== "none") {
            if (!checkItemIsOwned("accessories", currentConfig.accessories)) {
                const item = getCatalogItemBySlotValue("accessories", currentConfig.accessories);
                if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
            }
            const accId = `accessories:${currentConfig.accessories}`;
            if (!checkColorIsOwned(accId, currentConfig.accessoriesColor)) {
                const cost = getAuthoritativeColorPrice(accId, currentConfig.accessoriesColor);
                list.push({ type: "color", name: `Frame Color (#${currentConfig.accessoriesColor})`, cost, id: accId });
            }
        }

        // Check facial hair
        if (currentConfig.facialHair !== "none") {
            if (!checkItemIsOwned("facialHair", currentConfig.facialHair)) {
                const item = getCatalogItemBySlotValue("facialHair", currentConfig.facialHair);
                if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
            }
            const fhId = `facialHair:${currentConfig.facialHair}`;
            if (!checkColorIsOwned(fhId, currentConfig.facialHairColor)) {
                const cost = getAuthoritativeColorPrice(fhId, currentConfig.facialHairColor);
                list.push({ type: "color", name: `Facial Hair Color (#${currentConfig.facialHairColor})`, cost, id: fhId });
            }
        }

        // Check eyes
        if (!checkItemIsOwned("eyes", currentConfig.eyes)) {
            const item = getCatalogItemBySlotValue("eyes", currentConfig.eyes);
            if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
        }

        // Check eyebrows
        if (!checkItemIsOwned("eyebrows", currentConfig.eyebrows)) {
            const item = getCatalogItemBySlotValue("eyebrows", currentConfig.eyebrows);
            if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
        }

        // Check mouth
        if (!checkItemIsOwned("mouth", currentConfig.mouth)) {
            const item = getCatalogItemBySlotValue("mouth", currentConfig.mouth);
            if (item) list.push({ type: "item", name: item.name, cost: item.cost, id: item.id });
        }

        return list;
    }, [currentConfig, checkItemIsOwned, checkColorIsOwned]);

    const hasUnownedEquipped = unownedEquippedList.length > 0;

    // Cart modification handlers
    const toggleCartItem = (itemId: string) => {
        setSelectedCartItemIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const removeCartItem = (itemId: string) => {
        setSelectedCartItemIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
    };

    const toggleCartColor = (colorItem: SelectedColorCartItem) => {
        const key = `${colorItem.itemId}:${colorItem.colorHex.toLowerCase()}`;
        setSelectedCartColors((prev) => {
            const next = new Map(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.set(key, colorItem);
            }
            return next;
        });
    };

    const removeCartColor = (itemId: string, colorHex: string) => {
        const key = `${itemId}:${colorHex.toLowerCase()}`;
        setSelectedCartColors((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
        });
    };

    // Calculate total cost for cart
    const cartSelectedItems = React.useMemo(() => {
        return Array.from(selectedCartItemIds)
            .map((id) => getCatalogItemById(id))
            .filter((item): item is CatalogItem => item !== undefined);
    }, [selectedCartItemIds]);

    const cartSelectedColors = React.useMemo(() => {
        return Array.from(selectedCartColors.values());
    }, [selectedCartColors]);

    const totalCartCount = cartSelectedItems.length + cartSelectedColors.length;
    const totalCartCost =
        cartSelectedItems.reduce((sum, i) => sum + i.cost, 0) +
        cartSelectedColors.reduce((sum, c) => sum + c.cost, 0);

    // Auto-add unowned equipped items to cart when requested
    const addAllUnownedToCart = () => {
        for (const item of unownedEquippedList) {
            if (item.type === "item") {
                setSelectedCartItemIds((prev) => new Set(prev).add(item.id));
            }
        }
        setIsCartDialogOpen(true);
    };

    // Bulk Purchase Action Execution
    const handleConfirmBulkPurchase = async () => {
        setIsPurchasing(true);
        setStatusMessage({ type: null, text: "" });

        const itemsPayload = cartSelectedItems.map((i) => ({ itemId: i.id }));
        const colorsPayload = cartSelectedColors.map((c) => ({
            itemId: c.itemId,
            colorHex: c.colorHex,
            isCustom: c.isCustom,
        }));

        try {
            const res = await purchaseAvatarSelectionAction({
                items: itemsPayload,
                colors: colorsPayload,
            });

            if (res.success) {
                // Update local ownership state immediately
                setOwnedItemIds((prev) => {
                    const next = new Set(prev);
                    res.purchasedItemIds?.forEach((id) => next.add(id));
                    return next;
                });

                setOwnedColorsMap((prev) => {
                    const next = new Set(prev);
                    res.purchasedColors?.forEach((c) =>
                        next.add(`${c.itemId}:${c.colorHex.toLowerCase()}`)
                    );
                    return next;
                });

                // Add to custom colors if any custom color was purchased
                setCustomColorsByItem((prev) => {
                    const next = new Map(prev);
                    res.purchasedColors?.forEach((c) => {
                        if (c.isCustom) {
                            const existing = next.get(c.itemId) ?? [];
                            if (!existing.includes(c.colorHex)) {
                                next.set(c.itemId, [...existing, c.colorHex]);
                            }
                        }
                    });
                    return next;
                });

                if (typeof res.newBalance === "number") {
                    setSpendableBalance(res.newBalance);
                }

                // Clear cart
                setSelectedCartItemIds(new Set());
                setSelectedCartColors(new Map());
                setIsCartDialogOpen(false);

                setStatusMessage({
                    type: "success",
                    text: `Purchase complete! Deducted ${res.totalCharged} ST. You can now apply and save your avatar.`,
                });
            } else {
                setStatusMessage({
                    type: "error",
                    text: res.error || "Failed to complete purchase.",
                });
            }
        } catch (err) {
            console.error("Bulk purchase error:", err);
            setStatusMessage({
                type: "error",
                text: "An error occurred while processing the purchase.",
            });
        } finally {
            setIsPurchasing(false);
        }
    };

    const updateConfig = <K extends keyof StudentAvatarConfig>(
        key: K,
        value: StudentAvatarConfig[K]
    ) => {
        setCurrentConfig((prev) => {
            if (prev[key] === value) return prev;
            return { ...prev, [key]: value };
        });
        setStatusMessage({ type: null, text: "" });

        if (
            key === "hairColor" ||
            key === "clothesColor" ||
            key === "accessoriesColor" ||
            key === "facialHairColor"
        ) {
            latestColorsRef.current = {
                ...latestColorsRef.current,
                [key]: value as string,
            };
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                const latest = latestColorsRef.current;
                setThumbnailColors({
                    hairColor: latest.hairColor,
                    clothesColor: latest.clothesColor,
                    accessoriesColor: latest.accessoriesColor,
                    facialHairColor: latest.facialHairColor,
                });
                debounceTimerRef.current = null;
            }, 200);
        }
    };

    const handleRandomize = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        const randomFrom = <T,>(arr: readonly T[]): T =>
            arr[Math.floor(Math.random() * arr.length)]!;

        const randomConfig: StudentAvatarConfig = {
            skinColor: randomFrom(ALLOWED_SKIN_COLORS),
            hairColor: randomFrom(ALLOWED_HAIR_COLORS),
            top: randomFrom(ALLOWED_TOPS),
            hatColor: randomFrom(ALLOWED_CLOTHES_COLORS),
            clothing: randomFrom(ALLOWED_CLOTHING),
            clothesColor: randomFrom(ALLOWED_CLOTHES_COLORS),
            clothingGraphic: randomFrom(ALLOWED_CLOTHING_GRAPHICS),
            eyes: randomFrom(ALLOWED_EYES),
            eyebrows: randomFrom(ALLOWED_EYEBROWS),
            mouth: randomFrom(ALLOWED_MOUTH),
            accessories: Math.random() > 0.6 ? randomFrom(ALLOWED_ACCESSORIES) : "none",
            accessoriesColor: randomFrom(ALLOWED_ACCESSORIES_COLORS),
            facialHair: Math.random() > 0.75 ? randomFrom(ALLOWED_FACIAL_HAIR) : "none",
            facialHairColor: randomFrom(ALLOWED_HAIR_COLORS),
        };

        const nextColors = {
            hairColor: randomConfig.hairColor,
            clothesColor: randomConfig.clothesColor,
            accessoriesColor: randomConfig.accessoriesColor,
            facialHairColor: randomConfig.facialHairColor,
        };
        latestColorsRef.current = nextColors;
        setCurrentConfig(randomConfig);
        setThumbnailColors(nextColors);
        setStatusMessage({ type: null, text: "" });
    };

    const handleResetDefault = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        const nextColors = {
            hairColor: DEFAULT_AVATAR_CONFIG.hairColor,
            clothesColor: DEFAULT_AVATAR_CONFIG.clothesColor,
            accessoriesColor: DEFAULT_AVATAR_CONFIG.accessoriesColor,
            facialHairColor: DEFAULT_AVATAR_CONFIG.facialHairColor,
        };
        latestColorsRef.current = nextColors;
        setCurrentConfig(DEFAULT_AVATAR_CONFIG);
        setThumbnailColors(nextColors);
        setStatusMessage({ type: null, text: "" });
    };

    const handleRevert = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        const nextColors = {
            hairColor: savedBaseline.hairColor,
            clothesColor: savedBaseline.clothesColor,
            accessoriesColor: savedBaseline.accessoriesColor,
            facialHairColor: savedBaseline.facialHairColor,
        };
        latestColorsRef.current = nextColors;
        setCurrentConfig(savedBaseline);
        setThumbnailColors(nextColors);
        setStatusMessage({ type: null, text: "" });
    };

    const handleSave = () => {
        if (hasUnownedEquipped) {
            setStatusMessage({
                type: "error",
                text: "Your current avatar draft contains unowned items or colors. Please purchase them before saving.",
            });
            setIsCartDialogOpen(true);
            return;
        }

        startSavingTransition(async () => {
            setStatusMessage({ type: null, text: "" });
            const result = await saveStudentAvatarAction(currentConfig);
            if (result.success) {
                setSavedBaseline(result.config);
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                    debounceTimerRef.current = null;
                }
                const nextColors = {
                    hairColor: result.config.hairColor,
                    clothesColor: result.config.clothesColor,
                    accessoriesColor: result.config.accessoriesColor,
                    facialHairColor: result.config.facialHairColor,
                };
                latestColorsRef.current = nextColors;
                setThumbnailColors(nextColors);
                setStatusMessage({
                    type: "success",
                    text: "Avatar synced across NST Platform!",
                });
                onSaveSuccess?.(result.config);
            } else {
                setStatusMessage({
                    type: "error",
                    text: result.error || "Failed to save avatar.",
                });
            }
        });
    };

    // Exit Handling with Unsaved Protection
    const handleAttemptClose = () => {
        if (isDirty) {
            pendingNavHrefRef.current = null;
            setIsExitDialogOpen(true);
        } else {
            onCancel?.();
        }
    };

    const handleConfirmExit = () => {
        setIsExitDialogOpen(false);
        handleRevert();
        if (pendingNavHrefRef.current) {
            window.location.href = pendingNavHrefRef.current;
            pendingNavHrefRef.current = null;
        } else {
            onCancel?.();
        }
    };

    const hasHeadwear = isHeadwearTop(currentConfig.top);
    const isGraphicShirt = currentConfig.clothing === "graphicShirt";

    // Filtering tops by subcategory AND ownership filter
    const filteredTopGroups = React.useMemo(() => {
        let groups = TOP_OPTIONS;
        if (hairFilter === "short") {
            groups = TOP_OPTIONS.filter((g) => g.category.includes("Short"));
        } else if (hairFilter === "medium-long") {
            groups = TOP_OPTIONS.filter((g) => g.category.includes("Medium"));
        } else if (hairFilter === "headwear") {
            groups = TOP_OPTIONS.filter((g) => g.category.includes("Headwear"));
        } else if (hairFilter === "bald") {
            groups = TOP_OPTIONS.filter((g) => g.category.includes("Bald"));
        }

        if (ownershipFilter === "all") return groups;

        return groups
            .map((g) => ({
                ...g,
                options: g.options.filter((opt) => {
                    const isOwned = checkItemIsOwned("top", opt.value);
                    return ownershipFilter === "owned" ? isOwned : !isOwned;
                }),
            }))
            .filter((g) => g.options.length > 0);
    }, [hairFilter, ownershipFilter, checkItemIsOwned]);

    // Filtering clothing options by ownership filter
    const filteredClothingOptions = React.useMemo(() => {
        if (ownershipFilter === "all") return CLOTHING_OPTIONS;
        return CLOTHING_OPTIONS.filter((opt) => {
            const isOwned = checkItemIsOwned("clothing", opt.value);
            return ownershipFilter === "owned" ? isOwned : !isOwned;
        });
    }, [ownershipFilter, checkItemIsOwned]);

    // Filtering accessories by ownership filter
    const filteredAccessoryOptions = React.useMemo(() => {
        if (ownershipFilter === "all") return ACCESSORY_OPTIONS;
        return ACCESSORY_OPTIONS.filter((opt) => {
            const isOwned = checkItemIsOwned("accessories", opt.value);
            return ownershipFilter === "owned" ? isOwned : !isOwned;
        });
    }, [ownershipFilter, checkItemIsOwned]);

    // Filtering facial hair by ownership filter
    const filteredFacialHairOptions = React.useMemo(() => {
        if (ownershipFilter === "all") return FACIAL_HAIR_OPTIONS;
        return FACIAL_HAIR_OPTIONS.filter((opt) => {
            const isOwned = checkItemIsOwned("facialHair", opt.value);
            return ownershipFilter === "owned" ? isOwned : !isOwned;
        });
    }, [ownershipFilter, checkItemIsOwned]);

    // Filtering eyes by ownership filter
    const filteredEyesOptions = React.useMemo(() => {
        if (ownershipFilter === "all") return EYES_OPTIONS;
        return EYES_OPTIONS.filter((opt) => {
            const isOwned = checkItemIsOwned("eyes", opt.value);
            return ownershipFilter === "owned" ? isOwned : !isOwned;
        });
    }, [ownershipFilter, checkItemIsOwned]);

    // Filtering eyebrows by ownership filter
    const filteredEyebrowsOptions = React.useMemo(() => {
        if (ownershipFilter === "all") return EYEBROWS_OPTIONS;
        return EYEBROWS_OPTIONS.filter((opt) => {
            const isOwned = checkItemIsOwned("eyebrows", opt.value);
            return ownershipFilter === "owned" ? isOwned : !isOwned;
        });
    }, [ownershipFilter, checkItemIsOwned]);

    // Filtering mouth by ownership filter
    const filteredMouthOptions = React.useMemo(() => {
        if (ownershipFilter === "all") return MOUTH_OPTIONS;
        return MOUTH_OPTIONS.filter((opt) => {
            const isOwned = checkItemIsOwned("mouth", opt.value);
            return ownershipFilter === "owned" ? isOwned : !isOwned;
        });
    }, [ownershipFilter, checkItemIsOwned]);

    return (
        <div
            className={cn(
                "relative rounded-2xl max-h-fit overflow-hidden border border-gold-500/30 bg-card p-4 sm:p-6 shadow-2xl dark:bg-space-900/95 transition-all",
                className
            )}
        >
            {/* Background Ambient Space Glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 size-72 rounded-full bg-gold-500/10 blur-3xl opacity-70"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute size-72 rounded-full bg-gold-500/5 blur-3xl opacity-70"
            />

            {/* Mobile-Only Persistent Character Stage Header */}
            <div className="sticky top-12 z-20 -mx-4 -mt-4 mb-4 flex flex-col border-b border-gold-500/30 bg-space-950/95 px-4 py-3 backdrop-blur-md rounded-t-2xl shadow-md lg:hidden">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Circular Avatar Spotlight */}
                        <div className="relative size-14 shrink-0 rounded-full border-2 border-gold-500/50 bg-gradient-to-b from-space-850 to-space-950 p-0.5 shadow-gold overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewDataUri}
                                alt={`${studentName}'s avatar preview`}
                                className="size-full select-none object-cover rounded-full"
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-xs font-bold text-starlight-100">
                                    {studentName}
                                </span>
                                {isDirty && (
                                    <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/30 animate-pulse">
                                        Draft
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Coins className="size-3 text-gold-400" />
                                <span className="font-mono text-[10px] text-gold-300 font-bold">
                                    {spendableBalance} ST
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {totalCartCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsCartDialogOpen(true)}
                                className="relative inline-flex items-center gap-1 rounded-lg bg-gold-500/20 border border-gold-500/40 px-2 py-1 text-xs font-bold text-gold-300 shadow-gold"
                            >
                                <ShoppingBag className="size-3.5" />
                                <span className="font-mono text-[11px]">{totalCartCost} ST</span>
                                <span className="flex size-4 items-center justify-center rounded-full bg-gold-400 text-space-950 text-[9px] font-bold">
                                    {totalCartCount}
                                </span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleRandomize}
                            title="Randomize Appearance"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-space-850 text-gold-400 hover:border-gold-500/40 hover:bg-space-800"
                        >
                            <Dices className="size-4" />
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !isDirty || hasUnownedEquipped}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-gold transition-all",
                                isDirty && !hasUnownedEquipped
                                    ? "bg-gradient-to-r from-gold-500 to-gold-600 text-space-950 hover:brightness-110 active:scale-95"
                                    : "bg-space-800 text-starlight-400 border border-border/60 cursor-not-allowed opacity-60"
                            )}
                        >
                            {isSaving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Save className="size-3.5" />
                            )}
                            <span className="text-[11px]">{isDirty ? "Save" : "Saved"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            title="Close Editor"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-space-850 text-starlight-400 hover:text-starlight-100"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {statusMessage.type && (
                    <div
                        className={cn(
                            "mt-2 text-center py-1 px-2 rounded-lg text-[10px] font-semibold animate-fade-in",
                            statusMessage.type === "success"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        )}
                    >
                        {statusMessage.text}
                    </div>
                )}
            </div>

            {/* Desktop Top Workspace Header */}
            <div className="relative mb-6 hidden items-center justify-between gap-3 border-b border-border/70 pb-4 lg:flex">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-400">
                            <Sparkles className="size-3" />
                            Avatar Studio & Store
                        </span>
                        {isDirty && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30 animate-pulse">
                                Draft Unsaved
                            </span>
                        )}
                    </div>
                    <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-starlight-100 sm:text-2xl">
                        Character Creator & Store
                    </h2>
                    <p className="text-xs text-starlight-400">
                        Customize your cadet avatar, try premium options freely, and purchase with ST tokens.
                    </p>
                </div>

                {/* Desktop Top Action Toolbar */}
                <div className="flex items-center gap-2.5">
                    {/* Live Spendable ST Balance Indicator */}
                    <div className="flex items-center gap-2 rounded-xl border border-gold-500/30 bg-space-850/90 px-3 py-1.5 shadow-xs">
                        <div className="flex size-5 items-center justify-center rounded-md bg-gold-500/15 text-gold-400">
                            <Coins className="size-3 text-gold-400" />
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono text-xs font-bold text-gold-300">
                                {spendableBalance}
                            </span>
                            <span className="text-[10px] font-semibold uppercase text-gold-500">
                                ST
                            </span>
                        </div>
                    </div>

                    {/* Cart Trigger */}
                    {totalCartCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsCartDialogOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/40 px-3 py-1.5 text-xs font-bold text-gold-300 shadow-gold transition-all hover:brightness-110 active:scale-95"
                        >
                            <ShoppingBag className="size-3.5" />
                            <span>Cart ({totalCartCount})</span>
                            <span className="rounded-md bg-gold-400/20 px-1.5 py-0.5 font-mono text-[10px] text-gold-200">
                                {totalCartCost} ST
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleRandomize}
                        title="Randomize Appearance"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-space-850 px-3 py-1.5 text-xs font-medium text-starlight-200 transition-colors hover:border-gold-500/40 hover:bg-space-800 hover:text-gold-300"
                    >
                        <Dices className="size-3.5 text-gold-400" />
                        <span>Randomize</span>
                    </button>

                    {isDirty && (
                        <button
                            type="button"
                            onClick={handleRevert}
                            title="Revert to Saved"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-space-850 px-3 py-1.5 text-xs font-medium text-starlight-300 transition-colors hover:bg-space-800 hover:text-starlight-100"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Revert</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleAttemptClose}
                        title="Close Editor"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-transparent px-3 py-1.5 text-xs font-medium text-starlight-300 hover:bg-space-850 hover:text-starlight-100"
                    >
                        <X className="size-3.5" />
                        <span>Close</span>
                    </button>
                </div>
            </div>

            {/* Main Layout: Left = Sticky Live Character Stage, Right = Customization & Store Panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                {/* Left: Sticky Live Character Stage (Desktop) */}
                <div className="hidden lg:flex flex-col items-center justify-between rounded-2xl border border-gold-500/30 bg-gradient-to-b from-space-900/95 via-space-950/90 to-space-950 p-6 text-center lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 lg:self-start lg:h-fit shadow-2xl relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-gold-500/10 blur-2xl"
                    />

                    <div className="w-full relative z-10">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400/90">
                                Cadet Identity Stage
                            </span>
                            {isDirty ? (
                                <span className="text-[10px] font-semibold text-amber-400">
                                    Draft Preview
                                </span>
                            ) : (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                    Saved & Active
                                </span>
                            )}
                        </div>

                        {/* Character Frame */}
                        <div className="relative mx-auto my-3 flex size-48 sm:size-56 items-center justify-center rounded-full border-2 border-gold-500/50 bg-gradient-to-b from-space-850 to-space-950 p-1 shadow-gold ring-4 ring-gold-500/15 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewDataUri}
                                alt={`${studentName}'s avatar preview`}
                                className="size-full select-none object-cover rounded-full transition-transform duration-200"
                            />
                        </div>

                        <h3 className="font-display text-lg font-bold text-starlight-100 truncate mt-2">
                            {studentName}
                        </h3>

                        {/* Unowned items alert on stage */}
                        {hasUnownedEquipped && (
                            <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-center">
                                <span className="block text-[11px] font-semibold text-amber-300">
                                    Previewing {unownedEquippedList.length} unowned{" "}
                                    {unownedEquippedList.length === 1 ? "item" : "items"}
                                </span>
                                <button
                                    type="button"
                                    onClick={addAllUnownedToCart}
                                    className="mt-1 text-[10px] font-bold text-gold-300 hover:text-gold-200 underline underline-offset-2 transition-colors"
                                >
                                    Purchase to Keep ({unownedEquippedList.reduce((s, i) => s + i.cost, 0)} ST)
                                </button>
                            </div>
                        )}

                        {/* Quick Action Toolbar on Stage */}
                        <div className="mt-3 flex items-center justify-center gap-2 pt-2 border-t border-border/40">
                            <button
                                type="button"
                                onClick={handleRandomize}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-starlight-300 hover:text-gold-300 transition-colors rounded-sm"
                            >
                                <Dices className="size-3 text-gold-400" />
                                <span>Randomize</span>
                            </button>
                            <span className="text-starlight-600">•</span>
                            <button
                                type="button"
                                onClick={handleResetDefault}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-starlight-400 hover:text-gold-300 transition-colors rounded-sm"
                            >
                                <Undo2 className="size-3" />
                                <span>Default</span>
                            </button>
                            <span className="text-starlight-600">•</span>
                            <button
                                type="button"
                                onClick={handleRevert}
                                disabled={!isDirty}
                                className={cn(
                                    "inline-flex items-center gap-1 text-[11px] font-medium transition-colors rounded-sm",
                                    isDirty
                                        ? "text-starlight-300 hover:text-gold-300 cursor-pointer"
                                        : "text-starlight-600 cursor-not-allowed opacity-50"
                                )}
                            >
                                <RotateCcw className="size-3 text-gold-400" />
                                <span>Revert</span>
                            </button>
                        </div>
                    </div>

                    {/* Status Banners & Primary CTA */}
                    <div className="mt-5 w-full space-y-3 relative z-10">
                        {statusMessage.type === "success" && (
                            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-2 text-xs font-semibold text-emerald-300 animate-fade-in">
                                <Check className="size-4 shrink-0" />
                                <span>{statusMessage.text}</span>
                            </div>
                        )}

                        {statusMessage.type === "error" && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2 text-xs font-medium text-rose-300 animate-fade-in">
                                {statusMessage.text}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {/* If unowned items are equipped, show button to checkout */}
                            {hasUnownedEquipped ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        addAllUnownedToCart();
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-space-950 shadow-gold hover:brightness-110 active:scale-[0.98] transition-all"
                                >
                                    <ShoppingBag className="size-4" />
                                    <span>
                                        Purchase Selection (
                                        {unownedEquippedList.reduce((s, i) => s + i.cost, 0)} ST)
                                    </span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving || !isDirty}
                                    className={cn(
                                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-gold transition-all duration-200",
                                        isDirty
                                            ? "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-space-950 hover:brightness-110 active:scale-[0.98]"
                                            : "cursor-not-allowed bg-space-850 text-starlight-400 border border-border/70"
                                    )}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Saving Avatar...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            <span>{isDirty ? "Save Avatar Changes" : "Avatar Saved"}</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={handleAttemptClose}
                                    disabled={isSaving}
                                    className="w-full rounded-xl border border-border/70 py-2 text-xs font-medium transition-colors hover:bg-space-850 text-starlight-300"
                                >
                                    Close Editor
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Customization Controls Panel */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8 flex flex-col">
                    {/* Category Navigation Tabs */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-xl border border-border/70 bg-space-950/80 p-1.5 no-scrollbar shrink-0">
                        <div className="flex items-center gap-1">
                            <TabButton
                                active={activeTab === "hair"}
                                onClick={() => setActiveTab("hair")}
                                icon={Sparkles}
                                label="Hair & Hats"
                            />
                            <TabButton
                                active={activeTab === "face"}
                                onClick={() => setActiveTab("face")}
                                icon={Smile}
                                label="Expression"
                            />
                            <TabButton
                                active={activeTab === "base"}
                                onClick={() => setActiveTab("base")}
                                icon={Sliders}
                                label="Skin Tone"
                            />
                            <TabButton
                                active={activeTab === "clothing"}
                                onClick={() => setActiveTab("clothing")}
                                icon={Shirt}
                                label="Outfits"
                            />
                            <TabButton
                                active={activeTab === "details"}
                                onClick={() => setActiveTab("details")}
                                icon={Glasses}
                                label="Accessories"
                            />
                        </div>

                        {/* Ownership Filter Pills (All / Owned / Not Owned) */}
                        <div className="flex items-center gap-1 border-l border-border/60 pl-2 shrink-0">
                            <Filter className="size-3 text-starlight-400 mr-0.5" />
                            <FilterChip
                                active={ownershipFilter === "all"}
                                onClick={() => setOwnershipFilter("all")}
                                label="All"
                            />
                            <FilterChip
                                active={ownershipFilter === "owned"}
                                onClick={() => setOwnershipFilter("owned")}
                                label="Owned"
                            />
                            <FilterChip
                                active={ownershipFilter === "not-owned"}
                                onClick={() => setOwnershipFilter("not-owned")}
                                label="Store"
                            />
                        </div>
                    </div>

                    {/* Independently Scrollable Customization Area */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto max-h-[calc(100vh-14rem)] lg:max-h-[calc(100vh-13rem)] pr-1 sm:pr-2 space-y-5 custom-scrollbar"
                    >
                        {/* Tab 1: Hair & Headwear */}
                        {activeTab === "hair" && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Item-Specific Hair Color Palette */}
                                <ItemSpecificColorSection
                                    itemId={`top:${currentConfig.top}`}
                                    itemLabel="Hairstyle"
                                    currentColor={currentConfig.hairColor}
                                    presets={HAIR_COLOR_OPTIONS}
                                    freeHexes={DEFAULT_HAIR_FREE_HEXES}
                                    ownedColorsMap={ownedColorsMap}
                                    customColors={customColorsByItem.get(`top:${currentConfig.top}`) ?? []}
                                    cartColors={selectedCartColors}
                                    onSelectColor={(hex) => updateConfig("hairColor", hex)}
                                    onToggleCartColor={toggleCartColor}
                                />

                                {/* Hat Color (conditional when headwear selected) */}
                                {hasHeadwear && (
                                    <ItemSpecificColorSection
                                        itemId={`top:${currentConfig.top}`}
                                        itemLabel="Headwear / Hat"
                                        currentColor={currentConfig.hatColor ?? "262e33"}
                                        presets={HAT_COLOR_OPTIONS}
                                        freeHexes={DEFAULT_CLOTHES_FREE_HEXES}
                                        ownedColorsMap={ownedColorsMap}
                                        customColors={
                                            customColorsByItem.get(`top:${currentConfig.top}`) ?? []
                                        }
                                        cartColors={selectedCartColors}
                                        onSelectColor={(hex) => updateConfig("hatColor", hex)}
                                        onToggleCartColor={toggleCartColor}
                                    />
                                )}

                                {/* Subcategory Filter Pills */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <SubcategoryPill
                                        active={hairFilter === "all"}
                                        onClick={() => setHairFilter("all")}
                                        label="All Styles"
                                    />
                                    <SubcategoryPill
                                        active={hairFilter === "short"}
                                        onClick={() => setHairFilter("short")}
                                        label="Short & Clean"
                                    />
                                    <SubcategoryPill
                                        active={hairFilter === "medium-long"}
                                        onClick={() => setHairFilter("medium-long")}
                                        label="Medium & Long"
                                    />
                                    <SubcategoryPill
                                        active={hairFilter === "headwear"}
                                        onClick={() => setHairFilter("headwear")}
                                        label="Headwear & Wraps"
                                    />
                                    <SubcategoryPill
                                        active={hairFilter === "bald"}
                                        onClick={() => setHairFilter("bald")}
                                        label="Minimal / Bald"
                                    />
                                </div>

                                {/* Hairstyle Groups with Item Cards */}
                                {filteredTopGroups.map((group) => (
                                    <div key={group.category} className="space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                                {group.category}
                                            </h4>
                                            <span className="text-[10px] text-starlight-500 font-mono">
                                                {group.options.length} styles
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                            {group.options.map((option) => {
                                                const itemId = `top:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned("top", option.value);
                                                const isEquipped = currentConfig.top === option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getTopThumbnail(
                                                            option.value,
                                                            thumbnailColors.hairColor
                                                        )}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() => updateConfig("top", option.value)}
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tab 2: Face & Expression */}
                        {activeTab === "face" && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="flex items-center gap-1.5 pt-1">
                                    <SubcategoryPill
                                        active={faceFilter === "all"}
                                        onClick={() => setFaceFilter("all")}
                                        label="All Expressions"
                                    />
                                    <SubcategoryPill
                                        active={faceFilter === "eyes"}
                                        onClick={() => setFaceFilter("eyes")}
                                        label={`Eyes (${filteredEyesOptions.length})`}
                                    />
                                    <SubcategoryPill
                                        active={faceFilter === "eyebrows"}
                                        onClick={() => setFaceFilter("eyebrows")}
                                        label={`Eyebrows (${filteredEyebrowsOptions.length})`}
                                    />
                                    <SubcategoryPill
                                        active={faceFilter === "mouth"}
                                        onClick={() => setFaceFilter("mouth")}
                                        label={`Mouth (${filteredMouthOptions.length})`}
                                    />
                                </div>

                                {/* Eye Styles */}
                                {(faceFilter === "all" || faceFilter === "eyes") && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                                <Eye className="size-3.5 text-gold-400" />
                                                Eye Expression
                                            </h4>
                                            <span className="text-[10px] text-starlight-500 font-mono">
                                                {filteredEyesOptions.length} shapes
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                            {filteredEyesOptions.map((option) => {
                                                const itemId = `eyes:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned("eyes", option.value);
                                                const isEquipped = currentConfig.eyes === option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getEyesThumbnail(option.value)}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() => updateConfig("eyes", option.value)}
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Eyebrows */}
                                {(faceFilter === "all" || faceFilter === "eyebrows") && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                                Eyebrow Attitude
                                            </h4>
                                            <span className="text-[10px] text-starlight-500 font-mono">
                                                {filteredEyebrowsOptions.length} styles
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                            {filteredEyebrowsOptions.map((option) => {
                                                const itemId = `eyebrows:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned("eyebrows", option.value);
                                                const isEquipped = currentConfig.eyebrows === option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getEyebrowsThumbnail(option.value)}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() => updateConfig("eyebrows", option.value)}
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Mouth Expressions */}
                                {(faceFilter === "all" || faceFilter === "mouth") && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                                <Smile className="size-3.5 text-gold-400" />
                                                Mouth Expression
                                            </h4>
                                            <span className="text-[10px] text-starlight-500 font-mono">
                                                {filteredMouthOptions.length} expressions
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                            {filteredMouthOptions.map((option) => {
                                                const itemId = `mouth:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned("mouth", option.value);
                                                const isEquipped = currentConfig.mouth === option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getMouthThumbnail(option.value)}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() => updateConfig("mouth", option.value)}
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 3: Skin Tone */}
                        {activeTab === "base" && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="rounded-xl border border-border/60 bg-space-950/40 p-4 sm:p-5">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gold-400">
                                                Cadet Complexion & Skin Tone
                                            </label>
                                            <p className="text-[11px] text-starlight-400 mt-0.5">
                                                All 7 base cadet tones are free. Custom hex tones can be unlocked.
                                            </p>
                                        </div>

                                        {/* Custom Color Trigger */}
                                        <div className="relative group">
                                            <div
                                                className={cn(
                                                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-150 cursor-pointer",
                                                    !SKIN_COLOR_OPTIONS.some(
                                                        (s) =>
                                                            s.value.toLowerCase() ===
                                                            currentConfig.skinColor.toLowerCase()
                                                    )
                                                        ? "border-gold-400 bg-gold-500/15 text-gold-300 ring-2 ring-gold-400/50 shadow-gold font-semibold"
                                                        : "border-border/60 bg-space-850/80 text-starlight-300 hover:border-gold-500/40 hover:text-starlight-100"
                                                )}
                                                title="Pick custom skin hex"
                                            >
                                                <span
                                                    className="size-4 rounded-full border border-black/30 shrink-0 shadow-xs"
                                                    style={{ backgroundColor: `#${currentConfig.skinColor}` }}
                                                />
                                                <Palette className="size-3 text-gold-400" />
                                                <span className="font-mono text-[11px]">
                                                    #{currentConfig.skinColor.toUpperCase()}
                                                </span>
                                                <input
                                                    type="color"
                                                    value={`#${currentConfig.skinColor}`}
                                                    onChange={(e) => {
                                                        const clean = normalizeHexColor(e.target.value);
                                                        if (clean) updateConfig("skinColor", clean);
                                                    }}
                                                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                                                    aria-label="Custom Skin Tone Picker"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 7 Preset Complexion Cards */}
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                        {SKIN_COLOR_OPTIONS.map((color) => {
                                            const isSelected =
                                                currentConfig.skinColor.toLowerCase() ===
                                                color.value.toLowerCase();
                                            return (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => updateConfig("skinColor", color.value)}
                                                    className={cn(
                                                        "group relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all select-none",
                                                        isSelected
                                                            ? "border-gold-400 bg-gold-500/15 shadow-gold ring-2 ring-gold-400/50 font-semibold"
                                                            : "border-border/60 bg-space-850/60 hover:border-gold-500/30 hover:bg-space-850"
                                                    )}
                                                >
                                                    <span
                                                        className="size-8 shrink-0 rounded-full border border-black/30 shadow-xs group-hover:scale-105 transition-transform"
                                                        style={{ backgroundColor: color.hex }}
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="block truncate text-xs font-medium text-starlight-100">
                                                            {color.label}
                                                        </span>
                                                        <span className="block text-[10px] text-emerald-400 font-semibold">
                                                            Free
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-gold-400 text-space-950 shadow-xs">
                                                            <Check className="size-2.5 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Clothing & Outfits */}
                        {activeTab === "clothing" && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Item-Specific Clothes Color Palette */}
                                <ItemSpecificColorSection
                                    itemId={`clothing:${currentConfig.clothing}`}
                                    itemLabel="Outfit"
                                    currentColor={currentConfig.clothesColor}
                                    presets={CLOTHES_COLOR_OPTIONS}
                                    freeHexes={DEFAULT_CLOTHES_FREE_HEXES}
                                    ownedColorsMap={ownedColorsMap}
                                    customColors={
                                        customColorsByItem.get(`clothing:${currentConfig.clothing}`) ?? []
                                    }
                                    cartColors={selectedCartColors}
                                    onSelectColor={(hex) => updateConfig("clothesColor", hex)}
                                    onToggleCartColor={toggleCartColor}
                                />

                                {/* Clothing Styles */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                            Outfit Styles
                                        </h4>
                                        <span className="text-[10px] text-starlight-500 font-mono">
                                            {filteredClothingOptions.length} styles
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                        {filteredClothingOptions.map((option) => {
                                            const itemId = `clothing:${option.value}`;
                                            const catalogItem = getCatalogItemById(itemId);
                                            const isOwned = checkItemIsOwned("clothing", option.value);
                                            const isEquipped = currentConfig.clothing === option.value;
                                            const isInCart = selectedCartItemIds.has(itemId);

                                            return (
                                                <StoreItemCard
                                                    key={option.value}
                                                    name={option.label}
                                                    thumbnailUri={getClothingThumbnail(
                                                        option.value,
                                                        thumbnailColors.clothesColor
                                                    )}
                                                    isEquipped={isEquipped}
                                                    isOwned={isOwned}
                                                    isFree={catalogItem?.isFree ?? false}
                                                    cost={catalogItem?.cost ?? 0}
                                                    rarity={catalogItem?.rarity ?? "COMMON"}
                                                    isInCart={isInCart}
                                                    onEquip={() => updateConfig("clothing", option.value)}
                                                    onToggleCart={() => toggleCartItem(itemId)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Graphic Shirt Badges */}
                                {isGraphicShirt && (
                                    <div className="space-y-2.5 rounded-xl border border-gold-500/30 bg-space-950/50 p-4">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400">
                                                <Tag className="size-3.5" />
                                                T-Shirt Graphic Badge
                                            </h4>
                                            <span className="text-[10px] text-starlight-500 font-mono">
                                                {CLOTHING_GRAPHIC_OPTIONS.length} badges
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                            {CLOTHING_GRAPHIC_OPTIONS.map((option) => {
                                                const itemId = `clothingGraphic:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned(
                                                    "clothingGraphic",
                                                    option.value
                                                );
                                                const isEquipped =
                                                    (currentConfig.clothingGraphic ?? "none") ===
                                                    option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getGraphicThumbnail(option.value)}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() =>
                                                            updateConfig("clothingGraphic", option.value)
                                                        }
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 5: Accessories & Details */}
                        {activeTab === "details" && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="flex items-center gap-1.5 pt-1">
                                    <SubcategoryPill
                                        active={detailsFilter === "all"}
                                        onClick={() => setDetailsFilter("all")}
                                        label="All Details"
                                    />
                                    <SubcategoryPill
                                        active={detailsFilter === "eyewear"}
                                        onClick={() => setDetailsFilter("eyewear")}
                                        label="Eyewear (8)"
                                    />
                                    <SubcategoryPill
                                        active={detailsFilter === "facial-hair"}
                                        onClick={() => setDetailsFilter("facial-hair")}
                                        label="Facial Hair (6)"
                                    />
                                </div>

                                {/* Glasses / Eyewear */}
                                {(detailsFilter === "all" || detailsFilter === "eyewear") && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                                <Glasses className="size-3.5 text-gold-400" />
                                                Eyewear & Accessories
                                            </h4>
                                            {currentConfig.accessories !== "none" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateConfig("accessories", "none")}
                                                    className="text-[11px] text-starlight-400 hover:text-gold-300 transition-colors"
                                                >
                                                    Remove Eyewear
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                            {filteredAccessoryOptions.map((option) => {
                                                const itemId = `accessories:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned("accessories", option.value);
                                                const isEquipped =
                                                    currentConfig.accessories === option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getAccessoryThumbnail(
                                                            option.value,
                                                            thumbnailColors.accessoriesColor
                                                        )}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() =>
                                                            updateConfig("accessories", option.value)
                                                        }
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {currentConfig.accessories !== "none" && (
                                            <ItemSpecificColorSection
                                                itemId={`accessories:${currentConfig.accessories}`}
                                                itemLabel="Eyewear Frame"
                                                currentColor={currentConfig.accessoriesColor}
                                                presets={ACCESSORIES_COLOR_OPTIONS}
                                                freeHexes={DEFAULT_ACCESSORIES_FREE_HEXES}
                                                ownedColorsMap={ownedColorsMap}
                                                customColors={
                                                    customColorsByItem.get(
                                                        `accessories:${currentConfig.accessories}`
                                                    ) ?? []
                                                }
                                                cartColors={selectedCartColors}
                                                onSelectColor={(hex) =>
                                                    updateConfig("accessoriesColor", hex)
                                                }
                                                onToggleCartColor={toggleCartColor}
                                                className="mt-3"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Facial Hair */}
                                {(detailsFilter === "all" || detailsFilter === "facial-hair") && (
                                    <div className="space-y-3 pt-3 border-t border-border/50">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                                <UserCheck className="size-3.5 text-gold-400" />
                                                Facial Hair & Grooming
                                            </h4>
                                            {currentConfig.facialHair !== "none" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateConfig("facialHair", "none")}
                                                    className="text-[11px] text-starlight-400 hover:text-gold-300 transition-colors"
                                                >
                                                    Clean Shaven
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                            {filteredFacialHairOptions.map((option) => {
                                                const itemId = `facialHair:${option.value}`;
                                                const catalogItem = getCatalogItemById(itemId);
                                                const isOwned = checkItemIsOwned("facialHair", option.value);
                                                const isEquipped =
                                                    currentConfig.facialHair === option.value;
                                                const isInCart = selectedCartItemIds.has(itemId);

                                                return (
                                                    <StoreItemCard
                                                        key={option.value}
                                                        name={option.label}
                                                        thumbnailUri={getFacialHairThumbnail(
                                                            option.value,
                                                            thumbnailColors.facialHairColor
                                                        )}
                                                        isEquipped={isEquipped}
                                                        isOwned={isOwned}
                                                        isFree={catalogItem?.isFree ?? false}
                                                        cost={catalogItem?.cost ?? 0}
                                                        rarity={catalogItem?.rarity ?? "COMMON"}
                                                        isInCart={isInCart}
                                                        onEquip={() =>
                                                            updateConfig("facialHair", option.value)
                                                        }
                                                        onToggleCart={() => toggleCartItem(itemId)}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {currentConfig.facialHair !== "none" && (
                                            <ItemSpecificColorSection
                                                itemId={`facialHair:${currentConfig.facialHair}`}
                                                itemLabel="Beard / Moustache"
                                                currentColor={currentConfig.facialHairColor}
                                                presets={HAIR_COLOR_OPTIONS}
                                                freeHexes={DEFAULT_HAIR_FREE_HEXES}
                                                ownedColorsMap={ownedColorsMap}
                                                customColors={
                                                    customColorsByItem.get(
                                                        `facialHair:${currentConfig.facialHair}`
                                                    ) ?? []
                                                }
                                                cartColors={selectedCartColors}
                                                onSelectColor={(hex) =>
                                                    updateConfig("facialHairColor", hex)
                                                }
                                                onToggleCartColor={toggleCartColor}
                                                className="mt-3"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Bottom Save & Close Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border/60 lg:hidden">
                        {hasUnownedEquipped ? (
                            <button
                                type="button"
                                onClick={addAllUnownedToCart}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold bg-amber-500 text-space-950 shadow-gold"
                            >
                                <ShoppingBag className="size-3.5" />
                                <span>
                                    Purchase ({unownedEquippedList.reduce((s, i) => s + i.cost, 0)} ST)
                                </span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || !isDirty}
                                className={cn(
                                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-gold transition-all",
                                    isDirty
                                        ? "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-space-950 active:scale-95"
                                        : "bg-space-850 text-starlight-400 border border-border/70 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-3.5" />
                                        <span>{isDirty ? "Save Avatar" : "Saved"}</span>
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            className="rounded-xl border border-border/70 bg-space-850 px-4 py-2.5 text-xs font-medium text-starlight-300 hover:bg-space-800"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Purchase Review Dialog */}
            <PurchaseReviewDialog
                open={isCartDialogOpen}
                onOpenChange={setIsCartDialogOpen}
                selectedItems={cartSelectedItems}
                selectedColors={cartSelectedColors}
                onRemoveItem={removeCartItem}
                onRemoveColor={removeCartColor}
                spendableBalance={spendableBalance}
                onConfirmPurchase={handleConfirmBulkPurchase}
                isPurchasing={isPurchasing}
            />

            {/* Unsaved Changes Confirmation Dialog */}
            <UnsavedChangesDialog
                open={isExitDialogOpen}
                onStay={() => setIsExitDialogOpen(false)}
                onConfirmLeave={handleConfirmExit}
            />
        </div>
    );
}

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all select-none",
                active
                    ? "bg-gold-500/15 text-gold-300 border border-gold-500/35 shadow-gold font-semibold"
                    : "text-starlight-400 hover:bg-space-850 hover:text-starlight-200 border border-transparent"
            )}
        >
            <Icon className={cn("size-3.5", active ? "text-gold-400" : "text-starlight-400")} />
            <span>{label}</span>
        </button>
    );
}

function SubcategoryPill({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all select-none border",
                active
                    ? "border-gold-500/40 bg-gold-500/15 text-gold-300 font-semibold"
                    : "border-border/60 bg-space-850/60 text-starlight-400 hover:border-gold-500/30 hover:text-starlight-200"
            )}
        >
            {label}
        </button>
    );
}

function FilterChip({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-all select-none border",
                active
                    ? "border-gold-500/50 bg-gold-500/20 text-gold-300 font-bold"
                    : "border-transparent text-starlight-400 hover:text-starlight-200 hover:bg-space-850"
            )}
        >
            {label}
        </button>
    );
}

interface StoreItemCardProps {
    name: string;
    thumbnailUri: string;
    isEquipped: boolean;
    isOwned: boolean;
    isFree: boolean;
    cost: number;
    rarity: "COMMON" | "RARE" | "EPIC";
    isInCart?: boolean;
    onEquip: () => void;
    onToggleCart?: () => void;
}

const StoreItemCard = React.memo(function StoreItemCard({
    name,
    thumbnailUri,
    isEquipped,
    isOwned,
    isFree,
    cost,
    rarity,
    isInCart,
    onEquip,
    onToggleCart,
}: StoreItemCardProps) {
    return (
        <div
            className={cn(
                "group relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all duration-150 select-none",
                isEquipped
                    ? "border-gold-400 bg-gold-500/15 shadow-gold ring-2 ring-gold-400/50"
                    : isInCart
                    ? "border-amber-400/80 bg-amber-500/10 shadow-xs"
                    : "border-border/60 bg-space-850/60 hover:border-gold-500/40 hover:bg-space-850"
            )}
        >
            {/* Top badges bar */}
            <div className="w-full flex items-center justify-between mb-1 px-0.5">
                <span
                    className={cn(
                        "rounded-xs px-1 py-0.2 text-[8px] font-bold uppercase",
                        rarity === "EPIC"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : rarity === "RARE"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-starlight-500/10 text-starlight-400"
                    )}
                >
                    {rarity}
                </span>

                {isFree ? (
                    <span className="text-[9px] font-bold text-emerald-400">Free</span>
                ) : isOwned ? (
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Check className="size-2.5 stroke-[3]" /> Owned
                    </span>
                ) : (
                    <span className="font-mono text-[9px] font-bold text-gold-400">
                        {cost} ST
                    </span>
                )}
            </div>

            {/* Clickable thumbnail area for instant preview */}
            <button
                type="button"
                onClick={onEquip}
                className="relative mb-1 flex size-14 sm:size-16 items-center justify-center overflow-hidden rounded-lg bg-space-900/80 p-0.5 w-full cursor-pointer hover:scale-102 transition-transform"
                title={`Preview ${name}`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={thumbnailUri}
                    alt={name}
                    loading="lazy"
                    className="size-full select-none object-contain"
                />

                {isEquipped && (
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-gold-400 text-space-950 shadow-xs">
                        <Check className="size-2.5 stroke-[3]" />
                    </span>
                )}
            </button>

            {/* Item Name */}
            <span className="w-full truncate text-[11px] leading-tight font-medium text-starlight-200">
                {name}
            </span>

            {/* Cart toggle action for unowned items */}
            {!isOwned && !isFree && onToggleCart && (
                <div className="w-full mt-1.5 pt-1 border-t border-border/40">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCart();
                        }}
                        className={cn(
                            "w-full rounded-md py-0.5 text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                            isInCart
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : "bg-space-800 text-gold-300 border border-gold-500/30 hover:bg-gold-500/20"
                        )}
                    >
                        {isInCart ? (
                            <>
                                <Check className="size-2.5" />
                                <span>In Cart</span>
                            </>
                        ) : (
                            <>
                                <Plus className="size-2.5" />
                                <span>Select</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
});

interface ItemSpecificColorSectionProps<T extends string = string> {
    itemId: string;
    itemLabel: string;
    currentColor: string;
    presets: readonly ColorOption<T>[];
    freeHexes: Set<string>;
    ownedColorsMap: Set<string>;
    customColors: string[];
    cartColors: Map<string, SelectedColorCartItem>;
    onSelectColor: (hex: string) => void;
    onToggleCartColor: (item: SelectedColorCartItem) => void;
    className?: string;
}

function ItemSpecificColorSection<T extends string = string>({
    itemId,
    itemLabel,
    currentColor,
    presets,
    freeHexes,
    ownedColorsMap,
    customColors,
    cartColors,
    onSelectColor,
    onToggleCartColor,
    className,
}: ItemSpecificColorSectionProps<T>) {
    const cleanCurrent = currentColor.toLowerCase();
    const isFree = freeHexes.has(cleanCurrent);
    const isOwned = isFree || ownedColorsMap.has(`${itemId}:${cleanCurrent}`);
    const cartKey = `${itemId}:${cleanCurrent}`;
    const isInCart = cartColors.has(cartKey);

    const activePreset = presets.find((p) => p.value.toLowerCase() === cleanCurrent);
    const colorLabel = activePreset?.label ?? `#${currentColor.toUpperCase()}`;
    const colorCost = isOwned ? 0 : activePreset ? 15 : CUSTOM_COLOR_PRICE;

    return (
        <div className={cn("rounded-xl border border-border/60 bg-space-950/40 p-4", className)}>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gold-400">
                        {itemLabel} Colors
                    </label>
                    <span className="text-[10px] text-starlight-400">
                        Colors are item-specific. 3–4 basic tones are free on each style.
                    </span>
                </div>

                {/* Selected Color Status Badge & Cart Action */}
                <div className="flex items-center gap-2">
                    {isOwned ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            <Check className="size-2.5" />
                            {isFree ? "Free Color" : "Owned Color"}
                        </span>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-gold-400">
                                {colorCost} ST
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    onToggleCartColor({
                                        itemId,
                                        itemLabel,
                                        colorHex: cleanCurrent,
                                        colorLabel,
                                        cost: colorCost,
                                        isCustom: !activePreset,
                                    })
                                }
                                className={cn(
                                    "rounded-lg px-2 py-1 text-[10px] font-bold transition-all shadow-xs",
                                    isInCart
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                        : "bg-gold-500 text-space-950 hover:brightness-110"
                                )}
                            >
                                {isInCart ? "In Cart (Remove)" : "Add Color to Cart"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Presets and Custom Picker */}
            <div className="flex flex-wrap items-center gap-2.5">
                {presets.map((color) => {
                    const hex = color.value.toLowerCase();
                    const itemIsFree = freeHexes.has(hex);
                    const itemIsOwned = itemIsFree || ownedColorsMap.has(`${itemId}:${hex}`);
                    const isSelected = cleanCurrent === hex;

                    return (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => onSelectColor(color.value)}
                            title={`${color.label} ${itemIsFree ? "(Free)" : itemIsOwned ? "(Owned)" : "(15 ST)"}`}
                            className={cn(
                                "group relative size-8 shrink-0 rounded-full border border-black/30 transition-transform duration-150 focus:outline-hidden",
                                isSelected
                                    ? "scale-115 ring-2 ring-gold-400 ring-offset-2 ring-offset-space-950 shadow-gold"
                                    : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color.hex }}
                        >
                            {isSelected && (
                                <Check className="mx-auto size-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                            )}
                            {!itemIsOwned && (
                                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-gold-400 ring-1 ring-space-950" />
                            )}
                        </button>
                    );
                })}

                {/* Previously purchased custom colors for this item */}
                {customColors.map((hex) => {
                    const isSelected = cleanCurrent === hex.toLowerCase();
                    return (
                        <button
                            key={`custom-${hex}`}
                            type="button"
                            onClick={() => onSelectColor(hex)}
                            title={`Custom Color #${hex.toUpperCase()} (Owned)`}
                            className={cn(
                                "group relative size-8 shrink-0 rounded-full border border-gold-400/60 transition-transform duration-150",
                                isSelected
                                    ? "scale-115 ring-2 ring-gold-400 ring-offset-2 ring-offset-space-950 shadow-gold"
                                    : "hover:scale-105"
                            )}
                            style={{ backgroundColor: `#${hex}` }}
                        >
                            {isSelected && (
                                <Check className="mx-auto size-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                            )}
                        </button>
                    );
                })}

                {/* Custom Color Picker Button */}
                <div className="relative group">
                    <div
                        className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer",
                            !activePreset
                                ? "border-gold-400 bg-gold-500/15 text-gold-300 ring-2 ring-gold-400/50 shadow-gold font-semibold"
                                : "border-border/60 bg-space-850/80 text-starlight-300 hover:border-gold-500/40 hover:text-starlight-100"
                        )}
                        title="Pick custom hex color (25 ST)"
                    >
                        <span
                            className="size-4 rounded-full border border-black/30 shrink-0 shadow-xs"
                            style={{ backgroundColor: `#${currentColor}` }}
                        />
                        <Palette className="size-3 text-gold-400" />
                        <span className="font-mono text-[11px]">
                            #{currentColor.toUpperCase()}
                        </span>
                        <input
                            type="color"
                            value={`#${currentColor}`}
                            onChange={(e) => {
                                const clean = normalizeHexColor(e.target.value);
                                if (clean) onSelectColor(clean);
                            }}
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                            aria-label={`Custom ${itemLabel} picker`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
