// src/app/super-admin/layout.tsx
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-6">
                    <h1 className="text-lg font-semibold">NST Platform — SuperAdmin</h1>
                    <nav className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="/super-admin" className="hover:text-foreground">
                            Users
                        </Link>
                        <Link
                            href="/super-admin/batches"
                            className="hover:text-foreground"
                        >
                            Batches
                        </Link>
                    </nav>
                </div>
                <LogoutButton />
            </header>
            <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
        </div>
    );
}