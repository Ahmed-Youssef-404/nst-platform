// src/lib/avatar/avatar-preview-store.ts
"use client";

import * as React from "react";
import type { StudentAvatarConfig } from "@/types/avatar";

export interface AvatarPreviewData {
    name?: string;
    avatarConfig?: StudentAvatarConfig | null;
    src?: string;
    fallbackInitials?: string;
}

export interface AvatarPreviewState extends AvatarPreviewData {
    isOpen: boolean;
}

const DEFAULT_STATE: AvatarPreviewState = {
    isOpen: false,
    name: undefined,
    avatarConfig: null,
    src: undefined,
    fallbackInitials: undefined,
};

let currentState: AvatarPreviewState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach((listener) => {
        try {
            listener();
        } catch (err) {
            console.error("Avatar preview listener error:", err);
        }
    });
}

/**
 * Global function to open the student avatar preview modal with given data.
 * Can be called from any component or utility without prop drilling.
 */
export function openAvatarPreview(data: AvatarPreviewData) {
    currentState = {
        isOpen: true,
        name: data.name,
        avatarConfig: data.avatarConfig ?? null,
        src: data.src,
        fallbackInitials: data.fallbackInitials,
    };
    notify();
}

/**
 * Global function to close the student avatar preview modal.
 */
export function closeAvatarPreview() {
    if (!currentState.isOpen) return;
    currentState = {
        ...currentState,
        isOpen: false,
    };
    notify();
}

/**
 * Returns current snapshot of avatar preview state for useSyncExternalStore.
 */
export function getAvatarPreviewSnapshot(): AvatarPreviewState {
    return currentState;
}

/**
 * Hook to subscribe to the global avatar preview state.
 */
export function useAvatarPreview() {
    const state = React.useSyncExternalStore(
        (callback) => {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
        getAvatarPreviewSnapshot,
        () => DEFAULT_STATE
    );

    return {
        ...state,
        open: openAvatarPreview,
        close: closeAvatarPreview,
    };
}

