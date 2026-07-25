// src/app/instructor/layout.tsx
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function InstructorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-6">
                    <Link href="/instructor">
                        <h1 className="text-lg font-semibold">
                            NST Platform — Instructor
                        </h1>
                    </Link>
                </div>
                <LogoutButton />
                <ThemeToggle />
            </header>
            <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        </div>
    );
}