export const instant = false;

import { Logo } from "@/components/logo";
import { DockNav } from "@/components/app/dock-nav";
import { UserAvatarMenu } from "@/components/examples/c-avatar-35";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { requireUser } from "@/lib/api";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-30">
        {/* Liquid Glass Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none dark:hidden">
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

          {/* User Identity & Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserAvatarMenu user={user} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:pb-32 lg:px-8">
        {children}
      </main>

      {/* Floating Liquid Glass Dock */}
      <DockNav />
    </div>
  );
}
