export const instant = false;

import Link from "next/link";
import { IconShieldExclamation, IconWallet } from "@tabler/icons-react";

import { Logo } from "@/components/logo";
import { DockNav } from "@/components/app/dock-nav";
import { LogoutButton } from "@/components/app/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { requireUser } from "@/lib/api";
import { initials } from "@/lib/utils";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-30">
        {/* Liquid Glass Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <LiquidGlass
            radius={0}
            bevelDepth={12}
            scale={40}
            aberration={4}
            frost={0}
            tint={0.12}
            className="size-full"
          />
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo href="/dashboard" />

          {/* User Identity & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/60 py-1 pl-1.5 pr-2 sm:pr-3 text-xs shadow-2xs">
              <Avatar className="size-6 sm:size-7 ring-1 ring-border">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-block max-w-[120px] truncate font-medium text-foreground">{user.name}</span>
            </div>
            <LogoutButton compact />
          </div>
        </div>
      </header>

      {/* Email Verification Alert Banner */}
      {!user.email_verified ? (
        <div className="flex items-center justify-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning sm:px-6">
          <IconShieldExclamation className="size-4 shrink-0" />
          <p className="leading-relaxed">
            Your email is unverified. We sent a verification link to{" "}
            <span className="font-semibold underline underline-offset-2">{user.email}</span>.
          </p>
        </div>
      ) : null}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:pb-32 lg:px-8">
        {children}
      </main>

      {/* Desktop & Tablet Subtle Footer */}
      <footer className="border-t border-border/60 px-6 py-4 pb-28 text-xs text-muted-foreground sm:pb-28">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <IconWallet className="size-3.5 text-primary" /> WhereDaMoney · Financial Clarity
          </span>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/expenses" className="transition-colors hover:text-foreground">
              Expenses
            </Link>
            <Link href="/incomes" className="transition-colors hover:text-foreground">
              Income
            </Link>
            <Link href="/settings" className="transition-colors hover:text-foreground">
              Settings
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Liquid Glass Dock */}
      <DockNav />
    </div>
  );
}
