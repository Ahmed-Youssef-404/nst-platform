// src/components/avatar/unsaved-changes-dialog.tsx
"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface UnsavedChangesDialogProps {
    open: boolean;
    onStay: () => void;
    onConfirmLeave: () => void;
}

export function UnsavedChangesDialog({
    open,
    onStay,
    onConfirmLeave,
}: UnsavedChangesDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
            <AlertDialogContent className="border border-gold-500/30 bg-space-900/98 backdrop-blur-xl text-starlight-100 shadow-2xl max-w-md">
                <AlertDialogHeader className="space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                        <AlertTriangle className="size-6" />
                    </div>
                    <AlertDialogTitle className="text-center font-display text-lg font-bold text-starlight-100">
                        You have unsaved changes
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-xs text-starlight-300 leading-relaxed">
                        You have unsaved changes on your Avatar. If you leave, your Avatar will reset to the latest saved change, and any changes will not be saved.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onConfirmLeave}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 text-xs font-semibold"
                    >
                        Exit without saving
                    </Button>
                    <Button
                        type="button"
                        onClick={onStay}
                        className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-space-950 hover:brightness-110 font-bold text-xs shadow-gold"
                    >
                        Back to editor
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
