"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/landing/primitives/magnetic";

/** One primary action (home) and one quiet secondary (back). */
export function NotFoundActions() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Magnetic>
                <Link
                    href="/"
                    className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-12 w-full gap-2.5 rounded-full bg-gold-500 px-8 text-base font-semibold text-space-950 shadow-[var(--shadow-gold-strong)] hover:bg-gold-400 sm:w-auto"
                    )}
                >
                    <House aria-hidden="true" />
                    Return to Home
                </Link>
            </Magnetic>
            <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => router.back()}
                className="h-12 gap-2 rounded-full px-6 text-base text-starlight-300 hover:text-starlight-100"
            >
                <ArrowLeft aria-hidden="true" />
                Go back
            </Button>
        </div>
    );
}
