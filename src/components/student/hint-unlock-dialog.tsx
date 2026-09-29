"use client";

import * as React from "react";
import { KeyRound, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { unlockHintAction } from "@/lib/actions/st-economy";

export interface HintToUnlock {
    id: string;
    order: number;
    cost: number;
}

export function HintUnlockDialog({
    isOpen,
    onClose,
    hint,
    studentId,
    currentBalance,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    hint: HintToUnlock | null;
    studentId: string;
    currentBalance?: number;
    onSuccess?: () => void;
}) {
    const [isUnlocking, setIsUnlocking] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsUnlocking(false);
        }
    }, [isOpen]);

    if (!hint) return null;

    const remainingBalance =
        typeof currentBalance === "number" ? currentBalance - hint.cost : undefined;

    async function handleConfirm() {
        if (!hint) return;
        setIsUnlocking(true);
        setError(null);

        try {
            const res = await unlockHintAction({
                studentId,
                hintId: hint.id,
            });

            if (!res.success) {
                setError(res.error ?? "Failed to unlock hint.");
                setIsUnlocking(false);
                return;
            }

            showToast({
                title: `Hint #${hint.order} Unlocked`,
                description: `${hint.cost} ST deducted. Tactical intelligence is now revealed.`,
                type: "success",
            });

            onClose();
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unlock failed.");
            setIsUnlocking(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isUnlocking && onClose()}>
            <DialogContent className="border border-border/80 bg-card dark:bg-space-950 sm:max-w-md text-foreground dark:text-starlight-100 shadow-xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
                            <KeyRound className="size-4" />
                        </div>
                        <span>Unlock Tactical Hint #{hint.order}?</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground dark:text-starlight-300 mt-2">
                        Unlocking this hint will permanently deduct{" "}
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                            {hint.cost} ST
                        </span>{" "}
                        from your Star Token balance.
                    </DialogDescription>
                </DialogHeader>

                {/* Ledger Breakdown Card */}
                <div className="rounded-xl border border-border/70 bg-muted/40 dark:bg-space-900/60 p-3.5 text-xs space-y-2 font-mono">
                    {typeof currentBalance === "number" && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground dark:text-starlight-400">
                                Current ST Balance:
                            </span>
                            <span className="text-foreground dark:text-starlight-200 font-bold">
                                {currentBalance} ST
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground dark:text-starlight-400">
                            Hint Unlock Cost:
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-bold">
                            -{hint.cost} ST
                        </span>
                    </div>
                    {typeof remainingBalance === "number" && (
                        <div className="flex justify-between items-center border-t border-border/60 pt-2 font-bold">
                            <span className="text-foreground dark:text-starlight-300">
                                Projected Balance:
                            </span>
                            <span
                                className={
                                    remainingBalance < 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-gold-600 dark:text-gold-300"
                                }
                            >
                                {remainingBalance} ST
                            </span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                        <AlertCircle className="size-4 shrink-0 text-red-500 dark:text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUnlocking}
                        onClick={onClose}
                        className="rounded-xl border-border bg-muted/40 hover:bg-muted text-foreground dark:text-starlight-300 text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={isUnlocking}
                        onClick={handleConfirm}
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-space-950 font-bold text-xs shadow-xs"
                    >
                        {isUnlocking ? (
                            <>
                                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                Unlocking...
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-3.5 mr-1.5" />
                                Confirm & Deduct {hint.cost} ST
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
