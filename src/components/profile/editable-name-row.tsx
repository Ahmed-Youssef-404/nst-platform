// src/components/profile/editable-name-row.tsx
"use client";

import { useRef, useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { InfoRow } from "@/components/profile/info-row";
import { updateProfileNameAction } from "@/lib/actions/profile";
import { NAME_MAX_LENGTH, validateName } from "@/lib/profile/validation";

// SuperAdmin / Instructor only (the Server Action enforces that too).
// View mode shows the saved name + an Edit button; edit mode swaps in an
// inline form. The saved value always comes from the server via `name`
// (the action revalidates the layout), never from local state.
export function EditableNameRow({ name }: { name: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(name);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function startEditing() {
        setDraft(name);
        setError(null);
        setIsEditing(true);
        // Wait for the input to mount, then focus it
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function cancelEditing() {
        if (isSaving) return;
        setIsEditing(false);
        setError(null);
        setDraft(name);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSaving) return; // no duplicate submissions

        const clientError = validateName(draft);
        if (clientError) {
            setError(clientError);
            inputRef.current?.focus();
            return;
        }

        setError(null);
        setIsSaving(true);
        const result = await updateProfileNameAction({ name: draft });
        setIsSaving(false);

        if (result.success) {
            setIsEditing(false);
            showToast({ type: "success", title: "Profile updated", description: "Your name was saved." });
            return;
        }

        // Recoverable error: keep the typed value so nothing is lost
        setError(result.fieldErrors?.name ?? result.error);
        inputRef.current?.focus();
    }

    if (!isEditing) {
        return (
            <InfoRow
                label="Full name"
                action={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startEditing}
                        aria-label="Edit full name"
                        className="shrink-0 border-gold-500/30 text-gold-700 hover:text-gold-600 dark:text-gold-300"
                    >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                    </Button>
                }
            >
                {name}
            </InfoRow>
        );
    }

    return (
        <InfoRow label="Full name">
            <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div className="space-y-1.5">
                    <label htmlFor="profile-name" className="sr-only">
                        Full name
                    </label>
                    <Input
                        id="profile-name"
                        ref={inputRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEditing();
                        }}
                        maxLength={NAME_MAX_LENGTH + 20}
                        autoComplete="name"
                        disabled={isSaving}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? "profile-name-error" : undefined}
                        className="h-10"
                    />
                    {error && (
                        <p id="profile-name-error" role="alert" className="text-xs text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isSaving}
                        className="bg-gold-500 font-bold text-space-950 hover:bg-gold-400"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="size-3.5" aria-hidden="true" />
                                Save
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isSaving}
                    >
                        <X className="size-3.5" aria-hidden="true" />
                        Cancel
                    </Button>
                </div>
            </form>
        </InfoRow>
    );
}
