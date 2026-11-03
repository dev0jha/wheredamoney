export const instant = false;

import Link from "next/link";
import { IconShieldExclamation, IconWallet } from "@tabler/icons-react";

import { Logo } from "@/components/logo";
import { MobileNav, SidebarNav } from "@/components/app/nav";
import { LogoutButton } from "@/components/app/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { requireUser } from "@/lib/api";
import { initials } from "@/lib/utils";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[250px_1fr]">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card/60 p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 py-2">
          <Logo href="/dashboard" />
        </div>

        <div className="mt-8 flex-1">
          <SidebarNav />
        </div>

        {/* User Identity Box */}
        <div className="space-y-3 rounded-2xl border border-border bg-card/90 p-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 ring-1 ring-border">
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <LogoutButton compact />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-dvh flex-col pb-24 lg:pb-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Email Verification Alert Banner */}
        {!user.email_verified ? (
          <div className="flex items-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning sm:px-6">
            <IconShieldExclamation className="size-4 shrink-0" />
            <p className="leading-relaxed">
              Your email is unverified. We sent a verification link to{" "}
              <span className="font-semibold underline underline-offset-2">{user.email}</span>.
            </p>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>

        {/* Desktop Footer */}
        <footer className="hidden border-t border-border/80 px-6 py-4 text-xs text-muted-foreground lg:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <IconWallet className="size-3.5 text-primary" /> WhereDaMoney · Financial Clarity
            </span>
            <div className="flex items-center gap-4">
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
      </div>

      {/* Mobile Bottom Bar */}
      <MobileNav />
    </div>
  );
}
