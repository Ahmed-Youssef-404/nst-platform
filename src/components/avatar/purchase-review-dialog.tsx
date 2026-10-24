// src/components/avatar/purchase-review-dialog.tsx
"use client";

import * as React from "react";
import {
    Coins,
    ShoppingBag,
    Trash2,
    Loader2,
    AlertCircle,
    Sparkles,
    X,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCatalogItemById, type CatalogItem } from "@/lib/avatar/catalog";
import { getItemThumbnail } from "@/lib/avatar/thumbnails";

export interface SelectedColorCartItem {
    itemId: string;
    itemLabel: string;
    colorHex: string;
    colorLabel: string;
    cost: number;
    isCustom?: boolean;
}

export interface PurchaseReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedItems: CatalogItem[];
    selectedColors: SelectedColorCartItem[];
    onRemoveItem: (itemId: string) => void;
    onRemoveColor: (itemId: string, colorHex: string) => void;
    spendableBalance: number;
    onConfirmPurchase: () => Promise<void>;
    isPurchasing: boolean;
    purchaseSuccess?: boolean;
}

export function PurchaseReviewDialog({
    open,
    onOpenChange,
    selectedItems,
    selectedColors,
    onRemoveItem,
    onRemoveColor,
    spendableBalance,
    onConfirmPurchase,
    isPurchasing,
}: PurchaseReviewDialogProps) {
    const totalItemsCount = selectedItems.length + selectedColors.length;

    const totalCost = React.useMemo(() => {
        const itemsCost = selectedItems.reduce((sum, item) => sum + item.cost, 0);
        const colorsCost = selectedColors.reduce((sum, c) => sum + c.cost, 0);
        return itemsCost + colorsCost;
    }, [selectedItems, selectedColors]);

    const remainingBalance = spendableBalance - totalCost;
    const isInsufficient = remainingBalance < 0;
    const shortfall = Math.abs(remainingBalance);

    // Guard against outside clicks and mobile back dismissals.
    // Only explicit intentional actions (close button, Cancel, or successful checkout) close the panel.
    const handleOpenChange = React.useCallback(
        (nextOpen: boolean, eventDetails?: { reason?: string }) => {
            if (!nextOpen) {
                const reason = eventDetails?.reason;
                if (
                    reason === "outside-press" ||
                    reason === "close-watcher" ||
                    reason === "escape-key"
                ) {
                    return;
                }
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange]
    );

    // Mobile Back navigation protection:
    // When the review panel is open, push a history entry so mobile Back does not navigate away from the editor
    // or dismiss the panel. The student remains in the avatar editor with the review panel intact.
    React.useEffect(() => {
        if (!open) return;

        const currentState = window.history.state;
        window.history.pushState({ ...currentState, nstDialog: "purchase-review" }, "");

        let isExplicitClose = false;

        const handlePopState = () => {
            if (!isExplicitClose) {
                // User pressed mobile back while review dialog is open; re-push to preserve dialog & editor state
                window.history.pushState({ ...currentState, nstDialog: "purchase-review" }, "");
            }
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            isExplicitClose = true;
            window.removeEventListener("popstate", handlePopState);
            if (window.history.state?.nstDialog === "purchase-review") {
                window.history.back();
            }
        };
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="border border-gold-500/30 bg-space-900/98 backdrop-blur-xl text-starlight-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
                <AlertDialogHeader className="border-b border-border/60 pb-3 shrink-0 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30">
                                <ShoppingBag className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <AlertDialogTitle className="font-display text-base font-bold text-starlight-100 truncate">
                                    Review Avatar Purchase
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-starlight-400 truncate">
                                    {totalItemsCount} {totalItemsCount === 1 ? "product" : "products"} selected for bulk checkout
                                </AlertDialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Current spendable balance badge */}
                            <div className="flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-space-850 px-2.5 py-1 shadow-xs">
                                <Coins className="size-3.5 text-gold-400" />
                                <span className="font-mono text-xs font-bold text-gold-300">
                                    {spendableBalance} ST
                                </span>
                            </div>

                            {/* Explicit intentional Close button */}
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={isPurchasing}
                                title="Close review"
                                className="rounded-lg p-1.5 text-starlight-400 hover:bg-space-850 hover:text-starlight-100 transition-colors disabled:opacity-50"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </AlertDialogHeader>

                {/* Items List (scrollable) */}
                <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 max-h-[45vh] custom-scrollbar">
                    {totalItemsCount === 0 ? (
                        <div className="py-8 text-center text-xs text-starlight-400">
                            Your purchase selection is empty. Explore the catalog and select styles or colors!
                        </div>
                    ) : (
                        <>
                            {/* Selected Items */}
                            {selectedItems.map((item) => {
                                const thumbnailUri = getItemThumbnail(item.slot, item.value);

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-space-850/60 p-2.5 transition-colors hover:border-gold-500/30 hover:bg-space-850"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Accurate Item Visual Thumbnail */}
                                            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-space-950 border border-border/50 p-1">
                                                {thumbnailUri ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={thumbnailUri}
                                                        alt={item.name}
                                                        className="size-full select-none object-contain"
                                                    />
                                                ) : (
                                                    <Sparkles className="size-4 text-gold-400" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="truncate text-xs font-semibold text-starlight-100">
                                                        {item.name}
                                                    </span>
                                                    {/* <span
                                                        className={cn(
                                                            "rounded-xs px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                                            item.rarity === "EPIC"
                                                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                                : item.rarity === "RARE"
                                                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                                : "bg-starlight-500/10 text-starlight-300 border border-starlight-500/20"
                                                        )}
                                                    >
                                                        {item.rarity}
                                                    </span> */}
                                                </div>
                                                <span className="block text-[10px] text-starlight-400 capitalize truncate">
                                                    {item.slot} item
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-mono text-xs font-bold text-gold-300">
                                                    {item.cost}
                                                </span>
                                                <span className="text-[10px] text-gold-500 font-semibold uppercase">
                                                    ST
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveItem(item.id)}
                                                disabled={isPurchasing}
                                                title="Remove item"
                                                className="rounded-lg p-1.5 text-starlight-400 hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Selected Paid Colors */}
                            {selectedColors.map((color) => {
                                const associatedItem = getCatalogItemById(color.itemId);
                                const colorThumbnailUri = associatedItem
                                    ? getItemThumbnail(
                                        associatedItem.slot,
                                        associatedItem.value,
                                        color.colorHex
                                    )
                                    : "";

                                return (
                                    <div
                                        key={`${color.itemId}:${color.colorHex}`}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-space-850/60 p-2.5 transition-colors hover:border-gold-500/30 hover:bg-space-850"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Item Thumbnail with exact Color Swatch Badge */}
                                            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-space-950 border border-border/50 p-1">
                                                {colorThumbnailUri ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={colorThumbnailUri}
                                                        alt={color.itemLabel}
                                                        className="size-full select-none object-contain"
                                                    />
                                                ) : null}
                                                <span
                                                    className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-space-900 shadow-md ring-1 ring-black/40 shrink-0"
                                                    style={{ backgroundColor: `#${color.colorHex}` }}
                                                    title={`#${color.colorHex.toUpperCase()}`}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="truncate text-xs font-semibold text-starlight-100">
                                                        {color.colorLabel}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "rounded-xs px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                                            color.isCustom
                                                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                                                : "bg-gold-500/20 text-gold-300 border border-gold-500/30"
                                                        )}
                                                    >
                                                        {color.isCustom ? "Custom Color" : "Color"}
                                                    </span>
                                                </div>
                                                <span className="block text-[10px] text-starlight-400 truncate">
                                                    For {associatedItem?.name ?? color.itemLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-mono text-xs font-bold text-gold-300">
                                                    {color.cost}
                                                </span>
                                                <span className="text-[10px] text-gold-500 font-semibold uppercase">
                                                    ST
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveColor(color.itemId, color.colorHex)}
                                                disabled={isPurchasing}
                                                title="Remove color"
                                                className="rounded-lg p-1.5 text-starlight-400 hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Balance & Totals Summary Panel */}
                <div className="border-t border-border/60 pt-3 space-y-2 shrink-0 bg-space-950/60 -mx-4 -mb-4 p-4 rounded-b-xl">
                    <div className="flex items-center justify-between text-xs text-starlight-300">
                        <span>Current Spendable ST</span>
                        <span className="font-mono font-medium">{spendableBalance} ST</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-starlight-100">
                        <span>Total Purchase Cost</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono text-sm text-gold-400">{totalCost}</span>
                            <span className="text-[10px] text-gold-500 font-semibold uppercase">ST</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                        <span>Balance Remaining</span>
                        <span
                            className={cn(
                                "font-mono font-bold",
                                isInsufficient ? "text-red-400" : "text-emerald-400"
                            )}
                        >
                            {remainingBalance} ST
                        </span>
                    </div>

                    {isInsufficient && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/15 border border-red-500/30 p-2 text-xs text-red-300">
                            <AlertCircle className="size-4 shrink-0 text-red-400" />
                            <span>
                                Insufficient balance. You need {shortfall} more ST to complete this purchase.
                            </span>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-3 flex flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isPurchasing}
                            className="rounded-xl border border-border/60 text-xs text-starlight-300 hover:bg-space-850"
                        >
                            Keep Customizing
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirmPurchase}
                            disabled={isPurchasing || totalItemsCount === 0 || isInsufficient}
                            className={cn(
                                "rounded-xl font-bold text-xs shadow-gold transition-all duration-200 flex-1 sm:flex-none",
                                isInsufficient || totalItemsCount === 0
                                    ? "bg-space-800 text-starlight-500 border border-border/40 cursor-not-allowed"
                                    : "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-space-950 hover:brightness-110 active:scale-[0.98]"
                            )}
                        >
                            {isPurchasing ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                    <span>Processing Transaction...</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="size-3.5 mr-1.5" />
                                    <span>Confirm Purchase ({totalCost} ST)</span>
                                </>
                            )}
                        </Button>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

