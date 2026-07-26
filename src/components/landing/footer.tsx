// src/components/landing/footer.tsx
export function Footer() {
    return (
        <footer className="border-t border-border py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
                <div className="flex items-center gap-2 font-display font-medium text-foreground">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs">
                        N
                    </span>
                    Northern Stars Team
                </div>
                <p>&copy; {new Date().getFullYear()} NST Platform. All rights reserved.</p>
            </div>
        </footer>
    );
}