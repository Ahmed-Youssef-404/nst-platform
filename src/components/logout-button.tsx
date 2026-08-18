// src/components/logout-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <Button variant="outline" onClick={() => logoutAction()} className={className}>
      Log out
    </Button>
  );
}