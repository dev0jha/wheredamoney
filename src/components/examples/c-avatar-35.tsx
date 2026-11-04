"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronsUpDownIcon,
  SettingsIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  PlusIcon,
  Loader2Icon,
} from "lucide-react";
import { clientFetch } from "@/lib/client-api";
import { initials } from "@/lib/utils";
import type { User } from "@/lib/types";

export function UserAvatarMenu({ user }: { user: User }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await clientFetch("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-md border-dashed h-8 sm:h-8 gap-2 px-2.5 bg-card/60 hover:bg-card/90 border-border/80 shadow-none before:shadow-none transition-all cursor-pointer before:rounded-md"
          >
            <Avatar size="sm" className="size-5 sm:size-5 shrink-0 border-0">
              <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium max-w-[120px] truncate text-foreground">
              {user.name}
            </span>
            <ChevronsUpDownIcon className="size-3.5 opacity-60 text-muted-foreground shrink-0" aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent className="w-52" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal py-1.5 px-2">
            <div className="flex flex-col space-y-0.5">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
            <LayoutDashboardIcon className="size-4" aria-hidden="true" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
            <SettingsIcon className="size-4" aria-hidden="true" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/expenses/new")} className="cursor-pointer">
            <PlusIcon className="size-4" aria-hidden="true" />
            <span>Add expense</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={pending}
          className="cursor-pointer"
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOutIcon className="size-4" aria-hidden="true" />
          )}
          <span>{pending ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Alias for backwards compatibility
export { UserAvatarMenu as Pattern };
