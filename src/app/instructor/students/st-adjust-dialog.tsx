// src/app/instructor/students/st-adjust-dialog.tsx
// Two-step dialog: form -> review & confirm. Mounted with key={student.id},
// so each open gets fresh state and a fresh requestId (idempotency key).
"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Minus, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import { adjustStudentSTAction } from "@/lib/actions/instructor-st";
import {
    ST_ADJUST_MAX_AMOUNT,
    ST_ADJUST_MAX_NOTE_LENGTH,
} from "@/lib/st-economy/instructor-adjustment-limits";
import type { STAdjustStudent } from "@/lib/data/get-instructor-students";

type Direction = "ADD" | "DEDUCT";

export function StAdjustDialog({
    student,
    onClose,
    onSuccess,
}: {
    student: STAdjustStudent;
    onClose: () => void;
    onSuccess: (studentId: string, balance: number) => void;
}) {
    const [requestId] = useState(() => crypto.randomUUID());
    const [step, setStep] = useState<"form" | "review">("form");
    const [direction, setDirection] = useState<Direction>("ADD");
    const [amountText, setAmountText] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const amount = /^\d+$/.test(amountText) ? Number(amountText) : NaN;
    const amountValid = Number.isInteger(amount) && amount >= 1 && amount <= ST_ADJUST_MAX_AMOUNT;
    const isAdd = direction === "ADD";
    const balanceAfter = amountValid ? student.balance + (isAdd ? amount : -amount) : student.balance;

    function handleReview() {
        if (!amountValid) {
            setError(`Enter a whole number between 1 and ${ST_ADJUST_MAX_AMOUNT}.`);
            return;
        }
        setError(null);
        setStep("review");
    }

    function handleConfirm() {
        setError(null);

        startTransition(async () => {
            try {
                const result = await adjustStudentSTAction({
                    studentId: student.id,
                    direction,
                    amount,
                    note,
                    requestId,
                });

                if (!result.success) {
                    setError(result.error);
                    return;
                }

                showToast({
                    type: "success",
                    title: isAdd ? "ST added" : "ST deducted",
                    description: `${student.name} is now at ${result.data.balance} ST.`,
                });
                onSuccess(student.id, result.data.balance);
                onClose();
            } catch {
                setError("Something went wrong. Please try again.");
            }
        });
    }

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
        >
            <DialogContent className="border border-border/80 bg-space-900 text-starlight-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold">
                        {step === "form" ? "Adjust ST" : "Review adjustment"}
                    </DialogTitle>
                    <DialogDescription className="text-starlight-300">
                        {student.name} · current balance{" "}
                        <span className="font-mono font-bold text-gold-300">{student.balance} ST</span>
                    </DialogDescription>
                </DialogHeader>

                {step === "form" ? (
                    <div className="space-y-4">
                        {/* Direction: icon + text label, not color alone */}
                        <div role="radiogroup" aria-label="Operation" className="grid grid-cols-2 gap-2">
                            {(
                                [
                                    { value: "ADD", label: "Add ST", Icon: Plus, active: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" },
                                    { value: "DEDUCT", label: "Deduct ST", Icon: Minus, active: "border-rose-500/50 bg-rose-500/15 text-rose-300" },
                                ] as const
                            ).map(({ value, label, Icon, active }) => {
                                const selected = direction === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setDirection(value)}
                                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                                            selected
                                                ? `${active} ring-1 ring-current`
                                                : "border-border/80 bg-space-850/50 text-starlight-300 hover:bg-space-850"
                                        }`}
                                    >
                                        <Icon className="size-4" aria-hidden />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="st-amount" className="text-xs font-semibold text-starlight-300">
                                Amount (ST)
                            </label>
                            <Input
                                id="st-amount"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder={`1 – ${ST_ADJUST_MAX_AMOUNT}`}
                                value={amountText}
                                onChange={(e) => setAmountText(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                aria-invalid={amountText.length > 0 && !amountValid}
                                className="h-10 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="st-note" className="text-xs font-semibold text-starlight-300">
                                Reason <span className="font-normal text-starlight-400">(optional)</span>
                            </label>
                            <Textarea
                                id="st-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value.slice(0, ST_ADJUST_MAX_NOTE_LENGTH))}
                                placeholder="Visible to the student in their ST Transactions"
                                className="min-h-20"
                            />
                            <p className="text-right text-[10px] text-starlight-400">
                                {note.length}/{ST_ADJUST_MAX_NOTE_LENGTH}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 rounded-xl border border-border/80 bg-space-850/50 p-4 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                            {isAdd ? (
                                <Plus className="size-4 text-emerald-400" aria-hidden />
                            ) : (
                                <Minus className="size-4 text-rose-400" aria-hidden />
                            )}
                            <span>
                                {isAdd ? "Add" : "Deduct"}{" "}
                                <span className="font-mono">{amount} ST</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-base font-bold">
                            <span className="text-starlight-300">{student.balance}</span>
                            <ArrowRight className="size-4 text-starlight-400" aria-hidden />
                            <span className="text-gold-300">{balanceAfter}</span>
                            <span className="text-[10px] font-semibold text-starlight-400">ST</span>
                        </div>

                        {note.trim() && (
                            <p className="break-words text-xs text-starlight-300">
                                Reason: <span className="text-starlight-100">{note.trim()}</span>
                            </p>
                        )}

                        <p className="text-[11px] text-starlight-400">
                            The student will see this in their ST Transactions as coming from an Instructor.
                        </p>
                    </div>
                )}

                {error && (
                    <p role="alert" className="text-xs text-rose-400">
                        {error}
                    </p>
                )}

                <DialogFooter className="gap-2 sm:gap-2">
                    {step === "form" ? (
                        <>
                            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleReview}
                                className="rounded-lg bg-gold-500 font-bold text-space-950 hover:bg-gold-400"
                            >
                                Review
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => {
                                    setError(null);
                                    setStep("form");
                                }}
                                className="rounded-lg"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                disabled={isPending}
                                onClick={handleConfirm}
                                className="rounded-lg bg-gold-500 font-bold text-space-950 hover:bg-gold-400"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    `Confirm ${isAdd ? "add" : "deduction"}`
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
