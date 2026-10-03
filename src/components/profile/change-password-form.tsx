// src/components/profile/change-password-form.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toast";
import { changePasswordAction } from "@/lib/actions/profile";
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    validatePasswordChange,
    type FieldErrors,
    type PasswordField,
} from "@/lib/profile/validation";

const FIELDS: {
    id: PasswordField;
    label: string;
    autoComplete: string;
}[] = [
    { id: "currentPassword", label: "Current password", autoComplete: "current-password" },
    { id: "newPassword", label: "New password", autoComplete: "new-password" },
    { id: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
];

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

// SuperAdmin / Instructor only (the Server Action enforces that too).
export function ChangePasswordForm() {
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState<FieldErrors<PasswordField>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function setValue(field: PasswordField, value: string) {
        setValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function focusFirstInvalid(next: FieldErrors<PasswordField>) {
        const first = FIELDS.find((f) => next[f.id]);
        if (first) document.getElementById(`pw-${first.id}`)?.focus();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return; // no duplicate submissions

        setFormError(null);

        const clientErrors = validatePasswordChange(values);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            focusFirstInvalid(clientErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        const result = await changePasswordAction(values);
        setIsSubmitting(false);

        if (result.success) {
            setValues(EMPTY);
            setVisible(false);
            showToast({
                type: "success",
                title: "Password updated",
                description: "Use your new password the next time you sign in.",
            });
            return;
        }

        // Recoverable error: keep what the user typed
        const fieldErrors = result.fieldErrors ?? {};
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
            focusFirstInvalid(fieldErrors);
        } else {
            setFormError(result.error);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {FIELDS.map((field) => {
                    const error = errors[field.id];
                    return (
                        <div
                            key={field.id}
                            className={
                                field.id === "currentPassword" ? "space-y-1.5 md:col-span-2" : "space-y-1.5"
                            }
                        >
                            <Label
                                htmlFor={`pw-${field.id}`}
                                className="text-xs font-semibold uppercase tracking-wider text-starlight-300"
                            >
                                {field.label}
                            </Label>
                            <Input
                                id={`pw-${field.id}`}
                                type={visible ? "text" : "password"}
                                value={values[field.id]}
                                onChange={(e) => setValue(field.id, e.target.value)}
                                autoComplete={field.autoComplete}
                                disabled={isSubmitting}
                                maxLength={PASSWORD_MAX_LENGTH + 20}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? `pw-${field.id}-error` : undefined}
                                className="h-10"
                            />
                            {error && (
                                <p id={`pw-${field.id}-error`} role="alert" className="text-xs text-red-400">
                                    {error}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-starlight-400">
                Use {PASSWORD_MIN_LENGTH}-{PASSWORD_MAX_LENGTH} characters. You&apos;ll stay signed in on this
                device after changing it.
            </p>

            {formError && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300"
                >
                    {formError}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gold-500 font-bold text-space-950 hover:bg-gold-400"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <KeyRound className="size-3.5" aria-hidden="true" />
                            Update password
                        </>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisible((v) => !v)}
                    aria-pressed={visible}
                    disabled={isSubmitting}
                >
                    {visible ? (
                        <EyeOff className="size-3.5" aria-hidden="true" />
                    ) : (
                        <Eye className="size-3.5" aria-hidden="true" />
                    )}
                    {visible ? "Hide passwords" : "Show passwords"}
                </Button>
            </div>
        </form>
    );
}
