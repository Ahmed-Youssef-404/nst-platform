// src/app/student/layout.tsx
import { LogoutButton } from "@/components/logout-button";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center justify-between border-b px-6 py-4">
                <h1 className="text-lg font-semibold">NST Platform</h1>
                <LogoutButton />
            </header>
            <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
        </div>
    );
}