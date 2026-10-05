// src/hooks/use-unsaved-changes.ts
"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to prevent accidental data loss when the user has unsaved changes.
 * Guards against:
 * 1. Page reload / refresh (F5, Ctrl+R)
 * 2. Tab or window close
 * 3. Browser Back / Forward buttons (popstate)
 * 4. Internal application link clicks (<a> and Next.js <Link>)
 *
 * @param isDirty boolean indicating whether form has unsaved modifications
 * @param message optional prompt warning message
 */
export function useUnsavedChanges(
    isDirty: boolean,
    message: string = "You have unsaved changes. Are you sure you want to leave this page?"
) {
    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    // 1. Browser Tab Close & Refresh Guard
    useEffect(() => {
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirtyRef.current) {
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [message]);

    // 2. Browser Back / Forward Navigation Guard
    useEffect(() => {
        if (!isDirty) return;

        // Push state so back button triggers popstate before actually navigating away
        window.history.pushState(null, "", window.location.href);

        function handlePopState(e: PopStateEvent) {
            if (isDirtyRef.current) {
                const confirmed = window.confirm(message);
                if (!confirmed) {
                    // Restore url and prevent navigation
                    window.history.pushState(null, "", window.location.href);
                }
            }
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isDirty, message]);

    // 3. In-App Navigation (Link Clicks) Guard
    useEffect(() => {
        function handleDocumentClick(e: MouseEvent) {
            if (!isDirtyRef.current) return;

            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            // Ignore anchors with no href, hash anchors, mailto, tel, or target="_blank"
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || anchor.target === "_blank") {
                return;
            }

            // If navigating to different URL, prompt user
            const confirmed = window.confirm(message);
            if (!confirmed) {
                e.preventDefault();
                e.stopPropagation();
            }
        }

        document.addEventListener("click", handleDocumentClick, true);
        return () => document.removeEventListener("click", handleDocumentClick, true);
    }, [message]);
}
