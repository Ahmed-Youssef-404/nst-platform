// src/components/avatar/purchase-review-dialog.tsx
"use client";

import * as React from "react";
import {
    Coins,
    ShoppingBag,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Sparkles,
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
import type { CatalogItem } from "@/lib/avatar/catalog";

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
    purchaseSuccess,
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

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="border border-gold-500/30 bg-space-900/98 backdrop-blur-xl text-starlight-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
                <AlertDialogHeader className="border-b border-border/60 pb-3 shrink-0 text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30">
                                <ShoppingBag className="size-4" />
                            </div>
                            <div>
                                <AlertDialogTitle className="font-display text-base font-bold text-starlight-100">
                                    Review Avatar Purchase
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-starlight-400">
                                    {totalItemsCount} {totalItemsCount === 1 ? "product" : "products"} selected for bulk checkout
                                </AlertDialogDescription>
                            </div>
                        </div>

                        {/* Current spendable balance badge */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-space-850 px-2.5 py-1 shadow-xs">
                            <Coins className="size-3.5 text-gold-400" />
                            <span className="font-mono text-xs font-bold text-gold-300">
                                {spendableBalance} ST
                            </span>
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
                            {selectedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-space-850/60 p-2.5 transition-colors hover:border-gold-500/30 hover:bg-space-850"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-space-950 border border-border/40 text-gold-400 font-bold text-xs">
                                            <Sparkles className="size-4 text-gold-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate text-xs font-semibold text-starlight-100">
                                                    {item.name}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "rounded-sm px-1.5 py-0.2 text-[9px] font-bold uppercase",
                                                        item.rarity === "EPIC"
                                                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                            : item.rarity === "RARE"
                                                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                            : "bg-starlight-500/10 text-starlight-300 border border-starlight-500/20"
                                                    )}
                                                >
                                                    {item.rarity}
                                                </span>
                                            </div>
                                            <span className="block text-[10px] text-starlight-400 capitalize">
                                                {item.slot} item
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
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
                                            title="Remove item"
                                            className="rounded-lg p-1 text-starlight-400 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Selected Colors */}
                            {selectedColors.map((color) => (
                                <div
                                    key={`${color.itemId}:${color.colorHex}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-space-850/60 p-2.5 transition-colors hover:border-gold-500/30 hover:bg-space-850"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className="size-8 shrink-0 rounded-full border border-black/40 shadow-xs"
                                            style={{ backgroundColor: `#${color.colorHex}` }}
                                        />
                                        <div className="min-w-0">
                                            <span className="truncate text-xs font-semibold text-starlight-100 block">
                                                {color.colorLabel}
                                                {color.isCustom ? " (Custom Color)" : ""}
                                            </span>
                                            <span className="block text-[10px] text-starlight-400 truncate">
                                                For {color.itemLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
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
                                            title="Remove color"
                                            className="rounded-lg p-1 text-starlight-400 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                            <span className="text-[10px] text-gold-500">ST</span>
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
