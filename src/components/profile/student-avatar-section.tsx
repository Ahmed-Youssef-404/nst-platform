// src/components/profile/student-avatar-section.tsx
"use client";

import * as React from "react";
import type { StudentAvatarConfig } from "@/types/avatar";
import { AvatarEditor } from "@/components/avatar/avatar-editor";

export function StudentAvatarSection({
    initialConfig,
    studentName,
    isEditing = false,
    onCancel,
    onSaveSuccess,
}: {
    initialConfig: StudentAvatarConfig | null;
    studentName: string;
    isEditing?: boolean;
    onCancel?: () => void;
    onSaveSuccess?: (newConfig: StudentAvatarConfig) => void;
}) {
    if (!isEditing) return null;

    return (
        <div className="animate-fade-in">
            <AvatarEditor
                initialConfig={initialConfig}
                studentName={studentName}
                onSaveSuccess={onSaveSuccess}
                onCancel={onCancel}
            />
        </div>
    );
}
