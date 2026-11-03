import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Subtle ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent blur-3xl"
      />

      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 sm:py-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          <IconArrowLeft className="size-3.5" /> Back home
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground text-balance">{description}</p>
          </div>

          <Card className="overflow-hidden shadow-md">
            <CardContent className="p-6 sm:p-8">{children}</CardContent>
          </Card>

          {footer ? (
            <div className="mt-5 text-center text-xs text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
