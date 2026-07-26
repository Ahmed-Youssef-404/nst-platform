// src/components/login-dialog.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LoginFormFields } from "@/components/login-form-fields";

interface LoginDialogProps {
    /** The element that opens the dialog — a Button, typically. */
    children: React.ReactNode;
}

/**
 * Wraps the shared login form in a Dialog. Used across the landing page
 * (navbar "Get Started", hero "Join Us") so every entry point opens the
 * same in-place login experience instead of navigating away.
 */
export function LoginDialog({ children }: LoginDialogProps) {
    return (
        <Dialog>
            <DialogTrigger render={children as React.ReactElement} />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-lg">Log in to NST Platform</DialogTitle>
                    <DialogDescription>
                        Staff and students use different credentials — pick your tab below.
                    </DialogDescription>
                </DialogHeader>
                <LoginFormFields />
            </DialogContent>
        </Dialog>
    );
}