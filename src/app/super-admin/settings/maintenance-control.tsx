// src/app/super-admin/settings/maintenance-control.tsx
"use client";

import { useId, useState, useTransition } from "react";
import { CircleCheck, Loader2, TriangleAlert, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showToast } from "@/components/ui/toast";
import { setMaintenanceModeAction } from "@/lib/actions/platform-settings";
import { MAINTENANCE_MESSAGE_MAX } from "@/lib/maintenance-constants";

interface Props {
    initialEnabled: boolean;
    initialMessage: string;
    /** The setting couldn't be read on the server - don't show a confident state. */
    statusUnknown: boolean;
}

export function MaintenanceControl({ initialEnabled, initialMessage, statusUnknown }: Props) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [savedMessage, setSavedMessage] = useState(initialMessage);
    const [message, setMessage] = useState(initialMessage);
    const [pendingTarget, setPendingTarget] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const switchId = useId();
    const messageId = useId();
    const hintId = useId();

    const messageDirty = message.trim() !== savedMessage.trim();

    function save(nextEnabled: boolean, successTitle: string) {
        setError(null);
        startTransition(async () => {
            const result = await setMaintenanceModeAction({ enabled: nextEnabled, message });
            if (!result.success) {
                setError(result.error);
                showToast({ type: "error", title: "Couldn\u2019t save", description: result.error });
                return;
            }
            setEnabled(result.enabled);
            setSavedMessage(result.message ?? "");
            setMessage(result.message ?? "");
            showToast({ type: "success", title: successTitle });
        });
    }

    function confirmToggle() {
        const target = pendingTarget;
        setPendingTarget(null);
        if (target === null) return;
        save(target, target ? "Maintenance mode enabled" : "Platform is back online");
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading text-lg">Platform Availability</CardTitle>
                <CardDescription>
                    Maintenance mode replaces the student interface with a maintenance page. Super Admins
                    and Instructors are not affected. It changes what students see only &mdash; it does
                    not shut down the backend.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
                {/* Status - icon + text + border, never colour alone */}
                <div aria-live="polite" className="contents">
                    {statusUnknown && !isPending ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
                            <TriangleAlert className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-semibold">Current state could not be read</p>
                                <p className="text-xs text-muted-foreground">
                                    Students currently see the maintenance page as a precaution. Check the
                                    database connection and that the latest migration has been applied.
                                </p>
                            </div>
                        </div>
                    ) : enabled ? (
                        <div className="flex items-center gap-3 rounded-xl border-2 border-gold-500/60 bg-gold-500/10 px-4 py-3">
                            <Wrench className="size-5 shrink-0 text-gold-500" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-bold">Maintenance Mode Active</p>
                                <p className="text-xs text-muted-foreground">
                                    Students see the maintenance page instead of the platform.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-success-500/50 bg-success-500/10 px-4 py-3">
                            <CircleCheck className="size-5 shrink-0 text-success-400" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-bold">Platform Online</p>
                                <p className="text-xs text-muted-foreground">
                                    Students have normal access.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Label htmlFor={switchId} className="text-sm font-semibold">
                            Maintenance mode
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {enabled ? "On \u2014 students are seeing the maintenance page." : "Off \u2014 students can use the platform."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPending && (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" />
                        )}
                        <Switch
                            id={switchId}
                            checked={enabled}
                            disabled={isPending}
                            onCheckedChange={(checked) => setPendingTarget(checked)}
                        />
                    </div>
                </div>

                {/* Optional message */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor={messageId} className="text-sm font-semibold">
                        Message for students <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                        id={messageId}
                        value={message}
                        maxLength={MAINTENANCE_MESSAGE_MAX}
                        rows={3}
                        disabled={isPending}
                        aria-describedby={hintId}
                        placeholder="e.g. We're upgrading the ranking system. Thanks for your patience."
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <div id={hintId} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Shown on the maintenance page. Plain text only.</span>
                        <span>
                            {message.length}/{MAINTENANCE_MESSAGE_MAX}
                        </span>
                    </div>
                    {enabled && messageDirty && (
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => save(true, "Message updated")}
                            >
                                Update message
                            </Button>
                        </div>
                    )}
                </div>

                {error && (
                    <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {error}
                    </p>
                )}
            </CardContent>

            <AlertDialog
                open={pendingTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingTarget ? "Enable maintenance mode?" : "Bring the platform back online?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingTarget
                                ? "Every student will see the maintenance page instead of the platform, on every student route, as soon as they load or refresh a page. Super Admin and Instructor access is unchanged. Background services keep running."
                                : "Students will be able to use their normal dashboard again on their next page load."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmToggle}>
                            {pendingTarget ? "Enable maintenance" : "Go online"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
