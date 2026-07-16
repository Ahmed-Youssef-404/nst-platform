// src/components/logout-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={() => logoutAction()}>
      Log out
    </Button>
  );
}