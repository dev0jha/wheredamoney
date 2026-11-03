"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/client-api";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await clientFetch("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button
      variant={compact ? "ghost" : "outline"}
      size={compact ? "sm" : "default"}
      onClick={logout}
      disabled={pending}
      loading={pending}
      className={compact ? "w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-sm"}
    >
      <IconLogout className="size-4" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
