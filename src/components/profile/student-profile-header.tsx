// src/components/profile/student-profile-header.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Hash, Mail } from "lucide-react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { AvatarEditor } from "@/components/avatar/avatar-editor";
import type { StudentAvatarConfig } from "@/types/avatar";

export interface StudentProfileHeaderProps {
    name: string;
    studentCode: string;
    email: string;
    initialAvatarConfig?: StudentAvatarConfig | null;
}

export function StudentProfileHeader({
    name,
    studentCode,
    email,
    initialAvatarConfig,
}: StudentProfileHeaderProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = React.useState(false);
    const [currentConfig, setCurrentConfig] = React.useState<StudentAvatarConfig | null>(
        initialAvatarConfig ?? null
    );
    const editorRef = React.useRef<HTMLDivElement>(null);

    const handleToggleEdit = () => {
        setIsEditing((prev) => {
            const next = !prev;
            if (next) {
                setTimeout(() => {
                    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            }
            return next;
        });
    };

    const handleSaveSuccess = (savedConfig: StudentAvatarConfig) => {
        setCurrentConfig(savedConfig);
        router.refresh();
    };

    return (
        <div className="space-y-6">
            <ProfileHeader
                name={name}
                roleLabel="Student Details"
                roleIcon={Sparkles}
                description=""
                initialsFallback="ST"
                chips={[
                    { icon: Hash, label: "Student code", value: studentCode, mono: true },
                    { icon: Mail, label: "Email", value: email },
                ]}
                avatarConfig={currentConfig}
                onEditAvatar={handleToggleEdit}
            />

            {isEditing && (
                <div ref={editorRef} className="animate-fade-in">
                    <AvatarEditor
                        initialConfig={currentConfig}
                        studentName={name}
                        onSaveSuccess={handleSaveSuccess}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            )}
        </div>
    );
}
